import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  syncExpenses: (data: any) => ipcRenderer.invoke('sync-expenses', data),
})
