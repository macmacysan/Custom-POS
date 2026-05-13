export interface ElectronAPI {
  syncExpenses: (data: any) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
