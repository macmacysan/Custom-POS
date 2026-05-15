import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  syncToGSheet: (sheetName: string, data: any) => ipcRenderer.invoke('sync-to-gsheet', { sheetName, data }),
})
