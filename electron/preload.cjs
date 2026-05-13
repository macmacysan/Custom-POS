const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  syncExpenses: (data) => ipcRenderer.invoke('sync-expenses', data),
})
