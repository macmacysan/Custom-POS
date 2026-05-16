const { contextBridge, ipcRenderer } = require('electron')

console.log('[Preload] Script is loading and exposing electronAPI')

contextBridge.exposeInMainWorld('electronAPI', {
  syncToGSheet: (sheetName: string, data: any) => ipcRenderer.invoke('sync-to-gsheet', { sheetName, data }),
})
