<script setup lang="ts">
import { computed } from "vue";
import type { GameState } from "@shared/game.types";
import type { SceneState } from "@shared/scene.types";

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
</script>

<template>
  <main class="public-stage">
    <section v-if="scene.active.type === 'IDLE'" class="stage-center">
      <p class="eyebrow">OLLIN Pulse</p>
      <h1>Listos para jugar</h1>
      <div class="team-strip">
        <strong>{{ game.teams[0].name }}</strong>
        <span>VS</span>
        <strong>{{ game.teams[1].name }}</strong>
      </div>
    </section>

    <section v-else-if="scene.active.type === 'INTRO'" class="stage-center">
      <p class="eyebrow">Presenta</p>
      <h1>OLLIN Pulse</h1>
      <div class="versus">
        <span>{{ game.teams[0].name }}</span>
        <b>VS</b>
        <span>{{ game.teams[1].name }}</span>
      </div>
    </section>

    <section v-else-if="scene.active.type === 'ROUND_INTRO'" class="stage-center">
      <p class="eyebrow">Ronda {{ game.currentRound }}</p>
      <h1>Multiplicador x{{ game.rounds[game.currentRound - 1]?.multiplier }}</h1>
    </section>

    <section v-else-if="scene.active.type === 'FINAL_WINNER'" class="stage-center">
      <p class="eyebrow">Resultado final</p>
      <h1>{{ winner?.name ?? "Empate" }}</h1>
      <div class="score-row">
        <span>{{ game.teams[0].score }}</span>
        <span>{{ game.teams[1].score }}</span>
      </div>
    </section>

    <section v-else-if="scene.active.type === 'SCOREBOARD'" class="scoreboard-scene">
      <p class="eyebrow">Marcador</p>
      <h1>OLLIN Pulse</h1>
      <div class="scoreboard-showcase">
        <article v-for="team in game.teams" :key="team.id">
          <span>{{ team.name }}</span>
          <strong>{{ team.score }}</strong>
          <small>{{ team.errors }} errores</small>
        </article>
      </div>
      <div class="scoreboard-bank">
        <span>Bolsa actual</span>
        <strong>{{ game.roundBank }}</strong>
      </div>
    </section>

    <section v-else-if="scene.active.type === 'ROUND_RESULT'" class="stage-center">
      <p class="eyebrow">Ronda {{ game.currentRound }}</p>
      <h1>{{ roundWinner?.name ?? "Ronda cerrada" }}</h1>
      <div class="team-strip">
        <span>+{{ game.rounds[game.currentRound - 1]?.awardedPoints ?? game.roundBank }} pts</span>
      </div>
    </section>

    <section v-else class="board-scene">
      <header class="broadcast-header">
        <div>
          <span>Ronda {{ game.currentRound }}</span>
          <strong>x{{ game.rounds[game.currentRound - 1]?.multiplier }}</strong>
        </div>
        <h1>OLLIN Pulse</h1>
        <div>
          <span>Bolsa</span>
          <strong>{{ game.roundBank }}</strong>
        </div>
      </header>

      <div class="scoreboard">
        <article v-for="team in game.teams" :key="team.id" class="team-score">
          <h2>{{ team.name }}</h2>
          <strong>{{ team.score }}</strong>
          <div class="strikes">
            <span v-for="strike in 3" :key="strike" :class="{ active: strike <= team.errors }">X</span>
          </div>
        </article>
      </div>

      <div class="question-panel">
        <p>{{ currentQuestion?.text ?? "Selecciona una pregunta" }}</p>
        <div class="answers-grid">
          <div v-for="(answer, index) in currentQuestion?.answers" :key="answer.id" class="answer-tile" :class="{ revealed: answer.revealed }">
            <span>{{ answer.revealed ? answer.text : index + 1 }}</span>
            <strong v-if="answer.revealed">{{ answer.points }}</strong>
          </div>
        </div>
      </div>

    </section>

    <div v-if="scene.overlay?.type === 'STRIKE'" class="overlay strike-overlay">X</div>
    <div v-if="scene.overlay?.type === 'STEAL'" class="overlay steal-overlay">ROBO DE PUNTOS</div>
  </main>
</template>
