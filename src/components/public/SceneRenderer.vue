<script setup lang="ts">
import { computed, watch } from "vue";
import type { GameState } from "@shared/game.types";
import type { SceneState } from "@shared/scene.types";

const assetUrl = (path: string) => new URL(`../../assets/${path}`, import.meta.url).href;

const assets = {
  idleBg: assetUrl("game/bg-idle.png"),
  introBg: assetUrl("game/bg-intro.png"),
  roundBg: assetUrl("game/bg-round.png"),
  boardBg: assetUrl("game/bg-board.png"),
  revealBg: assetUrl("game/bg-reveal.png"),
  strikeBg: assetUrl("game/bg-strike.png"),
  stealBg: assetUrl("game/bg-steal.png"),
  resultBg: assetUrl("game/bg-result.png"),
  scoreboardBg: assetUrl("game/bg-scoreboard.png"),
  finalBg: assetUrl("game/bg-final.png"),
  brandLogo: assetUrl("game/logo-12-familias.png"),
  drinkiqLogo: assetUrl("game/logo-drinkiq.png"),
  buchananLogo: assetUrl("game/logo-buchanans.png"),
  strikeMark: assetUrl("game/mark-strike.png"),
  stealMark: assetUrl("game/mark-steal.png")
};

const sounds = {
  roundIntro: assetUrl("sounds/round-intro.mp3"),
  answerReveal: assetUrl("sounds/answer-reveal.mp3"),
  strike: assetUrl("sounds/strike.mp3"),
  steal: assetUrl("sounds/steal-points.mp3"),
  win: assetUrl("sounds/win.mp3")
};

const props = defineProps<{
  game: GameState;
  scene: SceneState;
}>();

const currentQuestion = computed(() => props.game.questions.find((question) => question.id === props.game.currentQuestionId));
const winner = computed(() => props.game.teams.find((team) => team.id === props.game.winnerTeamId));
const roundWinner = computed(() => {
  const round = props.game.rounds.find((item) => item.number === props.game.currentRound);
  return props.game.teams.find((team) => team.id === round?.winningTeamId);
});
const currentRound = computed(() => props.game.rounds[props.game.currentRound - 1]);
const questionText = computed(() => currentQuestion.value?.text ?? "Selecciona una pregunta");
const revealedAnswers = computed(() => currentQuestion.value?.answers.filter((answer) => answer.revealed).length ?? 0);
const answerCount = computed(() => currentQuestion.value?.answers.length ?? 0);
const questionSizeClass = computed(() => {
  const length = questionText.value.length;
  if (length > 105) return "question-text-xs";
  if (length > 78) return "question-text-sm";
  if (length > 54) return "question-text-md";
  return "question-text-lg";
});
const activeSceneType = computed(() => props.scene.active.type);
const activeSceneId = computed(() => props.scene.active.id);
const overlayId = computed(() => props.scene.overlay?.id);
const isBoardScene = computed(() => ["QUESTION_BOARD", "ANSWER_REVEAL", "STRIKE", "STEAL"].includes(activeSceneType.value));
const stageBackground = computed(() => {
  const map = {
    IDLE: assets.idleBg,
    INTRO: assets.introBg,
    ROUND_INTRO: assets.roundBg,
    QUESTION_BOARD: assets.boardBg,
    ANSWER_REVEAL: assets.revealBg,
    STRIKE: assets.strikeBg,
    STEAL: assets.stealBg,
    ROUND_RESULT: assets.resultBg,
    SCOREBOARD: assets.scoreboardBg,
    FINAL_WINNER: assets.finalBg
  };

  return { backgroundImage: `url("${map[activeSceneType.value]}")` };
});

function errorLabel(count: number) {
  return `${count} ${count === 1 ? "ERROR" : "ERRORES"}`;
}

const isPublicWindow = () => window.ollinPulse?.getWindowRole?.() === "public";

const audioCache = new Map<string, HTMLAudioElement>();

function playSound(src: string) {
  if (!isPublicWindow()) return;

  const audio = audioCache.get(src) ?? new Audio(src);
  audioCache.set(src, audio);
  audio.pause();
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Electron/browser autoplay policies can reject sound until the window has focus.
  });
}

watch(activeSceneId, () => {
  switch (activeSceneType.value) {
    case "ROUND_INTRO":
      playSound(sounds.roundIntro);
      break;
    case "ANSWER_REVEAL":
      playSound(sounds.answerReveal);
      break;
    case "STRIKE":
      playSound(sounds.strike);
      break;
    case "STEAL":
      playSound(sounds.steal);
      break;
    case "ROUND_RESULT":
    case "FINAL_WINNER":
      playSound(sounds.win);
      break;
  }
});

watch(overlayId, () => {
  switch (props.scene.overlay?.type) {
    case "STRIKE":
      playSound(sounds.strike);
      break;
    case "STEAL":
      playSound(sounds.steal);
      break;
  }
});
</script>

<template>
  <main
    class="public-stage public-branded-stage"
    :class="[`scene-${activeSceneType.toLowerCase().replace('_', '-')}`, { 'few-answers': answerCount > 0 && answerCount < 6, 'many-answers': answerCount > 6 }]"
    :style="stageBackground"
  >
    <img class="drinkiq-brand" :src="assets.drinkiqLogo" alt="" aria-hidden="true" />
    <img class="buchanan-brand" :src="assets.buchananLogo" alt="" aria-hidden="true" />

    <section v-if="scene.active.type === 'IDLE'" class="stage-center">
      <h1 class="gold-title">Listos para jugar</h1>
      <div class="hero-versus">
        <span>{{ game.teams[0].name }}</span>
        <b>VS</b>
        <span>{{ game.teams[1].name }}</span>
      </div>
      <img class="brand-logo bottom-logo" :src="assets.brandLogo" alt="" />
    </section>

    <section v-else-if="scene.active.type === 'INTRO'" class="stage-center">
      <img class="brand-logo corner-logo" :src="assets.brandLogo" alt="" />
      <p class="eyebrow">Presenta</p>
      <div class="intro-card">
        <span>{{ game.teams[0].name }}</span>
        <b>VS</b>
        <span>{{ game.teams[1].name }}</span>
      </div>
    </section>

    <section v-else-if="scene.active.type === 'ROUND_INTRO'" class="stage-center">
      <p class="eyebrow">Ronda {{ game.currentRound }}</p>
      <h1 class="gold-title">Multiplicador x{{ currentRound?.multiplier }}</h1>
    </section>

    <section v-else-if="scene.active.type === 'FINAL_WINNER'" class="stage-center">
      <img class="brand-logo top-logo" :src="assets.brandLogo" alt="" />
      <p class="eyebrow final-label">Resultado final</p>
      <h1>{{ winner?.name ?? "Empate" }}</h1>
      <div class="score-row">
        <span>{{ game.teams[0].score }}</span>
        <span>{{ game.teams[1].score }}</span>
      </div>
    </section>

    <section v-else-if="scene.active.type === 'SCOREBOARD'" class="scoreboard-scene">
      <img class="brand-logo top-logo" :src="assets.brandLogo" alt="" />
      <p class="eyebrow">Marcador</p>
      <div class="scoreboard-showcase">
        <article v-for="team in game.teams" :key="team.id">
          <span>{{ team.name }}</span>
          <strong>{{ team.score }}</strong>
          <small>{{ errorLabel(team.errors) }}</small>
        </article>
      </div>
    </section>

    <section v-else-if="scene.active.type === 'ROUND_RESULT'" class="stage-center">
      <img class="brand-logo top-logo" :src="assets.brandLogo" alt="" />
      <p class="eyebrow">Ronda {{ game.currentRound }}</p>
      <h1>{{ roundWinner?.name ?? "Ronda cerrada" }}</h1>
      <div class="team-strip">
        <span>+{{ currentRound?.awardedPoints ?? game.roundBank }} pts</span>
      </div>
    </section>

    <section v-else-if="isBoardScene" class="board-scene">
      <div class="round-badge">
        <span>Ronda {{ game.currentRound }}</span>
        <strong>x{{ currentRound?.multiplier }}</strong>
      </div>
      <div class="bank-badge">
        <span>Bolsa</span>
        <strong>{{ game.roundBank }}</strong>
      </div>
      <div class="team-scoreboard">
        <article v-for="team in game.teams" :key="team.id" class="team-score">
          <h2>{{ team.name }}</h2>
          <strong>{{ team.score }}</strong>
          <div class="strikes" aria-hidden="true">
            <span v-for="strike in 3" :key="strike" :class="{ active: strike <= team.errors }">X</span>
          </div>
        </article>
      </div>
      <div class="question-panel">
        <p class="question-text" :class="questionSizeClass">{{ questionText }}</p>
        <div class="answers-grid">
          <div v-for="(answer, index) in currentQuestion?.answers" :key="answer.id" class="answer-tile" :class="{ revealed: answer.revealed }">
            <span>{{ answer.revealed ? answer.text : index + 1 }}</span>
            <strong v-if="answer.revealed">{{ answer.points }}</strong>
          </div>
        </div>
      </div>
      <img class="brand-logo board-logo" :src="assets.brandLogo" alt="" />
    </section>

    <div v-if="scene.overlay?.type === 'STRIKE' || scene.active.type === 'STRIKE'" class="overlay strike-overlay">
      <img :src="assets.strikeMark" alt="" />
    </div>
    <div v-if="scene.overlay?.type === 'STEAL' || scene.active.type === 'STEAL'" class="overlay steal-overlay">
      <img :src="assets.stealMark" alt="" />
    </div>
    <div v-if="scene.overlay?.type === 'SCOREBOARD'" class="scoreboard-overlay" :style="{ backgroundImage: `url('${assets.scoreboardBg}')` }">
      <img class="drinkiq-brand" :src="assets.drinkiqLogo" alt="" aria-hidden="true" />
      <img class="buchanan-brand" :src="assets.buchananLogo" alt="" aria-hidden="true" />
      <section class="scoreboard-scene">
        <img class="brand-logo top-logo" :src="assets.brandLogo" alt="" />
        <p class="eyebrow">Marcador</p>
        <div class="scoreboard-showcase">
          <article v-for="team in game.teams" :key="team.id">
            <span>{{ team.name }}</span>
            <strong>{{ team.score }}</strong>
            <small>{{ errorLabel(team.errors) }}</small>
          </article>
        </div>
      </section>
    </div>
    <div v-if="scene.active.type === 'ANSWER_REVEAL'" class="reveal-count">{{ revealedAnswers }}/{{ currentQuestion?.answers.length ?? 0 }}</div>
  </main>
</template>
