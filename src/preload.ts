// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  openOverlay: () => ipcRenderer.send("open-overlay"),

  closeOverlay: () => ipcRenderer.send("close-overlay"),

  openOverlayFrame: () => ipcRenderer.send("open-overlay-frame"),

  closeOverlayFrame: () => ipcRenderer.send("close-overlay-frame"),

  sendPrompt: (prompt: string) => ipcRenderer.send("send-prompt", prompt),

  setPrompt: (prompt: string) => ipcRenderer.send("set-prompt", prompt),

  setHotMic: (isActive: boolean) => ipcRenderer.send("set-hotmic", isActive),

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

  onScreenshot: (
    callback: ({
      image,
      height,
      width,
      prompt,
    }: {
      image: string;
      height: number;
      width: number;
      prompt: string;
    }) => void
  ) => {
    ipcRenderer.on(
      "screenshot",
      (
        event,
        {
          image,
          height,
          width,
          prompt,
        }: {
          image: string;
          height: number;
          width: number;
          prompt: string;
        }
      ) => {
        callback({ image, height, width, prompt });
      }
    );
  },

  generateText: (prompt: string) => ipcRenderer.send("generate-text", prompt),

  onGeneratedText: (callback: (text: string) => void) => {
    ipcRenderer.on("generated-text", (event, text) => {
      callback(text);
    });
  },
});
