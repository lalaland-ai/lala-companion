import { app, BrowserWindow, ipcMain, screen, session } from "electron";
import { screen as nutScreen, FileType } from "@nut-tree/nut-js/dist/index";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let overlayWindow: BrowserWindow = null;
let mainWindow: BrowserWindow = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
};

const createOverlayWindow = (withFrame: boolean) => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.bounds;

  overlayWindow = new BrowserWindow({
    webPreferences: {
      preload: OVERLAY_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    height: 800,
    width: 500,
    alwaysOnTop: true,
    transparent: true,
    frame: withFrame,
    x: width,
    y: height,
  });

  overlayWindow.setFocusable(false);
  overlayWindow.loadURL(OVERLAY_WINDOW_WEBPACK_ENTRY);

  // if (process.env.NODE_ENV === "development") {
  //   overlayWindow.webContents.openDevTools();
  // }
};

app.on("ready", () => {
  createMainWindow();
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-eval' 'unsafe-inline' https://lalaland.chat https://fonts.gstatic.com file: data: blob: filesystem:",
          "script-src 'self' 'unsafe-eval' file: data: blob: filesystem:",
          "worker-src 'self' 'unsafe-eval' file: data: blob: filesystem:",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://lalaland.chat data:",
          "connect-src 'self' https://lalaland.chat https://fonts.gstatic.com file: data: blob: filesystem:",
          "media-src 'self' https://lalaland.chat data: blob: filesystem:",
        ],
      },
    });
  });

  ipcMain.on("open-overlay", (event, title) => {
    createOverlayWindow(false);
  });

  ipcMain.on("close-overlay", (event, title) => {
    overlayWindow?.close();
    overlayWindow = null;
  });

  ipcMain.on("open-overlay-frame", (event, title) => {
    overlayWindow?.close();
    overlayWindow = null;
    createOverlayWindow(true);
  });

  ipcMain.on("close-overlay-frame", (event, title) => {
    overlayWindow?.close();
    overlayWindow = null;
    createOverlayWindow(false);
  });

  ipcMain.on("send-prompt", (event, prompt) => {
    overlayWindow?.webContents.send("prompt-sent", prompt);
  });

  ipcMain.on("toggle-hotmic", (event, isActive) => {
    overlayWindow?.webContents.send("hotmic-toggled", isActive);
  });

  ipcMain.on("get-screenshot", async (event) => {
    const image = await nutScreen.capture("screenshot.png", FileType.PNG);
    overlayWindow?.webContents.send("screenshot", image);
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
