import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, screen } from "electron";

export class WindowManager {
  operator?: BrowserWindow;
  publicDisplay?: BrowserWindow;

  createWindows(): void {
    this.operator = this.createOperatorWindow();
    this.publicDisplay = this.createPublicDisplayWindow();
  }

  private createOperatorWindow(): BrowserWindow {
    const window = new BrowserWindow({
      width: 1440,
      height: 940,
      minWidth: 1200,
      minHeight: 780,
      title: "OLLIN Pulse - Operador",
      backgroundColor: "#071018",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        additionalArguments: ["--ollin-window-role=operator"]
      }
    });

    window.on("closed", () => {
      if (this.publicDisplay && !this.publicDisplay.isDestroyed()) {
        this.publicDisplay.close();
      }
      this.operator = undefined;
      app.quit();
    });

    void window.loadURL(this.resolveUrl("/#/operator"));
    return window;
  }

  private createPublicDisplayWindow(): BrowserWindow {
    const displays = screen.getAllDisplays();
    const external = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);
    const window = new BrowserWindow({
      width: 1280,
      height: 720,
      x: external?.bounds.x,
      y: external?.bounds.y,
      title: "OLLIN Pulse - Pantalla Pública",
      backgroundColor: "#071018",
      frame: false,
      fullscreen: true,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        additionalArguments: ["--ollin-window-role=public"]
      }
    });

    window.setMenuBarVisibility(false);
    void window.loadURL(this.resolveUrl("/#/public"));
    return window;
  }

  broadcast(channel: string, payload: unknown): void {
    for (const window of [this.operator, this.publicDisplay]) {
      if (window && !window.isDestroyed()) {
        window.webContents.send(channel, payload);
      }
    }
  }

  private resolveUrl(route: string): string {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) return `${devServerUrl}${route}`;
    const rendererEntry = path.join(__dirname, "../../dist-renderer/index.html");
    return `${pathToFileURL(rendererEntry).toString()}${route}`;
  }
}
