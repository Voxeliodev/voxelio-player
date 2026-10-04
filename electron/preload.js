// ============================================================
// VOXELIO PLAYER — Preload script
// ============================================================

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voxelio", {
  closeApp: () => ipcRenderer.send("close-app"),
  installUpdate: () => ipcRenderer.send("install-update"),

  onLoadUrl: (callback) => {
    ipcRenderer.on("game-load-url", (_event, payload) => callback(payload));
  },
  onLoadError: (callback) => {
    ipcRenderer.on("game-load-error", (_event, payload) => callback(payload));
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", (_event, payload) => callback(payload));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on("update-progress", (_event, payload) => callback(payload));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on("update-downloaded", (_event, payload) => callback(payload));
  },
});