import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
contextBridge.exposeInMainWorld("electronAPI", { syncToGSheet: (sheetName, data) => ipcRenderer.invoke("sync-to-gsheet", {
	sheetName,
	data
}) });
//#endregion
