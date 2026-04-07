const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, screen, clipboard, shell, dialog, powerSaveBlocker } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const http = require("http");
const { autoUpdater } = require("electron-updater");

// ========== GLOBAL ERROR HANDLERS ==========
// Prevent app from crashing on uncaught errors (e.g. autoUpdater in dev mode)
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

// ========== CHANGELOG ==========
const CHANGELOG = {
  "4.7.7": [
    "Guc Modu'na 'Kapat' butonu eklendi — durum kartindan tek tikla kapatilabilir",
    "Guc Modu toggle'i her zaman gorunur — test sonrasi bekleme kaldirildi",
    "Alt cubuk (pill bar) varsayilan olarak KAPALI (HTML uyumlulugu duzeltildi)",
    "Tum butonlar ve toggle'lar dogrulandi — hepsi calisiyor",
  ],
  "4.7.6": [
    "Vosk model indirme hatasi duzeltildi — file.close() race condition fix",
    "Transkripsiyon gecmisi kapali iken gecmis kaydedilmiyor",
    "Otomatik yapistir varsayilan ACIK",
    "Maksimum kayit suresi varsayilan 5 dakika",
    "AI Modeli varsayilan Whisper v3 Turbo",
    "Program her zaman Ana Sayfa'dan basliyor",
  ],
  "4.7.5": [
    "Dikte cubugu suruklenince pozisyonunu hatirliyor — bir sonraki acilista ayni yerde",
    "Pill bar startup'da hic olusturulmuyor — sadece ayarlardan acilinca yaratiliyor",
    "Guc Modu stabil acik — premium/Super User kontrolu duzeltildi",
  ],
  "4.7.4": [
    "Setup wizard ilk kurulumda on planda aciliyor — setup bitmeden ana ekran gelmiyor",
    "Pill bar varsayilan KAPALI — sadece ayarlardan acilabilir",
    "Guc Modu varsayilan ACIK geliyor",
    "Vosk free-form tanima — grammar mode kaldirildi, gercek confidence skorlari",
    "Wake word hassasiyeti ciddi olarak iyilestirildi — sahte tetiklenmeler engellendi",
    "Changelog: sadece guncel versiyon gorunuyor + Gelisim Sureci butonu",
  ],
  "4.7.3": [
    "Ilk kurulumda login ekrani otomatik on planda aciliyor",
    "Otomatik guncelleme dialog'u kaldirildi — sessizce acik, ayarlardan kapatilabilir",
    "Login ekraninda pill bar (Ctrl+Space) artik hic olusturulmuyor",
    "Vosk indirme hatasi dogru mesaj gosteriyor (mikrofon hatasi degil)",
    "Vosk retry'da progress bar ve dil adi gosteriyor (Turkce/Ingilizce)",
    "Guncelleme gelince haber ver + otomatik guncelle ayarlari eklendi",
  ],
  "4.7.2": [
    "Tum ikonlar RGBA renkli — gradient teal-indigo dogru gorunuyor",
    "Login ekraninda dikte penceresi artik gorunmuyor",
    "Vosk model yukleme takildiysa 'Yeniden Dene' butonu",
    "Hassasiyet varsayilan seviye 2 (Dusuk) olarak basliyor",
    "Kurulum 'Bu bilgisayari kullanan herkes' secili geliyor",
  ],
  "4.7.1": [
    "Setup ekrani ilk kurulumda otomatik on planda aciliyor",
    "Pill bar (Ctrl+Space bar) varsayilan olarak gizli",
    "Wake word alanlari arasinda TAB ile gecis",
    "Guc Modu'nda mikrofon secimi dropdown eklendi",
    "Vosk model indirme takilirsa 'Yeniden Dene' butonu",
    "Kurulum sonrasi Windows ikon cache yenileniyor",
  ],
  "4.7.0": [
    "Dikte penceresi kapanma sorunu KESIN cozuldu — blur handler tamamen devre disi",
    "Pencere SADECE ESC, Ctrl+Space veya Kapat butonu ile kapaniyor",
    "Uyanma kelimesi hassasiyeti duzeltildi — sahte tetiklenmeler engellendi",
    "Confidence threshold'lari yukseltildi (seviye 1 icin %99)",
    "Chrome extension mikrofon izni akisi iyilestirildi",
  ],
  "4.6.2": [
    "Dikte penceresi artik SADECE ESC veya Ctrl+Space ile kapaniyor",
    "Auto-hide timer tamamen kaldirildi — kendi kendine kapanma yok",
    "Blur handler 3 saniye + isFocused kontrolu ile guvenli hale getirildi",
  ],
  "4.6.1": [
    "Dikte sirasinda pencere kapanma sorunu (auto-hide timer fix)",
    "Logo duzeltildi — website ile ayni gradient (teal-indigo, yuvarlak kose)",
    "Hakkinda sayfasinda acilir/kapanir versiyon gecmisi eklendi",
  ],
  "4.6.0": [
    "Yeni mavi mikrofon logosu — tum platformlarda",
    "Kayit sirasinda logo kirmiziya donuyor (tray + pencereler)",
    "Guc Modu hassasiyet ayari eklendi (1-5 arasi slider)",
    "Uyanma kelimesi eslestirmesi siklestirildi (Vosk guven skoru kontrolu)",
    "Dikte sirasinda pencere kapanma sorunu tamamen duzeltildi",
  ],
  "4.5.1": [
    "Dikte sirasinda pencerenin kapanma sorunu duzeltildi",
    "Sonuc ekrani artik 4 saniye sonra otomatik kapaniyor",
    "Indirme linki cache sorunu duzeltildi",
  ],
  "4.5.0": [
    "Yerel ses tanima motoru (Vosk) eklendi — internet gerektirmez",
    "Uyanma kelimesi artik yerel olarak algilaniyor (API yok)",
    "12 dil icin otomatik model indirme destegi",
    "Uygulama cokme sorunu duzeltildi",
    "Yeni versiyon bildirimi eklendi",
  ],
  "4.4.1": [
    "Vosk model indirme ilerleme cubugu eklendi",
    "Model indirme main process uzerinden yapiliyor",
  ],
  "4.4.0": [
    "Vosk yerel ses tanima entegrasyonu",
    "Power Mode artik API gerektirmiyor",
  ],
  "4.3.5": [
    "Super User icin rate limit mesajlari iyilestirildi",
    "API Maliyet sayfasi duzeltildi",
    "Taskbar ikonu duzeltildi",
  ],
};

let mainWindow = null;
let pillWindow = null;
let settingsWindow = null;
let homeWindow = null;
// powerModeWindow removed — power mode runs in homeWindow
let tray = null;
let isRecording = false;
let isProcessingResult = false; // Prevents blur from hiding window during transcription/result display
let resultAutoHideTimer = null; // Timer for auto-hiding result window
let powerModeActive = false;
let wakeWordTriggered = false; // Prevents blur from hiding window during wake word activation

// ========== SETTINGS ==========
function getSettingsPath() {
  return path.join(app.getPath("userData"), "vf-settings.json");
}

function loadSettings() {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  } catch {}
  return {};
}

function saveSettings(data) {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Settings save error:", err);
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Double-click desktop icon → open home window
    createHomeWindow();
  });
}

// ========== MAIN WINDOW ==========
function createMainWindow() {
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  const settings = loadSettings();
  const isFirstRun = !settings.setupComplete;

  const winWidth = isFirstRun ? 420 : 380;
  const winHeight = isFirstRun ? 560 : 120;

  // Use saved position if available, otherwise center on first run / top-right on normal
  let winX, winY;
  if (!isFirstRun && settings.mainWindowX !== undefined && settings.mainWindowY !== undefined) {
    winX = settings.mainWindowX;
    winY = settings.mainWindowY;
  } else if (isFirstRun) {
    winX = Math.round((screenWidth - winWidth) / 2);
    winY = Math.round((screenHeight - winHeight) / 2);
  } else {
    winX = screenWidth - 400;
    winY = 120;
  }

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: winX,
    y: winY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: false,
    show: false,
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Keep AudioContext alive for sound effects
    },
  });

  mainWindow.loadFile("ui/index.html");

  // Force set icon at runtime to override Windows cache
  const mainIcon = nativeImage.createFromPath(path.join(__dirname, "assets", "icon.ico"));
  if (!mainIcon.isEmpty()) {
    mainWindow.setIcon(mainIcon);
  }

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  // Save position when user drags the window
  mainWindow.on("moved", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [x, y] = mainWindow.getPosition();
      const s = loadSettings();
      s.mainWindowX = x;
      s.mainWindowY = y;
      saveSettings(s);
    }
  });

  mainWindow.on("blur", () => {
    // Window NEVER auto-hides on blur. Period.
    // Only closes via explicit user action:
    // 1. ESC key
    // 2. Ctrl+Space (toggle-recording)
    // 3. "Kapat" button (hide-window IPC)
    // 4. Auto-paste flow
  });

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    const s = loadSettings();
    if (!s.setupComplete) {
      // First run — show setup wizard in foreground
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
      mainWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(false);
          mainWindow.focus();
        }
      }, 500);
    } else if (s.isAuthenticated) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ========== BOTTOM PILL WINDOW ==========
function createPillWindow() {
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;

  const pillWidth = 320;
  const pillHeight = 52;

  // Check pill position setting
  const settings = loadSettings();
  let pillX;
  if (settings.pillPosition === "right") {
    pillX = screenWidth - pillWidth - 20;
  } else if (settings.pillPosition === "left") {
    pillX = 20;
  } else {
    pillX = Math.round((screenWidth - pillWidth) / 2);
  }

  pillWindow = new BrowserWindow({
    width: pillWidth,
    height: pillHeight,
    x: pillX,
    y: screenHeight - pillHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  pillWindow.loadFile("ui/pill.html");

  pillWindow.webContents.on("did-finish-load", () => {
    // Pill is hidden by default — only show if explicitly enabled in settings
    const settings = loadSettings();
    if (settings.showPill === true && settings.setupComplete && settings.isAuthenticated) {
      pillWindow.show();
    }
  });

  pillWindow.on("blur", () => {
    // Keep pill always visible, don't hide on blur
  });

  pillWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      pillWindow.hide();
    }
  });
}

function showPill() {
  if (pillWindow && !pillWindow.isDestroyed()) {
    const settings = loadSettings();
    if (settings.showPill === true && settings.setupComplete && settings.isAuthenticated) {
      pillWindow.show();
    }
  }
}

function hidePill() {
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.hide();
  }
}

function updatePillState(state) {
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.webContents.send("pill-state", state);
  }
}

// ========== SETTINGS WINDOW ==========
// settings.html artık kullanılmıyor — home.html'deki ayarlar bölümüne yönlendir
function createSettingsWindow() {
  createHomeWindow("s-general");
}

// ========== HOME WINDOW ==========
function createHomeWindow(navigateTo) {
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.show();
    homeWindow.focus();
    // Navigate to specific page, or reset to home page if no target
    homeWindow.webContents.send("show-page", navigateTo || "home");
    return;
  }

  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;

  // Open at 63% of screen size (responsive), cap for ultra-wide displays
  const rawWidth = Math.round(screenWidth * 0.63);
  const rawHeight = Math.round(screenHeight * 0.63);
  const winWidth = Math.min(rawWidth, 1600);
  const winHeight = Math.min(rawHeight, 1000);

  homeWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.round((screenWidth - winWidth) / 2),
    y: Math.round((screenHeight - winHeight) / 2),
    frame: true,
    resizable: true,
    minWidth: 700,
    minHeight: 500,
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Keep mic/AudioContext alive when minimized/hidden
    },
  });

  homeWindow.setMenuBarVisibility(false);
  homeWindow.loadFile("ui/home.html");

  // Always bring to front when opened — force foreground on Windows
  homeWindow.webContents.on("did-finish-load", () => {
    // Force set icon at runtime to override Windows cache
    const runtimeIcon = nativeImage.createFromPath(path.join(__dirname, "assets", "icon.ico"));
    if (!runtimeIcon.isEmpty()) {
      homeWindow.setIcon(runtimeIcon);
    }
    homeWindow.show();
    homeWindow.focus();
    homeWindow.moveTop();
    // Force to foreground on Windows (temporarily set alwaysOnTop then release)
    homeWindow.setAlwaysOnTop(true);
    setTimeout(() => {
      if (homeWindow && !homeWindow.isDestroyed()) {
        homeWindow.setAlwaysOnTop(false);
        homeWindow.focus();
      }
    }, 500);
    // Open DevTools in dev mode for debugging
    if (!app.isPackaged) homeWindow.webContents.openDevTools({ mode: "detach" });
    // Navigate to specific page if requested
    if (navigateTo) {
      homeWindow.webContents.send("show-page", navigateTo);
    }
  });

  // Resume power mode when homeWindow regains focus, is restored, or shown
  homeWindow.on("focus", () => {
    if (powerModeActive && homeWindow && !homeWindow.isDestroyed()) {
      homeWindow.webContents.send("power-mode-resume");
    }
  });
  homeWindow.on("restore", () => {
    if (powerModeActive && homeWindow && !homeWindow.isDestroyed()) {
      homeWindow.webContents.send("power-mode-resume");
    }
  });
  homeWindow.on("show", () => {
    if (powerModeActive && homeWindow && !homeWindow.isDestroyed()) {
      homeWindow.webContents.send("power-mode-resume");
    }
  });
  // Keep power mode alive when window is minimized or loses focus
  homeWindow.on("minimize", () => {
    if (powerModeActive && homeWindow && !homeWindow.isDestroyed()) {
      // Send resume after a short delay to counteract Chromium AudioContext suspension
      setTimeout(() => {
        if (homeWindow && !homeWindow.isDestroyed()) {
          homeWindow.webContents.send("power-mode-resume");
        }
      }, 500);
    }
  });
  homeWindow.on("blur", () => {
    if (powerModeActive && homeWindow && !homeWindow.isDestroyed()) {
      setTimeout(() => {
        if (homeWindow && !homeWindow.isDestroyed()) {
          homeWindow.webContents.send("power-mode-resume");
        }
      }, 500);
    }
  });

  // Don't destroy on close — hide instead (keeps Power Mode mic alive)
  homeWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      homeWindow.hide();
    }
  });
}

// ========== TRAY ==========
function createTray() {
  // Use the app icon (gradient mic) for tray — much nicer than plain circle
  const icon16 = path.join(__dirname, "assets", "icon-16.png");
  const icon32 = path.join(__dirname, "assets", "icon-32.png");
  let trayIcon;

  try {
    if (fs.existsSync(icon32)) {
      trayIcon = nativeImage.createFromPath(icon32);
      // Resize to 16x16 for crisp tray display
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
      if (trayIcon.isEmpty()) {
        trayIcon = createFallbackIcon();
      }
    } else if (fs.existsSync(icon16)) {
      trayIcon = nativeImage.createFromPath(icon16);
      if (trayIcon.isEmpty()) {
        trayIcon = createFallbackIcon();
      }
    } else {
      trayIcon = createFallbackIcon();
    }
  } catch {
    trayIcon = createFallbackIcon();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("VoiceFlow - Ctrl+Space ile dikte et");

  // Build language submenu
  const settings = loadSettings();
  const currentLang = settings.language || "tr";

  const languageItems = [
    { code: "tr", label: "Turkce", flag: "TR" },
    { code: "en", label: "English", flag: "EN" },
    { code: "de", label: "Deutsch", flag: "DE" },
    { code: "fr", label: "Francais", flag: "FR" },
    { code: "es", label: "Espanol", flag: "ES" },
    { code: "ja", label: "Japanese", flag: "JP" },
    { code: "ko", label: "Korean", flag: "KR" },
    { code: "zh", label: "Chinese", flag: "CN" },
    { code: "pt", label: "Portugues", flag: "PT" },
    { code: "it", label: "Italiano", flag: "IT" },
    { code: "ru", label: "Russian", flag: "RU" },
    { code: "ar", label: "Arabic", flag: "AR" },
  ];

  const langSubmenu = languageItems.map(lang => ({
    label: `${lang.flag} ${lang.label}`,
    type: "radio",
    checked: currentLang === lang.code,
    click: () => {
      const s = loadSettings();
      s.language = lang.code;
      saveSettings(s);
      // Refresh tray to update radio state
      rebuildTrayMenu();
    },
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Dikte Et (" + ((loadSettings().shortcuts || {}).dictate || "CommandOrControl+Space").replace("CommandOrControl+","Ctrl+") + ")",
      click: () => toggleRecording(),
    },
    { type: "separator" },
    {
      label: "Ana Sayfa",
      click: () => createHomeWindow(),
    },
    {
      label: "Pencereyi Goster",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Dil",
      submenu: langSubmenu,
    },
    {
      label: "Ayarlar",
      click: () => createHomeWindow("s-general"),
    },
    { type: "separator" },
    {
      label: "Cikis",
      click: () => {
        app.isQuitting = true;
        if (pillWindow) pillWindow.destroy();
        if (homeWindow && !homeWindow.isDestroyed()) homeWindow.destroy();
        if (mainWindow) mainWindow.destroy();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        toggleRecording();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on("double-click", () => {
    createHomeWindow();
  });
}

function rebuildTrayMenu() {
  if (tray) {
    tray.removeAllListeners("click");
    tray.removeAllListeners("double-click");
    // Recreate
    const settings = loadSettings();
    const currentLang = settings.language || "tr";

    const languageItems = [
      { code: "tr", label: "Turkce", flag: "TR" },
      { code: "en", label: "English", flag: "EN" },
      { code: "de", label: "Deutsch", flag: "DE" },
      { code: "fr", label: "Francais", flag: "FR" },
      { code: "es", label: "Espanol", flag: "ES" },
      { code: "ja", label: "Japanese", flag: "JP" },
      { code: "ko", label: "Korean", flag: "KR" },
      { code: "zh", label: "Chinese", flag: "CN" },
      { code: "pt", label: "Portugues", flag: "PT" },
      { code: "it", label: "Italiano", flag: "IT" },
      { code: "ru", label: "Russian", flag: "RU" },
      { code: "ar", label: "Arabic", flag: "AR" },
    ];

    const langSubmenu = languageItems.map(lang => ({
      label: `${lang.flag} ${lang.label}`,
      type: "radio",
      checked: currentLang === lang.code,
      click: () => {
        const s = loadSettings();
        s.language = lang.code;
        saveSettings(s);
        rebuildTrayMenu();
      },
    }));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Dikte Et (" + ((loadSettings().shortcuts || {}).dictate || "CommandOrControl+Space").replace("CommandOrControl+","Ctrl+") + ")",
        click: () => toggleRecording(),
      },
      { type: "separator" },
      {
        label: "Ana Sayfa",
        click: () => createHomeWindow(),
      },
      {
        label: "Pencereyi Goster",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: "separator" },
      {
        label: "Dil",
        submenu: langSubmenu,
      },
      {
        label: "Ayarlar",
        click: () => createHomeWindow("s-general"),
      },
      { type: "separator" },
      {
        label: "Cikis",
        click: () => {
          app.isQuitting = true;
          if (pillWindow) pillWindow.destroy();
          if (homeWindow && !homeWindow.isDestroyed()) homeWindow.destroy();
          if (mainWindow) mainWindow.destroy();
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          toggleRecording();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    tray.on("double-click", () => {
      createHomeWindow();
    });
  }
}

function createFallbackIcon() {
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const cx = size / 2, cy = size / 2, r = 6;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        buffer[i] = 45;
        buffer[i + 1] = 212;
        buffer[i + 2] = 191;
        buffer[i + 3] = 255;
      } else {
        buffer[i + 3] = 0;
      }
    }
  }

  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

// ========== POWER MODE (Wake Word Detection) ==========
// Power mode now runs directly in home.html — no separate window needed

let powerSaveBlockerId = null;

function startPowerMode() {
  powerModeActive = true;
  // Prevent system from suspending the app (keeps audio processing alive in background)
  if (powerSaveBlockerId === null || !powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlockerId = powerSaveBlocker.start("prevent-app-suspension");
    console.log("PowerSaveBlocker started, id:", powerSaveBlockerId);
  }
  // Ensure background throttling is disabled for home window
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.webContents.backgroundThrottling = false;
  }
  console.log("Power mode activated (state tracked)");
}

function stopPowerMode() {
  powerModeActive = false;
  // Release power save blocker
  if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId);
    console.log("PowerSaveBlocker stopped, id:", powerSaveBlockerId);
    powerSaveBlockerId = null;
  }
  console.log("Power mode deactivated (state tracked)");
}

// ========== RECORDING ==========
function toggleRecording() {
  if (!mainWindow) return;

  // Position main window above the pill (bottom center)
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  const mainBounds = mainWindow.getBounds();

  const newX = Math.round((screenWidth - mainBounds.width) / 2);
  const newY = screenHeight - 52 - mainBounds.height - 12;

  // Restore if minimized
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  // Cancel any pending auto-hide timer from previous result
  if (resultAutoHideTimer) { clearTimeout(resultAutoHideTimer); resultAutoHideTimer = null; }

  // Prevent blur from hiding window during the entire toggle flow
  isProcessingResult = true;

  const wasHidden = !mainWindow.isVisible();
  if (wasHidden) {
    mainWindow.setPosition(newX, newY);
    mainWindow.show();
  }

  // Force window to front — especially needed when called from wake word in background
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.moveTop();

  // Send toggle-recording IPC — wait a bit if window was just shown
  const sendDelay = wasHidden ? 600 : 0;
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("toggle-recording");
    }
  }, sendDelay);
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const settings = loadSettings();
  const sc = settings.shortcuts || {};

  // Dictate (toggle recording)
  const dictateKey = sc.dictate || "CommandOrControl+Space";
  try {
    const r = globalShortcut.register(dictateKey, () => toggleRecording());
    if (r) {
      console.log("Shortcut dictate registered OK:", dictateKey);
    } else {
      console.warn("Shortcut dictate FAILED (baska uygulama kullanıyor olabilir):", dictateKey);
      // Fallback: Ctrl+Shift+Space dene
      const fallback = "CommandOrControl+Shift+Space";
      const r2 = globalShortcut.register(fallback, () => toggleRecording());
      if (r2) console.log("Shortcut dictate fallback registered:", fallback);
      else console.warn("Shortcut dictate fallback also failed:", fallback);
    }
  } catch (e) { console.warn("Shortcut dictate error:", e.message); }

  // Paste last text
  const pasteKey = sc.paste || "CommandOrControl+Shift+V";
  try {
    const r = globalShortcut.register(pasteKey, () => autoPasteToApp());
    if (r) console.log("Shortcut paste:", pasteKey);
  } catch (e) { console.warn("Shortcut paste error:", e.message); }

  // Open home
  const homeKey = sc.home || "CommandOrControl+Shift+H";
  try {
    const r = globalShortcut.register(homeKey, () => createHomeWindow());
    if (r) console.log("Shortcut home:", homeKey);
  } catch (e) { console.warn("Shortcut home error:", e.message); }
}

// ========== GOOGLE OAUTH (System Browser + Local HTTP Server) ==========
const GOOGLE_CLIENT_ID = "111781870956-vkc76eqprbi91ocou7dvaoethh5gnttr.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

function googleOAuth() {
  return new Promise((resolve, reject) => {
    let redirectUri = "";
    let resolved = false;
    let timeoutId = null;

    // Create a temporary local HTTP server to capture Google's redirect
    const server = http.createServer(async (req, res) => {
      if (resolved) {
        res.writeHead(200);
        res.end();
        return;
      }

      try {
        const reqUrl = new URL(req.url, "http://localhost");
        const code = reqUrl.searchParams.get("code");
        const error = reqUrl.searchParams.get("error");

        // Ignore requests without code or error (favicon, etc.)
        if (!code && !error) {
          res.writeHead(200);
          res.end();
          return;
        }

        resolved = true;
        if (timeoutId) clearTimeout(timeoutId);

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>VoiceFlow</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:linear-gradient(135deg,#0f0f23 0%,#1a1a3e 100%);color:#fff}.card{text-align:center;background:rgba(255,255,255,0.05);border-radius:20px;padding:48px;backdrop-filter:blur(10px)}.icon{font-size:56px;margin-bottom:20px}h2{color:#ff6b6b;font-size:24px;margin-bottom:12px}p{color:#aaa;font-size:16px}</style></head><body><div class="card"><div class="icon">❌</div><h2>Giris iptal edildi</h2><p>Bu pencereyi kapatabilirsiniz.</p></div></body></html>`);
          try { server.close(); } catch {}
          reject(new Error(error));
          return;
        }

        console.log("Google OAuth: Got authorization code, exchanging for tokens...");

        // Show success page to user immediately
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>VoiceFlow</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:linear-gradient(135deg,#0f0f23 0%,#1a1a3e 100%);color:#fff}.card{text-align:center;background:rgba(255,255,255,0.05);border-radius:20px;padding:48px;backdrop-filter:blur(10px)}.icon{font-size:56px;margin-bottom:20px}h2{color:#2dd4a8;font-size:24px;margin-bottom:12px}p{color:#aaa;font-size:16px}</style></head><body><div class="card"><div class="icon">✅</div><h2>Giris basarili!</h2><p>VoiceFlow uygulamasina donebilirsiniz.</p><p style="margin-top:8px;font-size:13px;color:#666">Bu sekme otomatik kapanacak...</p></div><script>setTimeout(()=>window.close(),3000)</script></body></html>`);
        try { server.close(); } catch {}

        // Exchange authorization code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        const tokens = await tokenResponse.json();
        console.log("Google OAuth: Token response received", tokens.error || "OK");

        if (tokens.error) {
          reject(new Error(tokens.error_description || tokens.error));
          return;
        }

        // Get user info from Google
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const userInfo = await userInfoResponse.json();
        console.log("Google OAuth: User info received for", userInfo.email);

        // Bring home window to front
        if (homeWindow && !homeWindow.isDestroyed()) {
          homeWindow.show();
          homeWindow.focus();
        }

        resolve({
          name: userInfo.name || userInfo.given_name || "",
          email: userInfo.email || "",
          picture: userInfo.picture || "",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || "",
        });
      } catch (err) {
        console.error("Google OAuth exchange error:", err);
        try { server.close(); } catch {}
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      }
    });

    // Listen on random available port
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      redirectUri = `http://localhost:${port}`;
      console.log("Google OAuth: Local callback server on port", port);

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent("email profile")}` +
        `&access_type=offline` +
        `&prompt=consent`;

      // Open in user's real Chrome browser — Google trusts this!
      shell.openExternal(authUrl);
      console.log("Google OAuth: Opened in system browser");
    });

    // 5 minute timeout
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { server.close(); } catch {}
        reject(new Error("Giris zaman asimina ugradi (5 dakika)"));
      }
    }, 5 * 60 * 1000);
  });
}

// ========== AUTO-PASTE (PowerShell SendKeys) ==========
function autoPasteToApp() {
  // Hide the main window first
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  updatePillState("idle");

  const settings = loadSettings();
  const useDblClick = settings.powerDblClick !== false;

  // Small delay to let the previous app regain focus
  setTimeout(() => {
    if (useDblClick) {
      // Double-click at current mouse position (focus + select) then Ctrl+V
      const psCommand = `powershell -Command "Add-Type -MemberDefinition '[DllImport(\\\"user32.dll\\\")] public static extern void mouse_event(int f,int x,int y,int d,int e);' -Name U -Namespace W; [W.U]::mouse_event(0x02,0,0,0,0); [W.U]::mouse_event(0x04,0,0,0,0); [W.U]::mouse_event(0x02,0,0,0,0); [W.U]::mouse_event(0x04,0,0,0,0); Start-Sleep -Milliseconds 100; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`;
      exec(psCommand, (err) => {
        if (err) {
          console.error("Auto-paste (dblclick) error:", err);
        } else {
          console.log("Auto-paste: double-click + Ctrl+V sent successfully");
        }
      });
    } else {
      // Just Ctrl+V
      const psCommand = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`;
      exec(psCommand, (err) => {
        if (err) {
          console.error("Auto-paste error:", err);
        } else {
          console.log("Auto-paste: Ctrl+V sent successfully");
        }
      });
    }
  }, 300);
}

// ========== IPC HANDLERS ==========
ipcMain.on("show-result", (event, text) => {
  isRecording = false;
  isProcessingResult = false;
  updatePillState("result");
  // Window stays visible until user closes it (ESC, Ctrl+Space, Kapat button, or auto-paste)
  // No auto-hide timer — the blur handler will handle hiding after 3s if user doesn't interact
});

ipcMain.on("hide-window", () => {
  isRecording = false;
  isProcessingResult = false;
  if (mainWindow) mainWindow.hide();
  updatePillState("idle");
});

ipcMain.on("open-settings", () => {
  // Redirect to home window settings page instead of separate window
  createHomeWindow("s-general");
});

ipcMain.on("open-home", () => {
  createHomeWindow();
});

ipcMain.on("copy-to-clipboard", (event, text) => {
  clipboard.writeText(text);
});

ipcMain.on("resize-window", (event, width, height) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setSize(width, height);
  }
});

// Pill clicked → toggle recording
ipcMain.on("pill-clicked", () => {
  toggleRecording();
});

// Auto-paste: hide window and simulate Ctrl+V
ipcMain.on("auto-paste", () => {
  autoPasteToApp();
});

// Settings IPC
ipcMain.handle("get-settings", () => {
  return loadSettings();
});

ipcMain.handle("save-settings", (event, data) => {
  const existing = loadSettings();
  const merged = { ...existing, ...data };
  saveSettings(merged);

  // Show/hide pill based on settings
  if (merged.setupComplete && merged.isAuthenticated) {
    if (merged.showPill === true) {
      // Create pill window on demand only when user enables it
      if (!pillWindow || pillWindow.isDestroyed()) {
        createPillWindow();
      }
      showPill();
    } else {
      hidePill();
    }
    // Open home window after onboarding completes
    if (!homeWindow || homeWindow.isDestroyed()) {
      createHomeWindow();
    }
  }

  return merged;
});

ipcMain.on("open-external", (event, url) => {
  shell.openExternal(url);
});

// Version
ipcMain.handle("get-version", () => {
  return app.getVersion();
});

// Changelog — what's new in this version
ipcMain.handle("get-changelog", () => {
  return {
    version: app.getVersion(),
    changes: CHANGELOG[app.getVersion()] || [],
    allVersions: CHANGELOG,
  };
});

// Auto-start
ipcMain.handle("get-auto-start", () => {
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch {
    return false;
  }
});

ipcMain.on("set-auto-start", (event, enabled) => {
  try {
    app.setLoginItemSettings({ openAtLogin: enabled });
  } catch (err) {
    console.error("Auto-start error:", err);
  }
});

// Google OAuth
ipcMain.handle("google-auth", async () => {
  try {
    const result = await googleOAuth();
    return { success: true, ...result };
  } catch (err) {
    console.error("Google OAuth error:", err);
    return { success: false, error: err.message };
  }
});

// Power Mode IPC
ipcMain.on("power-mode-status", (event, status) => {
  console.log("Power mode status:", status);
  // Update tray icon tooltip based on status
  if (tray) {
    const labels = { loading: "Yukleniyor...", listening: "Dinliyor...", off: "Kapali", error: "Hata" };
    tray.setToolTip("VoiceFlow - Guc Modu: " + (labels[status] || status));
  }
  // Notify home window
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.webContents.send("power-mode-update", status);
  }
});

// Forward what Vosk hears to home window (for test/debug display)
ipcMain.on("power-mode-heard", (event, text, isPartial) => {
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.webContents.send("power-mode-heard", text, isPartial);
  }
});

ipcMain.on("wake-word-detected", () => {
  console.log("Wake word detected! isRecording:", isRecording);

  // Set ALL flags to prevent blur handler from hiding window during activation
  wakeWordTriggered = true;
  isProcessingResult = true;

  // Toggle recording — wake word starts/stops dictation
  toggleRecording();

  // Clear the wake word flag after recording has had time to start
  setTimeout(() => {
    wakeWordTriggered = false;
  }, 6000);
});

// Resume power mode when recording finishes
ipcMain.on("recording-state", (event, state) => {
  isRecording = state;
  // Keep window visible during recording and briefly after (processing/result)
  if (state) {
    isProcessingResult = true;
    // Cancel any pending auto-hide from previous result
    if (resultAutoHideTimer) { clearTimeout(resultAutoHideTimer); resultAutoHideTimer = null; }
  }
  updatePillState(state ? "recording" : "idle");

  // Switch icon: red while recording, blue when idle
  const iconFile = state ? "icon-red.ico" : "icon.ico";
  const iconPath = path.join(__dirname, "assets", iconFile);
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setIcon(icon);
      if (homeWindow && !homeWindow.isDestroyed()) homeWindow.setIcon(icon);
      if (tray) tray.setImage(icon.resize({ width: 16, height: 16 }));
    }
  }

  // Escape tusu: kayit sirasinda Escape = kaydi durdur + isle + yapistir (Ctrl+Space gibi)
  if (state) {
    try {
      globalShortcut.register("Escape", () => {
        if (isRecording) toggleRecording();
      });
    } catch (e) { console.warn("Escape shortcut register error:", e.message); }
  } else {
    try { globalShortcut.unregister("Escape"); } catch (e) { /* ignore */ }
  }

  // Notify home window about recording state (for watchdog)
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.webContents.send("dictation-state", state);
  }

  // When recording stops, resume power mode listening in home window
  if (!state && powerModeActive) {
    setTimeout(() => {
      if (homeWindow && !homeWindow.isDestroyed()) {
        homeWindow.webContents.send("power-mode-resume");
      }
    }, 3000); // Wait for transcription to finish
  }
});

// Power mode toggle
ipcMain.handle("toggle-power-mode", (event, enabled) => {
  if (enabled) {
    startPowerMode();
    return { success: true, status: "starting" };
  } else {
    stopPowerMode();
    return { success: true, status: "stopped" };
  }
});

// ========== VOSK MODEL MANAGEMENT ==========
const https = require("https");
const { pipeline } = require("stream/promises");
const { createWriteStream, createReadStream } = require("fs");

const VOSK_MODELS = {
  tr: "vosk-model-small-tr-0.3",
  en: "vosk-model-small-en-us-0.15",
  de: "vosk-model-small-de-0.15",
  fr: "vosk-model-small-fr-0.22",
  es: "vosk-model-small-es-0.42",
  ja: "vosk-model-small-ja-0.22",
  ko: "vosk-model-small-ko-0.22",
  zh: "vosk-model-small-cn-0.22",
  pt: "vosk-model-small-pt-0.3",
  it: "vosk-model-small-it-0.22",
  ru: "vosk-model-small-ru-0.22",
  ar: "vosk-model-small-ar-0.22",
};

function getVoskModelsDir() {
  return path.join(app.getPath("userData"), "vosk-models");
}

function getVoskModelDir(lang) {
  const modelName = VOSK_MODELS[lang] || VOSK_MODELS["en"];
  return path.join(getVoskModelsDir(), modelName);
}

function isVoskModelDownloaded(lang) {
  const modelName = VOSK_MODELS[lang] || VOSK_MODELS["en"];
  const tarGzPath = path.join(getVoskModelsDir(), `${modelName}.tar.gz`);
  return fs.existsSync(tarGzPath);
}

// Local HTTP server to serve Vosk model files to the WASM worker
let voskModelServer = null;
let voskModelServerPort = 0;

function startVoskModelServer() {
  return new Promise((resolve) => {
    if (voskModelServer) { resolve(voskModelServerPort); return; }
    voskModelServer = http.createServer((req, res) => {
      // Serve model files from userData/vosk-models/
      const safePath = decodeURIComponent(req.url).replace(/\.\./g, "");
      const filePath = path.join(getVoskModelsDir(), safePath);
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
      });
      createReadStream(filePath).pipe(res);
    });
    voskModelServer.listen(0, "127.0.0.1", () => {
      voskModelServerPort = voskModelServer.address().port;
      console.log("Vosk model server running on port:", voskModelServerPort);
      resolve(voskModelServerPort);
    });
  });
}

function downloadVoskModel(lang) {
  return new Promise((resolve, reject) => {
    const modelName = VOSK_MODELS[lang] || VOSK_MODELS["en"];
    // Download tar.gz for vosk-browser compatibility
    const url = `https://alphacephei.com/vosk/models/${modelName}.zip`;
    const modelsDir = getVoskModelsDir();
    const tarGzPath = path.join(modelsDir, `${modelName}.tar.gz`);
    const zipPath = path.join(modelsDir, `${modelName}.zip`);

    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    // If tar.gz already exists, skip download
    if (fs.existsSync(tarGzPath)) {
      console.log("Vosk model tar.gz already exists:", tarGzPath);
      resolve({ success: true, path: tarGzPath });
      return;
    }

    console.log("Downloading Vosk model:", url);

    const download = (downloadUrl, retryCount = 0) => {
      const handler = (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          console.log("Redirect to:", redirectUrl);
          if (redirectUrl.startsWith("https")) {
            https.get(redirectUrl, handler).on("error", handleError);
          } else {
            http.get(redirectUrl, handler).on("error", handleError);
          }
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${response.statusCode}`));
          return;
        }

        const totalBytes = parseInt(response.headers["content-length"], 10) || 0;
        let downloadedBytes = 0;
        const file = createWriteStream(zipPath);

        response.on("data", (chunk) => {
          downloadedBytes += chunk.length;
          const percent = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
          if (homeWindow && !homeWindow.isDestroyed()) {
            homeWindow.webContents.send("vosk-download-progress", {
              lang,
              percent: Math.round(percent * 10) / 10,
              bytesDownloaded: downloadedBytes,
              totalBytes,
            });
          }
        });

        response.pipe(file);

        file.on("finish", () => {
          // Wait for file descriptor to close before checking existence (fixes race condition)
          file.close(() => {
            console.log("Download complete, file closed. Extracting...");

            if (homeWindow && !homeWindow.isDestroyed()) {
              homeWindow.webContents.send("vosk-download-progress", {
                lang, percent: 100, bytesDownloaded: totalBytes, totalBytes, status: "extracting"
              });
            }

            // Verify zip file exists and has data before extracting
            if (!fs.existsSync(zipPath)) {
              reject(new Error("ZIP dosyasi bulunamadi: " + zipPath));
              return;
            }
          const zipSize = fs.statSync(zipPath).size;
          if (totalBytes > 0 && zipSize < totalBytes * 0.95) {
            console.error(`ZIP incomplete: ${zipSize} bytes vs expected ${totalBytes}`);
            try { fs.unlinkSync(zipPath); } catch {}
            reject(new Error("Indirme tamamlanamadi. Lutfen tekrar deneyin."));
            return;
          }

          const isWin = process.platform === "win32";
          // Use double quotes for PowerShell paths to handle spaces
          const extractCmd = isWin
            ? `powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${modelsDir.replace(/'/g, "''")}'"`
            : `unzip -o "${zipPath}" -d "${modelsDir}"`;

          exec(extractCmd, { maxBuffer: 1024 * 1024 * 50, timeout: 120000 }, (err) => {
            // Only delete zip on SUCCESS — keep it for retry on failure
            if (!err) { try { fs.unlinkSync(zipPath); } catch {} }

            if (err) {
              console.error("Extraction error:", err);
              // Delete corrupt zip so retry downloads fresh
              try { fs.unlinkSync(zipPath); } catch {}
              reject(new Error("ZIP cikarma hatasi. Lutfen 'Yeniden Dene' butonuna basin."));
              return;
            }

            // Create tar.gz from extracted directory for vosk-browser WASM worker
            const modelDir = path.join(modelsDir, modelName);
            if (homeWindow && !homeWindow.isDestroyed()) {
              homeWindow.webContents.send("vosk-download-progress", {
                lang, percent: 100, bytesDownloaded: totalBytes, totalBytes, status: "packaging"
              });
            }

            const tarCmd = isWin
              ? `powershell -Command "cd '${modelsDir}'; tar -czf '${tarGzPath}' '${modelName}'"`
              : `cd "${modelsDir}" && tar -czf "${tarGzPath}" "${modelName}"`;

            exec(tarCmd, { maxBuffer: 1024 * 1024 * 50 }, (tarErr) => {
              if (tarErr) {
                console.error("Tar.gz creation error:", tarErr);
                // Fallback: model dir exists even without tar.gz
                resolve({ success: true, path: modelDir, noTarGz: true });
                return;
              }

              console.log("Vosk model tar.gz created:", tarGzPath);
              resolve({ success: true, path: tarGzPath });
            });
          });
          }); // close file.close callback
        }); // close file.on("finish")

        file.on("error", (err) => {
          try { fs.unlinkSync(zipPath); } catch {}
          reject(err);
        });
      };

      const handleError = (err) => {
        if (retryCount < 3) {
          console.log(`Download error, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => download(downloadUrl, retryCount + 1), 2000 * Math.pow(2, retryCount));
        } else {
          reject(err);
        }
      };

      https.get(downloadUrl, handler).on("error", handleError);
    };

    download(url);
  });
}

// Vosk Model IPC Handlers
ipcMain.handle("vosk-model-status", (event, lang) => {
  const downloaded = isVoskModelDownloaded(lang);
  const modelDir = getVoskModelDir(lang);
  return { downloaded, path: modelDir, lang, modelName: VOSK_MODELS[lang] || VOSK_MODELS["en"] };
});

ipcMain.handle("vosk-model-download", async (event, lang) => {
  try {
    const result = await downloadVoskModel(lang);
    return { success: true, path: result.path };
  } catch (err) {
    console.error("Vosk model download error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("vosk-model-path", (event, lang) => {
  return getVoskModelDir(lang);
});

ipcMain.handle("vosk-model-server-port", async () => {
  const port = await startVoskModelServer();
  return port;
});

ipcMain.handle("vosk-model-serve-url", async (event, lang) => {
  const port = await startVoskModelServer();
  const modelName = VOSK_MODELS[lang] || VOSK_MODELS["en"];
  return `http://127.0.0.1:${port}/${modelName}.tar.gz`;
});

ipcMain.handle("vosk-model-delete", (event, lang) => {
  const modelDir = getVoskModelDir(lang);
  try {
    if (fs.existsSync(modelDir)) {
      fs.rmSync(modelDir, { recursive: true, force: true });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Change shortcut
ipcMain.handle("change-shortcut", (event, newShortcut, shortcutId) => {
  try {
    const settings = loadSettings();
    if (!settings.shortcuts) settings.shortcuts = {};

    // Check conflict with other shortcuts — remove if exists
    let removedFrom = null;
    for (const [id, sc] of Object.entries(settings.shortcuts)) {
      if (id !== shortcutId && sc === newShortcut) {
        removedFrom = id;
        delete settings.shortcuts[id];
      }
    }

    settings.shortcuts[shortcutId] = newShortcut;
    saveSettings(settings);

    // Re-register all shortcuts
    registerShortcuts();
    rebuildTrayMenu();

    console.log(`Shortcut ${shortcutId} changed to: ${newShortcut}`);
    return { success: true, shortcut: newShortcut, removedFrom };
  } catch (err) {
    registerShortcuts();
    return { success: false, error: err.message };
  }
});

// Reset settings
ipcMain.on("reset-settings", () => {
  saveSettings({});

  // Hide pill and main dictation window (no auth)
  if (pillWindow && !pillWindow.isDestroyed()) {
    pillWindow.hide();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }

  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
    settingsWindow = null;
  }

  // Re-open home window → will show login page (no auth)
  if (homeWindow && !homeWindow.isDestroyed()) {
    app.isQuitting = true; // allow real close
    homeWindow.close();
    homeWindow = null;
    app.isQuitting = false;
  }
  createHomeWindow();
});

// ========== SERVER LICENSE CHECK ==========
const VOICEFLOW_API_URL = "https://voiceflow.app/api/verify-license";

async function checkLicenseOnStartup() {
  const settings = loadSettings();
  if (!settings.isAuthenticated || !settings.userEmail) return;

  try {
    const response = await fetch(VOICEFLOW_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: settings.userEmail,
        licenseKey: settings.licenseKey || undefined,
      }),
    });

    const data = await response.json();
    console.log("License check result:", data);

    // Update local settings based on server response
    const updates = {};

    if (data.plan === "pro" || data.plan === "lifetime") {
      updates.isPro = true;
      updates.serverPlan = data.plan;
    } else {
      updates.isPro = false;
      updates.serverPlan = "free";
    }

    // Update trial info
    updates.trialActive = data.trialActive || false;
    updates.trialDaysLeft = data.trialDaysLeft || 0;
    updates.trialEndDate = data.trialEndDate || null;

    // Save updated settings
    const merged = { ...settings, ...updates };
    saveSettings(merged);
    console.log("License synced: plan=" + (updates.serverPlan || "free") + ", isPro=" + updates.isPro + ", trialActive=" + updates.trialActive);
  } catch (err) {
    console.log("License check skipped (offline):", err.message);
    // Offline — keep existing local settings
  }
}

// ========== APP LIFECYCLE ==========
// ========== AUTO-UPDATE ==========
function setupAutoUpdater() {
  const settings = loadSettings();

  // Silently enable auto-update on first run (no dialog — user can toggle in Settings)
  if (settings.autoUpdateAsked === undefined) {
    const s = loadSettings();
    s.autoUpdateAsked = true;
    s.autoUpdateEnabled = true;
    saveSettings(s);
    startAutoUpdateChecks();
  } else if (settings.autoUpdateEnabled) {
    startAutoUpdateChecks();
  }

  // Set up event handlers regardless (for manual checks)
  autoUpdater.autoDownload = false; // Don't auto-download, ask first
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    notifyAllWindows("update-status", { status: "available", version: info.version });

    // Ask user if they want to download
    dialog.showMessageBox({
      type: "info",
      title: "VoiceFlow Guncelleme",
      message: `Yeni versiyon mevcut: v${info.version}`,
      detail: "Simdi indirmek ister misiniz?",
      buttons: ["Indir", "Daha Sonra"],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        notifyAllWindows("update-status", { status: "downloading", version: info.version });
      }
    });
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No updates available.");
  });

  autoUpdater.on("download-progress", (progress) => {
    const pct = Math.round(progress.percent);
    notifyAllWindows("update-status", { status: "progress", percent: pct });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info.version);
    notifyAllWindows("update-status", { status: "ready", version: info.version });
    // Ask user to install
    dialog.showMessageBox({
      type: "info",
      title: "VoiceFlow Guncelleme Hazir",
      message: `VoiceFlow v${info.version} indirildi.`,
      detail: "Uygulamayi yeniden baslatarak guncellemek ister misiniz?",
      buttons: ["Simdi Guncelle", "Daha Sonra"],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto-update error:", err.message);
  });
}

function startAutoUpdateChecks() {
  // Skip auto-update checks in dev mode — no app-update.yml exists
  if (!app.isPackaged) {
    console.log("Skipping auto-update checks (dev mode)");
    return;
  }

  // Check after 10 seconds, then every 2 hours
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdates().catch((err) => {
        console.log("Update check failed:", err.message);
      });
    } catch (err) {
      console.log("Update check error:", err.message);
    }
  }, 10000);

  setInterval(() => {
    try {
      autoUpdater.checkForUpdates().catch((err) => {
        console.log("Update check failed:", err.message);
      });
    } catch (err) {
      console.log("Update check error:", err.message);
    }
  }, 2 * 60 * 60 * 1000);
}

function notifyAllWindows(channel, data) {
  [mainWindow, homeWindow, pillWindow].forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  });
}

// IPC: manual update check from UI
ipcMain.handle("check-for-updates", async () => {
  if (!app.isPackaged) {
    return { available: false, error: "Dev mode — update check disabled" };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { available: !!result?.updateInfo, version: result?.updateInfo?.version };
  } catch (err) {
    return { available: false, error: err.message };
  }
});

app.whenReady().then(async () => {
  // Set app identity for Windows taskbar — prevents Electron default icon
  app.setAppUserModelId("com.voiceflow.desktop");

  // Set app icon for all windows
  const appIconPath = path.join(__dirname, "assets", "icon.ico");
  if (fs.existsSync(appIconPath)) {
    const appIcon = nativeImage.createFromPath(appIconPath);
    if (!appIcon.isEmpty()) {
      app.dock && app.dock.setIcon(appIcon); // macOS
    }
  }

  // Grant microphone permission to all windows (needed for Power Mode test + listening)
  const { session } = require("electron");
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "media" || permission === "microphone" || permission === "audioCapture") {
      callback(true);
    } else {
      callback(true); // allow all for now
    }
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === "media" || permission === "microphone" || permission === "audioCapture") {
      return true;
    }
    return true;
  });

  createMainWindow();
  // Pill window only created on-demand when user enables showPill in settings
  // Never created at startup — saves resources and prevents unwanted pill bar
  createTray();
  registerShortcuts();

  // Shortcut kayıt durumunu kontrol et
  const settings = loadSettings();
  const dictateKey = settings.shortcuts?.dictate || "CommandOrControl+Space";
  const isRegistered = globalShortcut.isRegistered(dictateKey);
  console.log(`[STARTUP] Shortcut '${dictateKey}' registered: ${isRegistered}`);

  // Only open home window after setup is complete — during first run, mainWindow shows setup wizard
  const homeSettings = loadSettings();
  if (homeSettings.setupComplete) {
    createHomeWindow();
  }

  // Check license status from server (with timeout — don't block forever)
  try {
    const licensePromise = checkLicenseOnStartup();
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.race([licensePromise, timeoutPromise]);
  } catch (err) {
    console.log("License check skipped:", err.message);
  }

  // Auto-start power mode if enabled
  const startSettings = loadSettings();
  if (startSettings.powerMode !== false) {
    powerModeActive = true;
  }

  // Auto-start: always ensure it's enabled unless user explicitly disabled it
  try {
    const autoStartSettings = loadSettings();
    if (autoStartSettings.autoStartDisabledByUser !== true) {
      // Enable auto-start (default ON)
      app.setLoginItemSettings({ openAtLogin: true });
      console.log("Auto-start enabled");
      // Notify user after home window loads
      if (homeWindow && !homeWindow.isDestroyed()) {
        homeWindow.webContents.on("did-finish-load", () => {
          homeWindow.webContents.executeJavaScript(`
            if (typeof showToast === 'function') showToast('VoiceFlow Windows ile birlikte baslatilacak. Ayarlardan kapatabilirsiniz.');
          `).catch(() => {});
        });
      }
    }
  } catch (err) {
    console.error("Auto-start setup error:", err);
  }

  // ===== AUTO-UPDATE =====
  try {
    setupAutoUpdater();
  } catch (err) {
    console.error("Auto-updater setup failed:", err.message);
  }

  console.log("VoiceFlow started successfully!");
  console.log("Settings path:", getSettingsPath());
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // Don't quit - keep in tray
});

app.on("activate", () => {
  if (!mainWindow) {
    createMainWindow();
  }
});
