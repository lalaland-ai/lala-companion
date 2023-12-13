import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  systemPreferences,
  session,
  desktopCapturer,
} from "electron";
import {
  keyboard,
  mouse,
  Point,
  straightTo,
} from "@nut-tree/nut-js/dist/index";
import { writeFile } from "fs";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let overlayWindow: BrowserWindow = null;
let mainWindow: BrowserWindow = null;
let currentPrompt = "";

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

const createOverlayWindow = (
  withFrame: boolean,
  width: number,
  height: number
) => {
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
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.bounds;

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

  if (process.platform === "darwin") {
    systemPreferences.askForMediaAccess("microphone");
  }

  ipcMain.on("open-overlay", () => {
    createOverlayWindow(false, width, height);
  });

  ipcMain.on("close-overlay", () => {
    overlayWindow?.close();
    overlayWindow = null;
  });

  ipcMain.on("open-overlay-frame", () => {
    overlayWindow?.close();
    overlayWindow = null;
    createOverlayWindow(true, width, height);
  });

  ipcMain.on("close-overlay-frame", () => {
    overlayWindow?.close();
    overlayWindow = null;
    createOverlayWindow(false, width, height);
  });

  ipcMain.on("send-prompt", (event, prompt: string) => {
    overlayWindow?.webContents.send("prompt-sent", prompt);
  });

  ipcMain.on("set-prompt", (event, prompt: string) => {
    currentPrompt = prompt;
  });

  ipcMain.on("set-hotmic", (event, isActive: boolean) => {
    overlayWindow?.webContents.send("hotmic-toggled", isActive);
  });

  ipcMain.on("set-hotmic", (event, isActive: boolean) => {
    overlayWindow?.webContents.send("hotmic-toggled", isActive);
  });

  ipcMain.on("click", async (event, { x, y }: { x: number; y: number }) => {
    console.log(x, y);
    await mouse.move(straightTo(new Point(x, y)));
    await mouse.leftClick();
  });

  ipcMain.on("type", async (event, text: string) => {
    await keyboard.type(text);
  });

  ipcMain.on("get-screenshot", async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width,
          height,
        },
      });

      const png = sources[0].thumbnail.toPNG();
      const base64 = png.toString("base64");

      mainWindow?.webContents.send("screenshot", {
        image: base64,
        height,
        width,
        prompt: currentPrompt,
      });

      writeFile("screenshot.png", png, (err) => {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved!");
      });
    } catch (e) {
      console.error(e);
    }
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
