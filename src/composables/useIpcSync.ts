import { onBeforeUnmount, onMounted } from "vue";
import { useGameStore } from "@/stores/game.store";
import { useSceneStore } from "@/stores/scene.store";

export function useIpcSync() {
  const game = useGameStore();
  const scenes = useSceneStore();
  const disposers: Array<() => void> = [];

  onMounted(async () => {
    const snapshot = await window.ollinPulse.getSnapshot();
    game.hydrate(snapshot.game);
    scenes.hydrate(snapshot.scene);
    disposers.push(window.ollinPulse.onGameStateUpdated((state) => game.hydrate(state)));
    disposers.push(window.ollinPulse.onSceneStateUpdated((state) => scenes.hydrate(state)));
  });

  onBeforeUnmount(() => {
    disposers.forEach((dispose) => dispose());
  });
}
