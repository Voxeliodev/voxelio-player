// ============================================================
// VOXELIO PLAYER — Electron main process
// ============================================================

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

app.setName("Voxelio");
app.setAppUserModelId("com.voxelio.player");

const VOXELIO_URL = "https://voxelio.vercel.app";
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

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

  // If launched with a voxelio:// URL, tell the renderer to load it
  const initialUrl = extractVoxelioUrl(process.argv);
  if (initialUrl) {
    setTimeout(() => loadGameFromUrl(initialUrl), 300);
  }
}

// ============================================================
// GAME LOADING — NO TOKEN EXCHANGE HERE
// ============================================================
// The deep link now contains BOTH the token AND the world ID:
//   voxelio://launch?token=XXX&world=chaos-coliseum
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