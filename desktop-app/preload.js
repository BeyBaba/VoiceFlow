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
});
