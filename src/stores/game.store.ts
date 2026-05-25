import { defineStore } from "pinia";
import type { GameMode, GameState, Question, Team } from "@shared/game.types";
import type { AppSnapshot } from "@shared/ipc.types";

function isAppSnapshot(value: unknown): value is AppSnapshot {
  return Boolean(value && typeof value === "object" && "game" in value && "scene" in value);
}

export const useGameStore = defineStore("game", {
  state: (): GameState => ({
    mode: "3_RONDAS",
    phase: "idle",
    teams: [
      { id: "A", name: "Equipo A", score: 0, errors: 0 },
      { id: "B", name: "Equipo B", score: 0, errors: 0 }
    ],
    rounds: [
      { number: 1, multiplier: 1, completed: false },
      { number: 2, multiplier: 2, completed: false },
      { number: 3, multiplier: 3, completed: false }
    ],
    questions: [],
    currentRound: 1,
    pendingNextQuestionId: undefined,
    roundBank: 0,
    updatedAt: new Date().toISOString()
  }),
  getters: {
    currentQuestion: (state) => state.questions.find((question) => question.id === state.currentQuestionId),
    questionsForCurrentRound: (state) => state.questions.filter((question) => question.round === state.currentRound)
  },
  actions: {
    hydrate(state: GameState) {
      Object.assign(this, state);
    },
    async sync() {
      const snapshot = await window.ollinPulse.getSnapshot();
      this.hydrate(snapshot.game);
    },
    async setMode(mode: GameMode) {
      await window.ollinPulse.invoke("game:setMode", { mode });
    },
    async setTeams(teams: [Pick<Team, "id" | "name">, Pick<Team, "id" | "name">]) {
      await window.ollinPulse.invoke("game:setTeams", { teams });
    },
    async start() {
      await window.ollinPulse.invoke("game:start", { mode: this.mode });
    },
    async reset() {
      await window.ollinPulse.invoke("game:reset", undefined);
    },
    async setQuestion(questionId: string) {
      await window.ollinPulse.invoke("game:setQuestion", { questionId });
    },
    async setPendingNextQuestion(questionId: string) {
      const snapshot = await window.ollinPulse.invoke("game:setPendingNextQuestion", { questionId });
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.game);
    },
    async revealAnswer(answerIndex: number) {
      await window.ollinPulse.invoke("game:revealAnswer", { answerIndex });
    },
    async addError(teamId: Team["id"]) {
      await window.ollinPulse.invoke("game:addError", { teamId });
    },
    async awardRound(teamId: Team["id"]) {
      const snapshot = await window.ollinPulse.invoke("game:awardRound", { teamId });
      if (isAppSnapshot(snapshot)) this.hydrate(snapshot.game);
    },
    async resetErrors() {
      await window.ollinPulse.invoke("game:resetErrors", undefined);
    },
    async end() {
      await window.ollinPulse.invoke("game:end", undefined);
    },
    async importQuestions() {
      return window.ollinPulse.invoke("game:importQuestions", undefined);
    },
    async loadMockQuestions(questions: Question[]) {
      await window.ollinPulse.invoke("game:setQuestions", { questions });
    }
  }
});
