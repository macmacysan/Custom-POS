import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
console.log("[Preload] Script is loading and exposing electronAPI");
contextBridge.exposeInMainWorld("electronAPI", { syncToGSheet: (sheetName, data) => ipcRenderer.invoke("sync-to-gsheet", {
	sheetName,
	data
}) });
//#endregion
