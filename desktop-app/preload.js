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

  // Changelog
  getChangelog: async () => {
    return await ipcRenderer.invoke("get-changelog");
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

  // Vosk Model Management
  voskModelStatus: (lang) => ipcRenderer.invoke("vosk-model-status", lang),
  voskModelDownload: (lang) => ipcRenderer.invoke("vosk-model-download", lang),
  voskModelPath: (lang) => ipcRenderer.invoke("vosk-model-path", lang),
  voskModelDelete: (lang) => ipcRenderer.invoke("vosk-model-delete", lang),
  voskModelServerPort: () => ipcRenderer.invoke("vosk-model-server-port"),
  voskModelServeUrl: (lang) => ipcRenderer.invoke("vosk-model-serve-url", lang),
  voskDownloadAbort: () => ipcRenderer.invoke("vosk-download-abort"),
  importVoskModel: (lang) => ipcRenderer.invoke("import-vosk-model", lang),
  onVoskDownloadProgress: (callback) => {
    ipcRenderer.on("vosk-download-progress", (event, data) => callback(data));
  },

  // Auto-update API
  checkForUpdates: async () => {
    return await ipcRenderer.invoke("check-for-updates");
  },
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update-status", (event, data) => callback(data));
  },
});
