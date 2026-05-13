import { contextBridge as e, ipcRenderer as t } from "electron";
//#region electron/preload.ts
e.exposeInMainWorld("electronAPI", { syncExpenses: (e) => t.invoke("sync-expenses", e) });
//#endregion
