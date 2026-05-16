//#region \0rolldown/runtime.js
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, { get: (a, b) => (typeof require !== "undefined" ? require : a)[b] }) : x)(function(x) {
	if (typeof require !== "undefined") return require.apply(this, arguments);
	throw Error("Calling `require` for \"" + x + "\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.");
});
//#endregion
//#region electron/main.ts
var { app, BrowserWindow, ipcMain, net } = __require("electron");
var path = __require("path");
var { fileURLToPath } = __require("url");
process.env.NODE_ENV;
var _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
function createWindow() {
	const preloadPath = path.resolve(_dirname, "preload.cjs");
	console.log("[Main] __dirname:", _dirname);
	console.log("[Main] Loading preload from:", preloadPath);
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: preloadPath,
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) {
		console.log("Loading from dev server:", process.env.VITE_DEV_SERVER_URL);
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	} else {
		console.log("VITE_DEV_SERVER_URL not set, loading from file");
		mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
	}
	if (process.env.NODE_ENV === "development") mainWindow.webContents.openDevTools();
}
app.whenReady().then(() => {
	const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwrGX0BI2TZKRn2_kUSUfTfimpsOsyPQ6kg5nBUIA_JafS80bIuJpR7p087WFKfjxcz/exec";
	createWindow();
	async function postJsonToScript(url, payload, redirectCount = 0) {
		console.log(`[Main] Initiating request to: ${url.substring(0, 50)}...`);
		const body = JSON.stringify(payload);
		return new Promise((resolve, reject) => {
			try {
				const request = net.request({
					method: "POST",
					url
				});
				request.setHeader("Content-Type", "application/json");
				request.on("response", (response) => {
					let responseBody = "";
					console.log(`[Main] Received response status: ${response.statusCode}`);
					response.on("data", (chunk) => {
						responseBody += chunk.toString();
					});
					response.on("end", () => {
						resolve({
							status: response.statusCode ?? 0,
							statusText: response.statusMessage ?? "",
							body: responseBody
						});
					});
					response.on("error", (err) => {
						console.error("[Main] Response stream error:", err);
						reject(err);
					});
				});
				request.on("error", (err) => {
					console.error("[Main] Network/Request error:", err);
					reject(err);
				});
				request.write(body);
				request.end();
				console.log("[Main] Request sent successfully");
			} catch (err) {
				console.error("[Main] Exception during request setup:", err);
				reject(err);
			}
		});
	}
	ipcMain.handle("sync-to-gsheet", async (_event, { sheetName, data }) => {
		console.log(`Syncing to Google Sheets: ${sheetName}, rows: ${data.length}`);
		try {
			const response = await postJsonToScript(GOOGLE_SCRIPT_URL, {
				sheetName,
				data
			});
			console.log(`Response status: ${response.status} ${response.statusText}`);
			console.log(`Response body: ${response.body}`);
			if (response.status === 200 || response.status === 302) return {
				success: true,
				status: response.status,
				data: response.body
			};
			else throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
		} catch (error) {
			console.error("Request error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	});
	app.on("activate", function() {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", function() {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
