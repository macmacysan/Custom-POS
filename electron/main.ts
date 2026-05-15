import { app, BrowserWindow, ipcMain, net } from 'electron'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Google Apps Script URL for the 'Expenses' sheet
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwrGX0BI2TZKRn2_kUSUfTfimpsOsyPQ6kg5nBUIA_JafS80bIuJpR7p087WFKfjxcz/exec'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Ensure context isolation is enabled
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load from Vite dev server if running in dev mode
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading from dev server:', process.env.VITE_DEV_SERVER_URL)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    console.log('VITE_DEV_SERVER_URL not set, loading from file')
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  createWindow()

  // Set up generic IPC handler for syncing to Google Sheets
  ipcMain.handle('sync-to-gsheet', async (_event, { sheetName, data }) => {
    console.log(`Syncing to Google Sheets: ${sheetName}, rows: ${data.length}`)
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetName, data }),
      })

      console.log(`Response status: ${response.status} ${response.statusText}`)
      const responseBody = await response.text()
      console.log(`Response body: ${responseBody}`)

      if (response.ok) {
        return { success: true, status: response.status, data: responseBody }
      } else {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Request error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
