import { contextBridge, ipcRenderer } from "electron";
import type { GameState } from "../shared/game.types";
import type { IpcCommandMap, IpcCommandName, OllinPulseApi } from "../shared/ipc.types";
import type { SceneState } from "../shared/scene.types";

const roleArg = process.argv.find((arg) => arg.startsWith("--ollin-window-role="));
const role = roleArg?.split("=")[1] === "public" ? "public" : "operator";

const api: OllinPulseApi = {
  invoke<TName extends IpcCommandName>(channel: TName, payload: IpcCommandMap[TName]) {
    return ipcRenderer.invoke("ollin:command", channel, payload);
  },
  onGameStateUpdated(callback: (state: GameState) => void) {
    const listener = (_event: Electron.IpcRendererEvent, state: GameState) => callback(state);
    ipcRenderer.on("game:stateUpdated", listener);
    return () => ipcRenderer.removeListener("game:stateUpdated", listener);
  },
  onSceneStateUpdated(callback: (state: SceneState) => void) {
    const listener = (_event: Electron.IpcRendererEvent, state: SceneState) => callback(state);
    ipcRenderer.on("scene:stateUpdated", listener);
    return () => ipcRenderer.removeListener("scene:stateUpdated", listener);
  },
  getSnapshot() {
    return ipcRenderer.invoke("app:getSnapshot");
  },
  getWindowRole() {
    return role;
  }
};

contextBridge.exposeInMainWorld("ollinPulse", api);
