export interface ElectronAPI {
  syncToGSheet: (sheetName: string, data: any) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
