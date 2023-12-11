import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import { screen as nutScreen } from "@nut-tree/nut-js/dist/index";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let overlayWindow: BrowserWindow = null;

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }
};

const createOverlayWindow = (withFrame: boolean) => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.bounds;

  overlayWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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

  if (OVERLAY_WINDOW_VITE_DEV_SERVER_URL) {
    overlayWindow.loadURL(OVERLAY_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    overlayWindow.loadFile(
      path.join(__dirname, `../renderer/${OVERLAY_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

app.on("ready", () => {
  createMainWindow();

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
    const image = await nutScreen.capture("screenshot.png");
    console.log(image);
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
