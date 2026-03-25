// GhostX P2P Peer Manager
// WebRTC ile dogrudan cihazdan cihaza baglanti
// Mesajlar SUNUCU UZERINDEN GECMEZ

import type {
  KeyPair,
  PeerInfo,
  P2PMessage,
  P2PMessageType,
  DecryptedMessage,
  SignalMessage,
} from './types';
import { SignalingClient } from './signaling';
import {
  generateKeyPair,
  deriveSharedSecret,
  encryptString,
  decryptToString,
  secureWipeAll,
  generateMessageId,
  kdfRootKey,
  kdfChainKey,
} from './crypto';

// Simple-peer import (runtime'da yuklenecek)
type SimplePeerInstance = {
  signal: (data: unknown) => void;
  send: (data: string | Uint8Array) => void;
  destroy: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  connected: boolean;
};

type SimplePeerConstructor = new (opts: {
  initiator: boolean;
  trickle: boolean;
  config?: RTCConfiguration;
}) => SimplePeerInstance;

let SimplePeer: SimplePeerConstructor | null = null;

export type MessageHandler = (peerId: string, message: DecryptedMessage) => void;
export type PeerEventHandler = (peerId: string, peerName: string) => void;
export type ScreenshotAlertHandler = (peerId: string, peerName: string) => void;

interface PeerConnection {
  peer: SimplePeerInstance;
  info: PeerInfo;
  sharedSecret: Uint8Array | null;
  sendChainKey: Uint8Array | null;
  recvChainKey: Uint8Array | null;
}

export class PeerManager {
  private peers: Map<string, PeerConnection> = new Map();
  private signaling: SignalingClient;
  private myKeyPair: KeyPair;
  private myPeerId: string;
  private myPeerName: string;
  private roomId: string;

  // Event handlers
  public onMessage: MessageHandler = () => {};
  public onPeerJoined: PeerEventHandler = () => {};
  public onPeerLeft: PeerEventHandler = () => {};
  public onScreenshotAlert: ScreenshotAlertHandler = () => {};

  constructor(
    roomId: string,
    peerId: string,
    peerName: string,
    keyPair: KeyPair
  ) {
    this.roomId = roomId;
    this.myPeerId = peerId;
    this.myPeerName = peerName;
    this.myKeyPair = keyPair;

    this.signaling = new SignalingClient(
      roomId,
      peerId,
      peerName,
      this.handleSignal.bind(this)
    );
  }

  /** Simple-peer kutuphanesini yukle */
  private async loadSimplePeer(): Promise<void> {
    if (SimplePeer) return;
    try {
      const mod = await import('simple-peer');
      SimplePeer = (mod.default || mod) as unknown as SimplePeerConstructor;
    } catch {
      throw new Error('simple-peer yuklenemedi');
    }
  }

  /** Odaya baglan ve peer'leri dinle */
  async joinRoom(): Promise<void> {
    await this.loadSimplePeer();

    // Signaling baglantisi ac
    this.signaling.connect();

    // Odaya katildigimizi duyur
    await this.signaling.sendSignal('peer-join', {
      peerId: this.myPeerId,
      peerName: this.myPeerName,
      publicKey: Array.from(this.myKeyPair.publicKey),
    });
  }

  /** Sinyal isleme */
  private async handleSignal(signal: SignalMessage): Promise<void> {
    const data = JSON.parse(signal.payload);

    switch (signal.type) {
      case 'peer-join':
        await this.handlePeerJoin(signal.peerId, signal.peerName, data);
        break;
      case 'offer':
      case 'answer':
      case 'ice':
        this.handleWebRTCSignal(signal.peerId, data);
        break;
      case 'peer-leave':
        this.handlePeerLeave(signal.peerId);
        break;
    }
  }

  /** Yeni peer katildiginda */
  private async handlePeerJoin(
    peerId: string,
    peerName: string,
    data: { publicKey: number[] }
  ): Promise<void> {
    if (peerId === this.myPeerId) return;
    if (this.peers.has(peerId)) return;

    const theirPublicKey = new Uint8Array(data.publicKey);

    // Initiator: lexicographic olarak kucuk olan peer baslatir
    const isInitiator = this.myPeerId < peerId;

    const peer = new SimplePeer!({
      initiator: isInitiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    // Shared secret hesapla (E2EE icin)
    const sharedSecret = deriveSharedSecret(
      this.myKeyPair.secretKey,
      theirPublicKey
    );

    // Chain key'leri turet
    const { rootKey: _, chainKey } = kdfRootKey(sharedSecret, sharedSecret);

    const connection: PeerConnection = {
      peer,
      info: {
        id: peerId,
        name: peerName,
        publicKey: theirPublicKey,
        isConnected: false,
        lastSeen: Date.now(),
      },
      sharedSecret,
      sendChainKey: chainKey,
      recvChainKey: new Uint8Array(chainKey),
    };

    this.peers.set(peerId, connection);

    // WebRTC event'leri
    peer.on('signal', (signalData: unknown) => {
      const type = (signalData as { type?: string }).type === 'offer' ? 'offer' :
                   (signalData as { type?: string }).type === 'answer' ? 'answer' : 'ice';
      this.signaling.sendSignal(type as 'offer' | 'answer' | 'ice', signalData);
    });

    peer.on('connect', () => {
      connection.info.isConnected = true;
      this.onPeerJoined(peerId, peerName);
    });

    peer.on('data', (rawData: unknown) => {
      this.handleP2PData(peerId, rawData as Uint8Array | string);
    });

    peer.on('close', () => {
      this.handlePeerLeave(peerId);
    });

    peer.on('error', () => {
      this.handlePeerLeave(peerId);
    });

    // Eger initiator degilsek, karsi tarafa da peer-join gonder
    if (!isInitiator) {
      await this.signaling.sendSignal('peer-join', {
        peerId: this.myPeerId,
        peerName: this.myPeerName,
        publicKey: Array.from(this.myKeyPair.publicKey),
      });
    }
  }

  /** WebRTC sinyalini ilgili peer'e ilet */
  private handleWebRTCSignal(peerId: string, signalData: unknown): void {
    const connection = this.peers.get(peerId);
    if (connection) {
      connection.peer.signal(signalData);
    }
  }

  /** Peer ayrildiginda */
  private handlePeerLeave(peerId: string): void {
    const connection = this.peers.get(peerId);
    if (!connection) return;

    const peerName = connection.info.name;

    // Guvenli temizlik
    try { connection.peer.destroy(); } catch { /* */ }
    if (connection.sharedSecret) secureWipeAll(connection.sharedSecret);
    if (connection.sendChainKey) secureWipeAll(connection.sendChainKey);
    if (connection.recvChainKey) secureWipeAll(connection.recvChainKey);
    secureWipeAll(connection.info.publicKey);

    this.peers.delete(peerId);
    this.onPeerLeft(peerId, peerName);
  }

  // === Mesaj Gonderme ===

  /** Tum peer'lere mesaj gonder */
  sendToAll(type: P2PMessageType, payload: string): void {
    const message: P2PMessage = {
      type,
      id: generateMessageId(),
      senderId: this.myPeerId,
      payload,
      timestamp: Date.now(),
    };

    const json = JSON.stringify(message);

    for (const [, connection] of this.peers) {
      if (connection.peer.connected && connection.sendChainKey) {
        // Sifrele ve gonder
        const encrypted = encryptString(json, connection.sendChainKey);
        // Chain key'i ilerlet
        const { chainKey: newCK } = kdfChainKey(connection.sendChainKey);
        connection.sendChainKey = newCK;

        const packet = JSON.stringify({
          c: Array.from(encrypted.ciphertext),
          n: Array.from(encrypted.nonce),
        });
        connection.peer.send(packet);
      }
    }
  }

  /** Metin mesaji gonder */
  sendMessage(text: string, disappearAfter?: number): void {
    const payload = JSON.stringify({
      text,
      senderName: this.myPeerName,
      disappearAfter,
    });
    this.sendToAll('chat', payload);
  }

  /** Screenshot uyarisi gonder */
  sendScreenshotAlert(): void {
    this.sendToAll('screenshot-alert', JSON.stringify({
      senderName: this.myPeerName,
    }));
  }

  // === Mesaj Alma ===

  /** P2P veri isleme */
  private handleP2PData(peerId: string, rawData: Uint8Array | string): void {
    const connection = this.peers.get(peerId);
    if (!connection || !connection.recvChainKey) return;

    try {
      const dataStr = typeof rawData === 'string'
        ? rawData
        : new TextDecoder().decode(rawData);

      const packet = JSON.parse(dataStr);
      const ciphertext = new Uint8Array(packet.c);
      const nonce = new Uint8Array(packet.n);

      // Coz
      const json = decryptToString(ciphertext, nonce, connection.recvChainKey);

      // Chain key'i ilerlet
      const { chainKey: newCK } = kdfChainKey(connection.recvChainKey);
      connection.recvChainKey = newCK;

      const message: P2PMessage = JSON.parse(json);
      this.processMessage(peerId, message);
    } catch {
      // Cozme hatasi - muhtemelen anahtar uyumsuzlugu
    }
  }

  /** Cozulmus mesaji isle */
  private processMessage(peerId: string, message: P2PMessage): void {
    switch (message.type) {
      case 'chat': {
        const data = JSON.parse(message.payload);
        const decrypted: DecryptedMessage = {
          id: message.id,
          roomId: this.roomId,
          senderId: peerId,
          senderName: data.senderName,
          type: 'text',
          content: data.text,
          timestamp: message.timestamp,
          status: 'delivered',
          disappearAfter: data.disappearAfter,
        };
        this.onMessage(peerId, decrypted);

        // Alindi bildirimi gonder
        this.sendAck(message.id);
        break;
      }
      case 'ack': {
        // Mesaj alindi bildirimi
        break;
      }
      case 'read': {
        // Mesaj okundu bildirimi
        break;
      }
      case 'screenshot-alert': {
        const data = JSON.parse(message.payload);
        this.onScreenshotAlert(peerId, data.senderName);
        break;
      }
    }
  }

  /** Mesaj alindi bildirimi gonder */
  private sendAck(messageId: string): void {
    this.sendToAll('ack', JSON.stringify({ messageId }));
  }

  // === Temizlik ===

  /** Tum baglantiları kapat ve anahtarlari sil */
  disconnect(): void {
    // Odadan ayrildigimizi duyur
    this.signaling.sendSignal('peer-leave', {
      peerId: this.myPeerId,
    }).catch(() => {});

    // Tum peer baglantilarini kapat
    for (const [peerId] of this.peers) {
      this.handlePeerLeave(peerId);
    }

    // Signaling kapat
    this.signaling.disconnect();
  }

  /** Bagli peer listesi */
  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values())
      .filter(c => c.info.isConnected)
      .map(c => c.info);
  }

  /** Bagli peer sayisi */
  get connectedCount(): number {
    return this.getConnectedPeers().length;
  }
}
