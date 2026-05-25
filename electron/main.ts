import { app } from "electron";
import { GameController } from "./gameController";
import { registerIpc } from "./ipc";
import { SceneManager } from "./sceneManager";
import { WindowManager } from "./windowManager";

const windows = new WindowManager();
const game = new GameController();
const scenes = new SceneManager();

app.whenReady().then(() => {
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
