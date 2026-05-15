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

  async function postJsonToScript(url: string, payload: unknown) {
    return new Promise<{ status: number; statusText: string; body: string }>((resolve, reject) => {
      const request = net.request({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      request.on('response', (response) => {
        let responseBody = ''
        response.on('data', (chunk) => {
          responseBody += chunk.toString()
        })
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? '',
            body: responseBody,
          })
        })
        response.on('error', reject)
      })

      request.on('error', reject)
      request.write(JSON.stringify(payload))
      request.end()
    })
  }

  // Set up generic IPC handler for syncing to Google Sheets
  ipcMain.handle('sync-to-gsheet', async (_event, { sheetName, data }) => {
    console.log(`Syncing to Google Sheets: ${sheetName}, rows: ${data.length}`)
    try {
      const response = await postJsonToScript(GOOGLE_SCRIPT_URL, { sheetName, data })

      console.log(`Response status: ${response.status} ${response.statusText}`)
      console.log(`Response body: ${response.body}`)

      if (response.status >= 200 && response.status < 300) {
        return { success: true, status: response.status, data: response.body }
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
