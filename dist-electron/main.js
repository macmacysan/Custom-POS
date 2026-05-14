import { BrowserWindow as e, app as t, ipcMain as n, net as r } from "electron";
import * as i from "path";
import { fileURLToPath as a } from "url";
//#region electron/main.ts
var o = a(import.meta.url), s = i.dirname(o), c = "https://script.google.com/macros/s/AKfycbwrGX0BI2TZKRn2_kUSUfTfimpsOsyPQ6kg5nBUIA_JafS80bIuJpR7p087WFKfjxcz/exec";
function l() {
	let t = new e({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: i.join(s, "../electron/preload.cjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	});
	process.env.VITE_DEV_SERVER_URL ? t.loadURL(process.env.VITE_DEV_SERVER_URL) : t.loadFile(i.join(s, "../dist/index.html"));
}
t.whenReady().then(() => {
	l(), n.handle("sync-expenses", async (e, t) => new Promise((e, n) => {
		let i = r.request({
			method: "POST",
			url: c
		});
		i.setHeader("Content-Type", "application/json"), i.on("response", (t) => {
			let r = "";
			t.on("data", (e) => {
				r += e.toString();
			}), t.on("end", () => {
				t.statusCode === 200 || t.statusCode === 302 ? e({
					success: !0,
					status: t.statusCode,
					data: r
				}) : n(/* @__PURE__ */ Error(`Request failed with status ${t.statusCode}`));
			});
		}), i.on("error", (e) => {
			n(e);
		}), i.write(JSON.stringify(t)), i.end();
	})), t.on("activate", function() {
		e.getAllWindows().length === 0 && l();
	});
}), t.on("window-all-closed", function() {
	process.platform !== "darwin" && t.quit();
});
//#endregion
