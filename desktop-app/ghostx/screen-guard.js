// GhostX Screen Guard - Electron OS-Level Screenshot Protection
// setContentProtection(true) ile screenshot'ta SIYAH EKRAN
// Ekran kayit programi tespiti + uyari

const { BrowserWindow, desktopCapturer, ipcMain } = require('electron');
const { exec } = require('child_process');

let screenProtectionEnabled = false;
let recorderCheckInterval = null;

/**
 * OS seviyesinde ekran korumayi baslat
 * Screenshot alindiginda sadece SIYAH EKRAN yakalanir
 */
function enableContentProtection() {
  screenProtectionEnabled = true;
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    try {
      // Bu API hem Windows hem macOS'ta calisir
      // Screenshot/screen recording SIYAH EKRAN yakalar
      win.setContentProtection(true);
    } catch (e) {
      console.error('Content protection ayarlanamadi:', e.message);
    }
  }
}

/**
 * Ekran korumayi kapat
 */
function disableContentProtection() {
  screenProtectionEnabled = false;
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    try {
      win.setContentProtection(false);
    } catch (e) {
      // Sessizce gec
    }
  }
}

/**
 * Bilinen ekran kayit programlarini tara
 * Windows: tasklist komutu
 * macOS: ps komutu
 */
function checkForScreenRecorders(callback) {
  const knownRecorders = [
    // Windows
    'obs64.exe', 'obs32.exe', 'obs.exe',
    'bandicam.exe', 'bdcam.exe',
    'sharex.exe',
    'camtasia.exe', 'camrec.exe',
    'fraps.exe',
    'action.exe', 'mirillis',
    'xsplit.exe',
    'streamlabs.exe',
    'screencastify',
    'loom.exe',
    // macOS
    'obs', 'OBS',
    'QuickTime Player',
    'ScreenFlow',
    'Kap',
  ];

  const isWin = process.platform === 'win32';
  const command = isWin
    ? 'tasklist /FO CSV /NH'
    : 'ps aux';

  exec(command, { timeout: 5000 }, (error, stdout) => {
    if (error) {
      callback([]);
      return;
    }

    const detected = [];
    const output = stdout.toLowerCase();

    for (const recorder of knownRecorders) {
      if (output.includes(recorder.toLowerCase())) {
        detected.push(recorder);
      }
    }

    callback(detected);
  });
}

/**
 * Periyodik ekran kayit kontrolu baslat
 * Her 10 saniyede bir kontrol eder
 */
function startRecorderMonitoring(onDetected) {
  if (recorderCheckInterval) return;

  recorderCheckInterval = setInterval(() => {
    checkForScreenRecorders((detected) => {
      if (detected.length > 0) {
        onDetected(detected);
      }
    });
  }, 10000); // Her 10 saniye

  // Ilk kontrolu hemen yap
  checkForScreenRecorders((detected) => {
    if (detected.length > 0) {
      onDetected(detected);
    }
  });
}

/**
 * Ekran kayit kontrolunu durdur
 */
function stopRecorderMonitoring() {
  if (recorderCheckInterval) {
    clearInterval(recorderCheckInterval);
    recorderCheckInterval = null;
  }
}

/**
 * IPC handler'larini kur
 */
function setupScreenGuardIPC() {
  ipcMain.on('ghostx-screen-protect', (event, enabled) => {
    if (enabled) {
      enableContentProtection();

      // Ekran kayit monitoru baslat
      startRecorderMonitoring((detected) => {
        // Tum pencerelere bildir
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          try {
            win.webContents.send('ghostx-recorder-detected', detected);
          } catch {}
        }
      });
    } else {
      disableContentProtection();
      stopRecorderMonitoring();
    }
  });
}

module.exports = {
  enableContentProtection,
  disableContentProtection,
  checkForScreenRecorders,
  startRecorderMonitoring,
  stopRecorderMonitoring,
  setupScreenGuardIPC,
};
