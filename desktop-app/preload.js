const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voiceflow", {
  // Send events to main process
  setRecordingState: (state) => ipcRenderer.send("recording-state", state),
  showResult: (text) => ipcRenderer.send("show-result", text),
  hideWindow: () => ipcRenderer.send("hide-window"),
  openSettings: () => ipcRenderer.send("open-settings"),
  openHome: () => ipcRenderer.send("open-home"),
  copyToClipboard: (text) => ipcRenderer.send("copy-to-clipboard", text),
  resizeWindow: (w, h) => ipcRenderer.send("resize-window", w, h),
  openExternal: (url) => ipcRenderer.send("open-external", url),
  autoPaste: () => ipcRenderer.send("auto-paste"),

  // Listen for events from main process
  onToggleRecording: (callback) => {
    ipcRenderer.on("toggle-recording", () => callback());
  },

  // Settings storage via main process (persistent file-based)
  getSettings: async () => {
    return await ipcRenderer.invoke("get-settings");
  },
  saveSettings: async (settings) => {
    return await ipcRenderer.invoke("save-settings", settings);
  },

  // Version
  getVersion: async () => {
    return await ipcRenderer.invoke("get-version");
  },

  // Auto-start
  getAutoStart: async () => {
    return await ipcRenderer.invoke("get-auto-start");
  },
  setAutoStart: (enabled) => ipcRenderer.send("set-auto-start", enabled),

  // Reset
  resetSettings: () => ipcRenderer.send("reset-settings"),

  // Change shortcut
  changeShortcut: async (shortcut, shortcutId) => {
    return await ipcRenderer.invoke("change-shortcut", shortcut, shortcutId);
  },

  // Google OAuth
  googleAuth: async () => {
    return await ipcRenderer.invoke("google-auth");
  },

  // Bottom pill API
  pillClicked: () => ipcRenderer.send("pill-clicked"),
  onPillState: (callback) => {
    ipcRenderer.on("pill-state", (event, state) => callback(state));
  },

  // Navigation from main process (e.g., tray → settings page)
  onShowPage: (callback) => {
    ipcRenderer.on("show-page", (event, page) => callback(page));
  },

  // Power Mode API
  powerModeStatus: (status) => ipcRenderer.send("power-mode-status", status),
  wakeWordDetected: () => ipcRenderer.send("wake-word-detected"),
  powerModeHeard: (text, isPartial) => ipcRenderer.send("power-mode-heard", text, isPartial),
  togglePowerMode: async (enabled) => {
    return await ipcRenderer.invoke("toggle-power-mode", enabled);
  },
  onPowerModeCommand: (callback) => {
    ipcRenderer.on("power-mode-command", (event, cmd, config) => callback(cmd, config));
  },
  onPowerModeUpdate: (callback) => {
    ipcRenderer.on("power-mode-update", (event, status) => callback(status));
  },
  onPowerModeHeard: (callback) => {
    ipcRenderer.on("power-mode-heard", (event, text, isPartial) => callback(text, isPartial));
  },
  onPowerModeResume: (callback) => {
    ipcRenderer.on("power-mode-resume", () => callback());
  },
  onDictationState: (callback) => {
    ipcRenderer.on("dictation-state", (event, state) => callback(state));
  },
});

// === GhostX IPC Kanallari ===
contextBridge.exposeInMainWorld("ghostx", {
  // Panik: Tum verileri aninda sil
  panic: () => ipcRenderer.send("ghostx-panic"),
  onPanicAck: (callback) => {
    ipcRenderer.on("ghostx-panic-ack", () => callback());
  },

  // Ekran koruma: Screenshot engellemePanik
  enableScreenProtection: () => ipcRenderer.send("ghostx-screen-protect", true),
  disableScreenProtection: () => ipcRenderer.send("ghostx-screen-protect", false),

  // Yerel ag (Bluetooth/Wi-Fi Direct)
  localStart: async (opts) => {
    return await ipcRenderer.invoke("ghostx-local-start", opts);
  },
  localStop: async () => {
    return await ipcRenderer.invoke("ghostx-local-stop");
  },
  localConnect: async (opts) => {
    return await ipcRenderer.invoke("ghostx-local-connect", opts);
  },
  localSend: async (opts) => {
    return await ipcRenderer.invoke("ghostx-local-send", opts);
  },
  localBroadcast: async (opts) => {
    return await ipcRenderer.invoke("ghostx-local-broadcast", opts);
  },
  localGetPeers: async () => {
    return await ipcRenderer.invoke("ghostx-local-peers");
  },
  onLocalPeerDiscovered: (callback) => {
    ipcRenderer.on("ghostx-local-peer-discovered", (event, peer) => callback(peer));
  },
  onLocalPeerLost: (callback) => {
    ipcRenderer.on("ghostx-local-peer-lost", (event, peer) => callback(peer));
  },
  onLocalMessage: (callback) => {
    ipcRenderer.on("ghostx-local-message", (event, msg) => callback(msg));
  },
});
