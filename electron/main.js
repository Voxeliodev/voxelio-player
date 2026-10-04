// ============================================================
// VOXELIO PLAYER — Electron main process
// ============================================================

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

app.setName("Voxelio");
app.setAppUserModelId("com.voxelio.player");

const VOXELIO_URL = "https://voxelio.vercel.app";
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

// ============================================================
// AUTO-UPDATER CONFIG
// ============================================================
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on("checking-for-update", () => {
  console.log("[updater] checking for update…");
});
autoUpdater.on("update-available", (info) => {
  console.log("[updater] update available:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("update-available", { version: info.version });
  }
});
autoUpdater.on("update-not-available", () => {
  console.log("[updater] no update available");
});
autoUpdater.on("error", (err) => {
  console.error("[updater] error:", err);
});
autoUpdater.on("download-progress", (progress) => {
  console.log(`[updater] download: ${Math.round(progress.percent)}%`);
  if (mainWindow) {
    mainWindow.webContents.send("update-progress", {
      percent: progress.percent,
    });
  }
});
autoUpdater.on("update-downloaded", (info) => {
  console.log("[updater] update downloaded:", info.version);
  if (mainWindow) {
    mainWindow.webContents.send("update-downloaded", { version: info.version });
  }
});

// ---- Single instance lock ----
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const url = extractVoxelioUrl(commandLine);
    if (url && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      loadGameFromUrl(url);
    }
  });

  app.whenReady().then(() => {
    registerProtocol();
    createWindow();

    // Check for updates on startup (after 5 seconds)
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error("[updater] check failed:", err);
      });
    }, 5000);

    // Then check every hour
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error("[updater] check failed:", err);
      });
    }, 60 * 60 * 1000);
  });
}

// ============================================================
// PROTOCOL REGISTRATION
// ============================================================
function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("voxelio", process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient("voxelio");
  }
}

function extractVoxelioUrl(argv) {
  if (!Array.isArray(argv)) return null;
  for (const arg of argv) {
    if (typeof arg === "string" && arg.startsWith("voxelio://")) {
      return arg;
    }
  }
  return null;
}

// ============================================================
// WINDOW
// ============================================================
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    minWidth: 800,
    minHeight: 500,
    title: "Voxelio",
    backgroundColor: "#0A0A1E",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "src", "game.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const initialUrl = extractVoxelioUrl(process.argv);
  if (initialUrl) {
    setTimeout(() => loadGameFromUrl(initialUrl), 300);
  }
}

// ============================================================
// GAME LOADING
// ============================================================
function loadGameFromUrl(url) {
  if (!mainWindow) return;

  let token = null;
  let worldId = null;
  try {
    const parsed = new URL(url);
    token = parsed.searchParams.get("token");
    worldId = parsed.searchParams.get("world");
  } catch (err) {
    console.error("[main] failed to parse URL:", err);
  }

  if (!token) {
    mainWindow.webContents.send("game-load-error", {
      error: "No launch token provided.",
    });
    return;
  }

  if (!worldId) {
    mainWindow.webContents.send("game-load-error", {
      error: "No world specified in launch link.",
    });
    return;
  }

  const gameUrl = `${VOXELIO_URL}/player/${worldId}?token=${encodeURIComponent(token)}`;
  mainWindow.webContents.send("game-load-url", { url: gameUrl });
}

// ============================================================
// IPC
// ============================================================
ipcMain.on("close-app", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.on("install-update", () => {
  autoUpdater.quitAndInstall();
});

// ============================================================
// LIFECYCLE
// ============================================================
app.on("window-all-closed", () => {
  app.quit();
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  if (url.startsWith("voxelio://") && mainWindow) {
    loadGameFromUrl(url);
  }
});