// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  openOverlay: () => ipcRenderer.send("open-overlay"),

  closeOverlay: () => ipcRenderer.send("close-overlay"),

  openOverlayFrame: () => ipcRenderer.send("open-overlay-frame"),

  closeOverlayFrame: () => ipcRenderer.send("close-overlay-frame"),

  sendPrompt: (prompt: string) => ipcRenderer.send("send-prompt", prompt),

  toggleHotMic: (isActive: boolean) =>
    ipcRenderer.send("toggle-hotmic", isActive),

  onPromptSent: (callback: (prompt: string) => void) => {
    ipcRenderer.on("prompt-sent", (event, prompt) => {
      callback(prompt);
    });
  },

  onHotMicToggled: (callback: (isActive: boolean) => void) => {
    ipcRenderer.on("hotmic-toggled", (event, isActive) => {
      callback(isActive);
    });
  },

  getScreenshot: () => ipcRenderer.send("get-screenshot"),

  onScreenshot: (callback: (image: string) => void) => {
    ipcRenderer.on("screenshot", (event, image) => {
      callback(image);
    });
  },
});
