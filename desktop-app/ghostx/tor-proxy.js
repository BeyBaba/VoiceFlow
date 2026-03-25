// GhostX Tor Proxy - IP Adresi Gizleme
// Electron ortaminda Tor SOCKS5 proxy uzerinden tum trafigi yonlendirir
// Web ortaminda kullaniciya Tor Browser kullanmasini onerir

const { session, ipcMain, app } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

let torProcess = null;
let torReady = false;
let torPort = 9050;
const TOR_CONTROL_PORT = 9051;

/**
 * Tor binary'nin yerini bul
 * Bundled veya sistem Tor'u kullanir
 */
function findTorBinary() {
  const platform = process.platform;

  // 1. Bundled Tor (uygulama icinde)
  const bundledPaths = {
    win32: path.join(app.getAppPath(), 'tor', 'tor.exe'),
    darwin: path.join(app.getAppPath(), 'tor', 'tor'),
    linux: path.join(app.getAppPath(), 'tor', 'tor'),
  };

  const bundled = bundledPaths[platform];
  if (bundled && fs.existsSync(bundled)) {
    return bundled;
  }

  // 2. Sistem Tor'u
  const systemPaths = {
    win32: ['C:\\Program Files\\Tor Browser\\Browser\\TorBrowser\\Tor\\tor.exe'],
    darwin: ['/usr/local/bin/tor', '/opt/homebrew/bin/tor'],
    linux: ['/usr/bin/tor', '/usr/local/bin/tor'],
  };

  const paths = systemPaths[platform] || [];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Kullanilabilir bir port bul
 */
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      // Port kullaniliyor, sonrakini dene
      if (startPort < 65535) {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(new Error('Kullanilabilir port bulunamadi'));
      }
    });
  });
}

/**
 * Tor process'ini baslat
 */
async function startTor() {
  if (torProcess) {
    return { success: true, port: torPort };
  }

  const torBinary = findTorBinary();

  if (!torBinary) {
    return {
      success: false,
      error: 'Tor bulunamadi. Lutfen Tor Browser yukleyin veya tor paketini kurun.',
      installInstructions: {
        win32: 'https://www.torproject.org/download/ adresinden Tor Browser indirin',
        darwin: 'brew install tor',
        linux: 'sudo apt install tor',
      }[process.platform],
    };
  }

  try {
    // Kullanilabilir port bul
    torPort = await findAvailablePort(9050);
    const controlPort = await findAvailablePort(TOR_CONTROL_PORT);

    // Tor data dizini
    const torDataDir = path.join(app.getPath('temp'), 'ghostx-tor-data');
    if (!fs.existsSync(torDataDir)) {
      fs.mkdirSync(torDataDir, { recursive: true });
    }

    // Tor'u baslat
    torProcess = spawn(torBinary, [
      '--SocksPort', String(torPort),
      '--ControlPort', String(controlPort),
      '--DataDirectory', torDataDir,
      '--GeoIPFile', '',         // GeoIP gereksiz
      '--GeoIPv6File', '',
      '--Log', 'notice stderr',
      '--HashedControlPassword', '', // Kontrol sifresiz (sadece localhost)
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Tor hazir olana kadar bekle
    return new Promise((resolve) => {
      let output = '';
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: 'Tor baslatma zamani asimi (60 saniye)',
        });
      }, 60000);

      torProcess.stderr.on('data', (data) => {
        output += data.toString();

        // "Bootstrapped 100%" mesajini ara
        if (output.includes('Bootstrapped 100%') || output.includes('Done')) {
          clearTimeout(timeout);
          torReady = true;
          resolve({ success: true, port: torPort });
        }
      });

      torProcess.on('error', (err) => {
        clearTimeout(timeout);
        torProcess = null;
        resolve({
          success: false,
          error: `Tor baslatma hatasi: ${err.message}`,
        });
      });

      torProcess.on('exit', (code) => {
        if (!torReady) {
          clearTimeout(timeout);
          torProcess = null;
          resolve({
            success: false,
            error: `Tor beklenmedik sekilde kapandi (kod: ${code})`,
          });
        }
      });
    });
  } catch (err) {
    return {
      success: false,
      error: `Tor baslatma hatasi: ${err.message}`,
    };
  }
}

/**
 * Tor process'ini durdur
 */
function stopTor() {
  if (torProcess) {
    torProcess.kill('SIGTERM');
    torProcess = null;
    torReady = false;
  }
}

/**
 * Electron oturumuna Tor proxy ayarla
 * Tum ag trafigi Tor uzerinden gider
 */
async function enableTorProxy() {
  const result = await startTor();

  if (!result.success) {
    return result;
  }

  try {
    // Varsayilan oturum icin proxy ayarla
    await session.defaultSession.setProxy({
      proxyRules: `socks5://127.0.0.1:${torPort}`,
      proxyBypassRules: '<local>', // Localhost haric her sey Tor uzerinden
    });

    return { success: true, port: torPort };
  } catch (err) {
    return {
      success: false,
      error: `Proxy ayarlama hatasi: ${err.message}`,
    };
  }
}

/**
 * Tor proxy'yi devre disi birak
 */
async function disableTorProxy() {
  try {
    await session.defaultSession.setProxy({
      proxyRules: '',
    });

    stopTor();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Proxy kaldirma hatasi: ${err.message}`,
    };
  }
}

/**
 * Tor uzerinden yeni devre (circuit) al
 * IP adresi degisir
 */
function newTorCircuit() {
  return new Promise((resolve) => {
    if (!torReady) {
      resolve({ success: false, error: 'Tor aktif degil' });
      return;
    }

    // NEWNYM sinyali gonder (yeni kimlik)
    const client = net.createConnection(TOR_CONTROL_PORT, '127.0.0.1', () => {
      client.write('AUTHENTICATE\r\n');
      client.write('SIGNAL NEWNYM\r\n');
      client.write('QUIT\r\n');
    });

    client.on('data', (data) => {
      const response = data.toString();
      if (response.includes('250 OK')) {
        resolve({ success: true });
      }
    });

    client.on('error', () => {
      resolve({ success: false, error: 'Tor kontrol baglantisi basarisiz' });
    });

    setTimeout(() => {
      client.destroy();
      resolve({ success: false, error: 'Tor kontrol zamani asimi' });
    }, 5000);
  });
}

/**
 * Tor durumunu kontrol et
 */
function getTorStatus() {
  return {
    isRunning: torProcess !== null && torReady,
    port: torPort,
    pid: torProcess?.pid || null,
  };
}

/**
 * IPC handler'larini kur
 */
function setupTorIPC() {
  ipcMain.handle('ghostx-tor-enable', async () => {
    return await enableTorProxy();
  });

  ipcMain.handle('ghostx-tor-disable', async () => {
    return await disableTorProxy();
  });

  ipcMain.handle('ghostx-tor-new-circuit', async () => {
    return await newTorCircuit();
  });

  ipcMain.handle('ghostx-tor-status', () => {
    return getTorStatus();
  });
}

// Uygulama kapanirken Tor'u da kapat
app.on('before-quit', () => {
  stopTor();
});

module.exports = {
  startTor,
  stopTor,
  enableTorProxy,
  disableTorProxy,
  newTorCircuit,
  getTorStatus,
  setupTorIPC,
};
