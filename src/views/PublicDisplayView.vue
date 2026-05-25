<script setup lang="ts">
import SceneRenderer from "@/components/public/SceneRenderer.vue";
import { useIpcSync } from "@/composables/useIpcSync";
import { useGameStore } from "@/stores/game.store";
import { useSceneStore } from "@/stores/scene.store";

useIpcSync();

const game = useGameStore();
const scenes = useSceneStore();
</script>

<template>
  <SceneRenderer :game="game" :scene="scenes" />
</template>
