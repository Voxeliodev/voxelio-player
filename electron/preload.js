// ============================================================
// VOXELIO PLAYER — Preload script
// ============================================================

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voxelio", {
  closeApp: () => ipcRenderer.send("close-app"),

  onLoadUrl: (callback) => {
    ipcRenderer.on("game-load-url", (_event, payload) => callback(payload));
  },

  onLoadError: (callback) => {
    ipcRenderer.on("game-load-error", (_event, payload) => callback(payload));
  },
});