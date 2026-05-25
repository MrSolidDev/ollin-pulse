<script setup lang="ts">
import type { SceneState } from "@shared/scene.types";

defineProps<{ scene: SceneState }>();
</script>

<template>
  <section class="control-panel">
    <header class="panel-header">
      <h2>Timeline</h2>
      <span>{{ scene.active.type }}</span>
    </header>
    <div class="timeline">
      <article v-for="item in scene.timeline" :key="item.id" :class="{ active: item.id === scene.active.id }">
        <strong>{{ item.type }}</strong>
        <small>{{ item.transition.name }} · {{ item.transition.durationMs }}ms</small>
      </article>
      <article v-for="item in scene.queue" :key="item.id">
        <strong>{{ item.type }}</strong>
        <small>siguiente</small>
      </article>
    </div>
  </section>
</template>
