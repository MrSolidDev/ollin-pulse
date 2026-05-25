<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SceneRenderer from "@/components/public/SceneRenderer.vue";
import TimelinePanel from "@/components/operator/TimelinePanel.vue";
import { useIpcSync } from "@/composables/useIpcSync";
import { mockQuestions } from "@/data/mockQuestions";
import { useGameStore } from "@/stores/game.store";
import { useSceneStore } from "@/stores/scene.store";
import { GAME_MODE_LABELS, type GameMode, type Team } from "@shared/game.types";
import type { QuestionImportResult } from "@shared/import.types";

useIpcSync();

const game = useGameStore();
const scenes = useSceneStore();
const teamA = ref("Equipo A");
const teamB = ref("Equipo B");
const importErrors = ref<string[]>([]);
const statusMessage = ref("Sistema listo");
const previewFrame = ref<HTMLElement | null>(null);
const previewScale = ref(0.5);
let previewObserver: ResizeObserver | undefined;

const selectedQuestionId = computed({
  get: () => (isChoosingNextRoundQuestion.value ? game.pendingNextQuestionId ?? "" : game.currentQuestionId ?? ""),
  set: (questionId: string) => {
    if (!questionId) return;
    if (isChoosingNextRoundQuestion.value) {
      void game.setPendingNextQuestion(questionId);
      statusMessage.value = "Pregunta preparada para la siguiente ronda";
      return;
    }
    void game.setQuestion(questionId);
  }
});

const canStart = computed(() => game.questions.length > 0 && game.questions.every((question) => question.answers.length >= 6 && question.answers.length <= 8));
const hasNextRound = computed(() => game.currentRound < game.rounds.length);
const isChoosingNextRoundQuestion = computed(() => scenes.active.type === "ROUND_RESULT" && hasNextRound.value);
const questionListRound = computed(() => (isChoosingNextRoundQuestion.value ? game.currentRound + 1 : game.currentRound));
const visibleQuestions = computed(() => game.questions.filter((question) => question.round === questionListRound.value));
const questionListTitle = computed(() => (isChoosingNextRoundQuestion.value ? `Preguntas ronda ${questionListRound.value}` : "Preview siguiente"));

watch(
  () => game.teams,
  (teams) => {
    teamA.value = teams[0].name;
    teamB.value = teams[1].name;
  },
  { immediate: true }
);

async function saveTeams() {
  await game.setTeams([
    { id: "A", name: teamA.value },
    { id: "B", name: teamB.value }
  ]);
  statusMessage.value = "Equipos actualizados";
}

async function setMode(event: Event) {
  await game.setMode((event.target as HTMLSelectElement).value as GameMode);
}

async function importQuestions() {
  importErrors.value = [];
  const result = (await game.importQuestions()) as QuestionImportResult;
  importErrors.value = result.errors.map((error) => `Fila ${error.row}: ${error.message}`);
  statusMessage.value = result.questions.length > 0 ? `${result.questions.length} preguntas cargadas` : "Importación cancelada";
}

async function startGame() {
  try {
    await game.start();
    statusMessage.value = "Juego iniciado";
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "No se pudo iniciar";
  }
}

async function quickScene(type: "SCOREBOARD" | "STEAL") {
  await scenes.setScene(type, { teams: game.teams });
}

async function showVisualStrike() {
  try {
    await scenes.flashStrike();
    statusMessage.value = "X visual";
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "No se pudo mostrar X";
  }
}

async function announceSteal() {
  try {
    await scenes.flashSteal();
    statusMessage.value = "Robo anunciado";
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "No se pudo anunciar robo";
  }
}

async function nextScene() {
  try {
    const before = scenes.active.type;
    await scenes.advanceScene();
    statusMessage.value = `Escena: ${before} -> ${scenes.active.type}`;
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "No se pudo avanzar escena";
  }
}

async function previousScene() {
  try {
    await scenes.previousScene();
    statusMessage.value = `Escena: ${scenes.active.type}`;
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "No se pudo retroceder escena";
  }
}

function addError(teamId: Team["id"]) {
  void game.addError(teamId);
}

function reveal(index: number) {
  void game.revealAnswer(index);
}

async function awardRound(teamId: Team["id"]) {
  try {
    await game.awardRound(teamId);
    const team = game.teams.find((item) => item.id === teamId);
    statusMessage.value = `Bolsa asignada a ${team?.name ?? teamId}`;
  } catch (error) {
    statusMessage.value = error instanceof Error ? error.message : "No se pudo asignar la bolsa";
  }
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;

  if (event.code === "Space") {
    event.preventDefault();
    void nextScene();
  } else if (event.code === "Backspace") {
    event.preventDefault();
    void previousScene();
  } else if (/^[1-8]$/.test(event.key)) {
    reveal(Number(event.key) - 1);
  } else if (event.key.toLowerCase() === "q") {
    addError("A");
  } else if (event.key.toLowerCase() === "p") {
    addError("B");
  } else if (event.key.toLowerCase() === "r") {
    void announceSteal();
  }
}

function updatePreviewScale() {
  if (!previewFrame.value) return;
  const { width, height } = previewFrame.value.getBoundingClientRect();
  previewScale.value = Math.min(width / 1280, height / 720);
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  previewObserver = new ResizeObserver(updatePreviewScale);
  if (previewFrame.value) previewObserver.observe(previewFrame.value);
  updatePreviewScale();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  previewObserver?.disconnect();
});
</script>

<template>
  <main class="operator-shell">
    <aside class="field-grid">
      <section class="control-panel">
        <header class="panel-header">
          <h2>Partida</h2>
          <span>{{ statusMessage }}</span>
        </header>

        <label>
          Modo
          <select :value="game.mode" @change="setMode">
            <option v-for="(label, mode) in GAME_MODE_LABELS" :key="mode" :value="mode">{{ label }}</option>
          </select>
        </label>

        <div class="button-grid">
          <button class="primary-button" :disabled="!canStart" @click="startGame">Iniciar</button>
          <button class="ghost-button danger-button" @click="game.end">Finalizar</button>
          <button class="ghost-button" @click="game.reset">Reset</button>
        </div>
      </section>

      <section class="control-panel field-grid">
        <header class="panel-header">
          <h2>Equipos</h2>
          <span>En vivo</span>
        </header>
        <label>
          Equipo A
          <input v-model="teamA" @change="saveTeams" />
        </label>
        <label>
          Equipo B
          <input v-model="teamB" @change="saveTeams" />
        </label>
        <button class="primary-button" @click="saveTeams">Guardar nombres</button>
      </section>

      <section class="control-panel">
        <header class="panel-header">
          <h2>Controles rápidos</h2>
          <span>{{ game.phase }}</span>
        </header>
        <div class="button-grid">
          <button class="ghost-button" @click="previousScene">Escena anterior</button>
          <button class="primary-button" @click="nextScene">Siguiente escena</button>
          <button class="ghost-button" @click="announceSteal">Anunciar robo</button>
          <button class="ghost-button" @click="quickScene('SCOREBOARD')">Marcador</button>
          <button class="ghost-button danger-button" @click="showVisualStrike">Mostrar X</button>
          <button class="ghost-button danger-button" @click="addError('A')">Error A</button>
          <button class="ghost-button danger-button" @click="addError('B')">Error B</button>
          <button class="ghost-button" @click="game.resetErrors">Reset errores</button>
        </div>
      </section>

      <TimelinePanel :scene="scenes" />
    </aside>

    <section class="preview-stack">
      <div class="preview-panel">
        <header class="panel-header">
          <h2>Preview actual</h2>
          <span>{{ scenes.active.type }}</span>
        </header>
        <div ref="previewFrame" class="mini-stage">
          <div class="mini-stage-content" :style="{ transform: `translate(-50%, -50%) scale(${previewScale})` }">
            <SceneRenderer :game="game" :scene="scenes" />
          </div>
        </div>
      </div>

      <div class="preview-panel">
        <header class="panel-header">
          <h2>{{ questionListTitle }}</h2>
          <span>{{ isChoosingNextRoundQuestion ? "Preparar" : scenes.next?.type ?? "Sin cola" }}</span>
        </header>
        <div class="question-list">
          <button v-for="question in visibleQuestions" :key="question.id" :class="{ active: question.id === selectedQuestionId }" @click="selectedQuestionId = question.id">
            <strong>R{{ question.round }}</strong> · {{ question.text }}
            <small>{{ question.answers.length }} respuestas · {{ question.totalPoints }} pts</small>
          </button>
        </div>
      </div>
    </section>

    <aside class="field-grid">
      <section class="control-panel">
        <header class="panel-header">
          <h2>Preguntas</h2>
          <span>{{ game.questions.length }}</span>
        </header>
        <div class="button-grid">
          <button class="primary-button" @click="importQuestions">Cargar CSV/XLSX</button>
          <button class="ghost-button" @click="game.loadMockQuestions(mockQuestions)">Datos mock</button>
        </div>
        <div v-if="importErrors.length" class="question-list">
          <button v-for="error in importErrors" :key="error" class="danger-button">{{ error }}</button>
        </div>
      </section>

      <section class="control-panel">
        <header class="panel-header">
          <h2>Revelar</h2>
          <span>{{ game.currentQuestion?.answers.length ?? 0 }}</span>
        </header>
        <div class="button-grid award-buttons">
          <button class="primary-button" @click="awardRound('A')">Gana {{ game.teams[0].name }}</button>
          <button class="primary-button" @click="awardRound('B')">Gana {{ game.teams[1].name }}</button>
        </div>
        <div class="answer-control-list">
          <button
            v-for="(answer, index) in game.currentQuestion?.answers"
            :key="answer.id"
            class="answer-control"
            :class="{ revealed: answer.revealed }"
            @click="reveal(index)"
          >
            <span class="answer-control-index">{{ index + 1 }}</span>
            <span class="answer-control-text">{{ answer.text }}</span>
            <strong>{{ answer.points }}</strong>
          </button>
        </div>
      </section>

      <section class="control-panel">
        <header class="panel-header">
          <h2>Estado</h2>
          <span>R{{ game.currentRound }}</span>
        </header>
        <div class="timeline">
          <article>
            <strong>{{ game.teams[0].name }}</strong>
            <small>{{ game.teams[0].score }} pts · {{ game.teams[0].errors }} errores</small>
          </article>
          <article>
            <strong>{{ game.teams[1].name }}</strong>
            <small>{{ game.teams[1].score }} pts · {{ game.teams[1].errors }} errores</small>
          </article>
          <article>
            <strong>Bolsa</strong>
            <small>{{ game.roundBank }} pts</small>
          </article>
        </div>
      </section>
    </aside>
  </main>
</template>
