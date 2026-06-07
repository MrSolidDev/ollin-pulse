import { defineStore } from "pinia";
import type { AppSnapshot } from "@shared/ipc.types";
import type { SceneState, SceneType } from "@shared/scene.types";

function isAppSnapshot(value: unknown): value is AppSnapshot {
  return Boolean(value && typeof value === "object" && "scene" in value && "game" in value);
}

export const useSceneStore = defineStore("scene", {
  state: (): SceneState => ({
    active: {
      id: "idle",
      type: "IDLE",
      payload: {},
      transition: { name: "fade", durationMs: 360 }
    },
    overlay: undefined,
    queue: [],
    timeline: [],
    updatedAt: new Date().toISOString()
  }),
  actions: {
    hydrate(state: SceneState) {
      Object.assign(this, state);
    },
    async sync() {
      const snapshot = await window.ollinPulse.getSnapshot();
      this.hydrate(snapshot.scene);
    },
    async setScene(type: SceneType, payload: Record<string, unknown> = {}) {
      const snapshot = await window.ollinPulse.invoke("scene:set", { type, payload });
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.scene);
    },
    async advanceScene() {
      const snapshot = await window.ollinPulse.invoke("scene:next", undefined);
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.scene);
    },
    async previousScene() {
      const snapshot = await window.ollinPulse.invoke("scene:previous", undefined);
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.scene);
    },
    async flashSteal() {
      const snapshot = await window.ollinPulse.invoke("scene:flashSteal", undefined);
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.scene);
    },
    async flashStrike() {
      const snapshot = await window.ollinPulse.invoke("scene:flashStrike", undefined);
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.scene);
    },
    async toggleScoreboard() {
      const snapshot = await window.ollinPulse.invoke("scene:toggleScoreboard", undefined);
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.scene);
    }
  }
});
