const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, screen, clipboard, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const http = require("http");

let mainWindow = null;
let pillWindow = null;
let settingsWindow = null;
let homeWindow = null;
// powerModeWindow removed — power mode runs in homeWindow
let tray = null;
let isRecording = false;
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

  // Center on first run, top-right otherwise
  const winX = isFirstRun
    ? Math.round((screenWidth - winWidth) / 2)
    : screenWidth - 400;
  const winY = isFirstRun
    ? Math.round((screenHeight - winHeight) / 2)
    : 60;

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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("ui/index.html");

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  mainWindow.on("blur", () => {
    const currentSettings = loadSettings();
    if (!isRecording && !wakeWordTriggered && currentSettings.setupComplete && currentSettings.isAuthenticated) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed() && !isRecording && !wakeWordTriggered) {
          mainWindow.hide();
        }
      }, 200);
    }
  });

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    // Only show main dictation window if user is authenticated
    const s = loadSettings();
    if (s.isAuthenticated && s.setupComplete) {
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
    const settings = loadSettings();
    if (settings.setupComplete && settings.isAuthenticated && settings.showPill !== false) {
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
    if (settings.showPill !== false) {
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
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 700,
    height: 560,
    frame: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile("ui/settings.html");

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

// ========== HOME WINDOW ==========
function createHomeWindow(navigateTo) {
  if (homeWindow && !homeWindow.isDestroyed()) {
    homeWindow.show();
    homeWindow.focus();
    // Navigate to specific page if requested
    if (navigateTo) {
      homeWindow.webContents.send("show-page", navigateTo);
    }
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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Keep mic/AudioContext alive when minimized/hidden
    },
  });

  homeWindow.setMenuBarVisibility(false);
  homeWindow.loadFile("ui/home.html");

  // Always bring to front when opened
  homeWindow.webContents.on("did-finish-load", () => {
    homeWindow.show();
    homeWindow.focus();
    homeWindow.moveTop();
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

function startPowerMode() {
  powerModeActive = true;
  console.log("Power mode activated (state tracked)");
}

function stopPowerMode() {
  powerModeActive = false;
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

  if (!mainWindow.isVisible()) {
    mainWindow.setPosition(newX, newY);
    mainWindow.show();
  }

  // Force window to front — especially needed when called from wake word in background
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.moveTop();

  mainWindow.webContents.send("toggle-recording");
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const settings = loadSettings();
  const sc = settings.shortcuts || {};

  // Dictate (toggle recording)
  const dictateKey = sc.dictate || "CommandOrControl+Space";
  try {
    const r = globalShortcut.register(dictateKey, () => toggleRecording());
    if (r) console.log("Shortcut dictate:", dictateKey);
    else console.warn("Shortcut dictate failed:", dictateKey);
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

  // Small delay to let the previous app regain focus, then simulate Ctrl+V
  setTimeout(() => {
    const psCommand = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`;
    exec(psCommand, (err) => {
      if (err) {
        console.error("Auto-paste error:", err);
      } else {
        console.log("Auto-paste: Ctrl+V sent successfully");
      }
    });
  }, 300);
}

// ========== GHOSTX IPC HANDLERS ==========
const { setupLocalNetworkIPC } = require("./ghostx/local-network");
const { setupScreenGuardIPC } = require("./ghostx/screen-guard");

// Panik butonu: Tum GhostX verilerini sil
ipcMain.on("ghostx-panic", (event) => {
  // Tum GhostX ile ilgili pencereleri temizle
  if (homeWindow) {
    homeWindow.webContents.send("ghostx-panic-trigger");
  }
  event.sender.send("ghostx-panic-ack");
});

// Ekran koruma: Screenshot engelleme (OS seviyesinde)
ipcMain.on("ghostx-screen-protect", (event, enabled) => {
  const windows = [mainWindow, homeWindow, settingsWindow].filter(Boolean);
  for (const win of windows) {
    try {
      win.setContentProtection(enabled);
    } catch (e) {
      // Bazi platformlarda desteklenmiyor olabilir
    }
  }
});

// Global panik kisayolu: Ctrl+Shift+Delete
app.whenReady().then(() => {
  globalShortcut.register("CommandOrControl+Shift+Delete", () => {
    // Tum pencerelere panik sinyali gonder
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      try {
        win.webContents.send("ghostx-panic-trigger");
      } catch {}
    }
  });
});

// Yerel ag (Wi-Fi Direct) IPC handler'larini kur
setupLocalNetworkIPC();

// Ekran koruma (screenshot engelleme) IPC handler'larini kur
setupScreenGuardIPC();

// ========== IPC HANDLERS ==========
ipcMain.on("show-result", (event, text) => {
  isRecording = false;
  updatePillState("result");
});

ipcMain.on("hide-window", () => {
  isRecording = false;
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
  if (merged.setupComplete) {
    if (merged.showPill !== false) {
      showPill();
    } else {
      hidePill();
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

  // Set flag to prevent blur handler from hiding window during activation
  wakeWordTriggered = true;

  // Toggle recording — wake word starts/stops dictation
  toggleRecording();

  // Clear the flag after recording has had time to start
  setTimeout(() => {
    wakeWordTriggered = false;
  }, 2000);
});

// Resume power mode when recording finishes
ipcMain.on("recording-state", (event, state) => {
  isRecording = state;
  updatePillState(state ? "recording" : "idle");

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
app.whenReady().then(async () => {
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
  createPillWindow();
  createTray();
  registerShortcuts();

  // Always open home window on start
  createHomeWindow();

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
  if (startSettings.powerMode) {
    powerModeActive = true;
  }

  // Auto-start: enable on first run only, notify user via home window
  try {
    const autoStartSettings = loadSettings();
    if (autoStartSettings.autoStartInitialized === undefined) {
      // First run — enable auto-start and mark as initialized
      app.setLoginItemSettings({ openAtLogin: true });
      const s = loadSettings();
      s.autoStartInitialized = true;
      saveSettings(s);
      console.log("Auto-start enabled on first run");
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
