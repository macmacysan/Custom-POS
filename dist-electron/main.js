import { BrowserWindow, app, ipcMain, net } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
//#region electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwrGX0BI2TZKRn2_kUSUfTfimpsOsyPQ6kg5nBUIA_JafS80bIuJpR7p087WFKfjxcz/exec";
function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "../electron/preload.cjs"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}
app.whenReady().then(() => {
	createWindow();
	ipcMain.handle("sync-expenses", async (_event, data) => {
		return new Promise((resolve, reject) => {
			const request = net.request({
				method: "POST",
				url: GOOGLE_SCRIPT_URL
			});
			request.setHeader("Content-Type", "application/json");
			request.on("response", (response) => {
				let responseBody = "";
				response.on("data", (chunk) => {
					responseBody += chunk.toString();
				});
				response.on("end", () => {
					if (response.statusCode === 200 || response.statusCode === 302) resolve({
						success: true,
						status: response.statusCode,
						data: responseBody
					});
					else reject(/* @__PURE__ */ new Error(`Request failed with status ${response.statusCode}`));
				});
			});
			request.on("error", (error) => {
				reject(error);
			});
			request.write(JSON.stringify(data));
			request.end();
		});
	});
	app.on("activate", function() {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", function() {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
