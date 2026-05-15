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
      preload: path.join(__dirname, '../electron/preload.cjs'),
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

  // Set up IPC handler for syncing expenses
  ipcMain.handle('sync-expenses', async (_event, data) => {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url: GOOGLE_SCRIPT_URL,
      })

      request.setHeader('Content-Type', 'application/json')

      request.on('response', (response) => {
        let responseBody = ''
        response.on('data', (chunk) => {
          responseBody += chunk.toString()
        })
        response.on('end', () => {
          if (response.statusCode === 200 || response.statusCode === 302) {
            resolve({ success: true, status: response.statusCode, data: responseBody })
          } else {
            reject(new Error(`Request failed with status ${response.statusCode}`))
          }
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      // Send the JSON payload
      request.write(JSON.stringify(data))
      request.end()
    })
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
