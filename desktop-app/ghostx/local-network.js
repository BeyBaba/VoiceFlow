// GhostX Local Network - Bluetooth Low Energy + Wi-Fi Direct
// Internet olmadan yakinlardaki cihazlarla baglanti kurar
// Electron (Desktop) ortaminda calisir

const { ipcMain } = require('electron');
const dgram = require('dgram');
const net = require('net');
const crypto = require('crypto');

// === Wi-Fi Direct / mDNS ile Peer Kesfetme ===
// UDP multicast ile yerel agdaki GhostX peer'lerini kesfeder

const MULTICAST_ADDR = '239.255.42.99';
const MULTICAST_PORT = 42099;
const TCP_PORT_BASE = 42100;

class LocalNetworkManager {
  constructor() {
    this.discoveredPeers = new Map(); // peerId -> { address, port, name, publicKey }
    this.tcpServer = null;
    this.udpSocket = null;
    this.myPeerId = '';
    this.myPeerName = '';
    this.onPeerDiscovered = null;
    this.onPeerLost = null;
    this.onMessage = null;
    this.connections = new Map(); // peerId -> net.Socket
    this.isRunning = false;
  }

  /**
   * Yerel ag kesiflemeyi baslat
   * @param {string} peerId - Bizim peer ID'miz
   * @param {string} peerName - Bizim gorunen ismimiz
   * @param {string} roomCode - Oda kodu (sadece ayni odadakileri kesfet)
   */
  start(peerId, peerName, roomCode) {
    this.myPeerId = peerId;
    this.myPeerName = peerName;
    this.roomCode = roomCode;
    this.isRunning = true;

    this._startUDPDiscovery();
    this._startTCPServer();
  }

  /** UDP multicast ile kendimizi duyur ve baskalarini kesfet */
  _startUDPDiscovery() {
    this.udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.udpSocket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.peerId === this.myPeerId) return; // Kendimizi yoksay
        if (data.roomCode !== this.roomCode) return; // Farkli oda

        const key = data.peerId;
        const isNew = !this.discoveredPeers.has(key);

        this.discoveredPeers.set(key, {
          address: rinfo.address,
          port: data.tcpPort,
          name: data.peerName,
          lastSeen: Date.now(),
        });

        if (isNew && this.onPeerDiscovered) {
          this.onPeerDiscovered({
            peerId: data.peerId,
            peerName: data.peerName,
            address: rinfo.address,
            port: data.tcpPort,
          });
        }
      } catch {
        // Parse hatasi, gec
      }
    });

    this.udpSocket.bind(MULTICAST_PORT, () => {
      this.udpSocket.addMembership(MULTICAST_ADDR);
      this.udpSocket.setMulticastTTL(128);
      this.udpSocket.setBroadcast(true);

      // Her 2 saniyede kendimizi duyur
      this._announceInterval = setInterval(() => {
        if (!this.isRunning) return;
        const message = JSON.stringify({
          type: 'ghostx-announce',
          peerId: this.myPeerId,
          peerName: this.myPeerName,
          roomCode: this.roomCode,
          tcpPort: this.tcpPort,
          timestamp: Date.now(),
        });
        this.udpSocket.send(message, MULTICAST_PORT, MULTICAST_ADDR);
      }, 2000);

      // Her 10 saniyede kayip peer'leri temizle
      this._cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [peerId, info] of this.discoveredPeers) {
          if (now - info.lastSeen > 15000) {
            this.discoveredPeers.delete(peerId);
            if (this.onPeerLost) {
              this.onPeerLost({ peerId, peerName: info.name });
            }
          }
        }
      }, 10000);
    });
  }

  /** TCP sunucu: Dogrudan mesaj alisveri icin */
  _startTCPServer() {
    this.tcpPort = TCP_PORT_BASE + Math.floor(Math.random() * 100);
    this.tcpServer = net.createServer((socket) => {
      let buffer = '';

      socket.on('data', (data) => {
        buffer += data.toString();
        // Newline ile ayrilmis JSON mesajlari
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === 'hello') {
              // Peer baglantisinI kaydet
              this.connections.set(msg.peerId, socket);
            } else if (this.onMessage) {
              this.onMessage(msg);
            }
          } catch {
            // Parse hatasi
          }
        }
      });

      socket.on('close', () => {
        // Bagli peer'i bul ve kaldir
        for (const [peerId, conn] of this.connections) {
          if (conn === socket) {
            this.connections.delete(peerId);
            break;
          }
        }
      });

      socket.on('error', () => {
        // Baglanti hatasi, sessizce kapat
      });
    });

    this.tcpServer.listen(this.tcpPort, '0.0.0.0');
  }

  /** Peer'a baglan (TCP) */
  connectToPeer(peerId) {
    const peer = this.discoveredPeers.get(peerId);
    if (!peer) return;

    const socket = new net.Socket();
    socket.connect(peer.port, peer.address, () => {
      this.connections.set(peerId, socket);
      // Hello mesaji gonder
      this._sendRaw(socket, {
        type: 'hello',
        peerId: this.myPeerId,
        peerName: this.myPeerName,
      });
    });

    socket.on('data', (data) => {
      try {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          const msg = JSON.parse(line);
          if (this.onMessage) {
            this.onMessage(msg);
          }
        }
      } catch {
        // Parse hatasi
      }
    });

    socket.on('error', () => {
      this.connections.delete(peerId);
    });
  }

  /** Mesaj gonder (sifreli - sifreleme cagiranin sorumlulugunda) */
  sendMessage(peerId, message) {
    const socket = this.connections.get(peerId);
    if (socket) {
      this._sendRaw(socket, message);
    }
  }

  /** Tum bagli peer'lere mesaj gonder */
  broadcast(message) {
    for (const [, socket] of this.connections) {
      this._sendRaw(socket, message);
    }
  }

  /** TCP uzerinden JSON mesaj gonder */
  _sendRaw(socket, data) {
    try {
      socket.write(JSON.stringify(data) + '\n');
    } catch {
      // Gonderim hatasi
    }
  }

  /** Her seyi kapat */
  stop() {
    this.isRunning = false;

    if (this._announceInterval) clearInterval(this._announceInterval);
    if (this._cleanupInterval) clearInterval(this._cleanupInterval);

    for (const [, socket] of this.connections) {
      try { socket.destroy(); } catch { /* */ }
    }
    this.connections.clear();

    if (this.udpSocket) {
      try { this.udpSocket.close(); } catch { /* */ }
      this.udpSocket = null;
    }

    if (this.tcpServer) {
      try { this.tcpServer.close(); } catch { /* */ }
      this.tcpServer = null;
    }

    this.discoveredPeers.clear();
  }

  /** Kesfedilmis peer listesi */
  getPeers() {
    return Array.from(this.discoveredPeers.entries()).map(([id, info]) => ({
      peerId: id,
      peerName: info.name,
      address: info.address,
      port: info.port,
    }));
  }
}

// === Electron IPC Entegrasyonu ===

let localNetwork = null;

function setupLocalNetworkIPC() {
  ipcMain.handle('ghostx-local-start', (event, { peerId, peerName, roomCode }) => {
    if (localNetwork) localNetwork.stop();
    localNetwork = new LocalNetworkManager();

    localNetwork.onPeerDiscovered = (peer) => {
      event.sender.send('ghostx-local-peer-discovered', peer);
    };

    localNetwork.onPeerLost = (peer) => {
      event.sender.send('ghostx-local-peer-lost', peer);
    };

    localNetwork.onMessage = (msg) => {
      event.sender.send('ghostx-local-message', msg);
    };

    localNetwork.start(peerId, peerName, roomCode);
    return { ok: true, port: localNetwork.tcpPort };
  });

  ipcMain.handle('ghostx-local-stop', () => {
    if (localNetwork) {
      localNetwork.stop();
      localNetwork = null;
    }
    return { ok: true };
  });

  ipcMain.handle('ghostx-local-connect', (event, { peerId }) => {
    if (localNetwork) {
      localNetwork.connectToPeer(peerId);
    }
    return { ok: true };
  });

  ipcMain.handle('ghostx-local-send', (event, { peerId, message }) => {
    if (localNetwork) {
      localNetwork.sendMessage(peerId, message);
    }
    return { ok: true };
  });

  ipcMain.handle('ghostx-local-broadcast', (event, { message }) => {
    if (localNetwork) {
      localNetwork.broadcast(message);
    }
    return { ok: true };
  });

  ipcMain.handle('ghostx-local-peers', () => {
    return localNetwork ? localNetwork.getPeers() : [];
  });
}

module.exports = { LocalNetworkManager, setupLocalNetworkIPC };
