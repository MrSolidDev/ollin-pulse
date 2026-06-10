import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, net, protocol } from "electron";
import { GameController } from "./gameController";
import { registerIpc } from "./ipc";
import { SceneManager } from "./sceneManager";
import { WindowManager } from "./windowManager";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "ollin",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true
    }
  }
]);

const windows = new WindowManager();
const game = new GameController();
const scenes = new SceneManager();

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function registerRendererProtocol(): void {
  const rendererRoot = path.normalize(path.join(__dirname, "../../dist-renderer"));

  protocol.handle("ollin", (request) => {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.normalize(path.join(rendererRoot, requestedPath));

    if (!filePath.startsWith(rendererRoot)) {
      return new Response("Not found", { status: 404 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}

app.whenReady().then(() => {
  registerRendererProtocol();
  registerIpc({ game, scenes, windows });
  windows.createWindows();

  app.on("activate", () => {
    if (!windows.operator || windows.operator.isDestroyed()) {
      windows.createWindows();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
