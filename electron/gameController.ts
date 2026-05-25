import type { GameMode, GamePhase, GameState, Question, Team, ValidationResult } from "../shared/game.types";

const basePresets: Record<6 | 7 | 8, number[]> = {
  6: [35, 25, 15, 10, 8, 7],
  7: [32, 24, 16, 10, 8, 6, 4],
  8: [28, 22, 18, 12, 8, 6, 4, 2]
};

function createInitialState(): GameState {
  return {
    mode: "3_RONDAS",
    phase: "idle",
    teams: [
      { id: "A", name: "Equipo A", score: 0, errors: 0 },
      { id: "B", name: "Equipo B", score: 0, errors: 0 }
    ],
    rounds: createRounds("3_RONDAS"),
    questions: [],
    currentRound: 1,
    roundBank: 0,
    updatedAt: new Date().toISOString()
  };
}

export function getRoundMultiplier(params: { roundNumber: number; gameMode: GameMode }): number {
  if (params.gameMode === "MUERTE_SUBITA") return 1;
  if (params.gameMode === "3_RONDAS") return [1, 2, 3][params.roundNumber - 1] ?? 1;
  return [1, 1, 2, 2, 3][params.roundNumber - 1] ?? 1;
}

export function calculateAnswerPoints(params: {
  answerIndex: number;
  totalAnswers: number;
  roundNumber: number;
  gameMode: GameMode;
}): number {
  const total = Math.min(Math.max(params.totalAnswers, 6), 8) as 6 | 7 | 8;
  const base = basePresets[total][params.answerIndex] ?? 0;
  return base * getRoundMultiplier({ roundNumber: params.roundNumber, gameMode: params.gameMode });
}

export function applyPointPresetToQuestion(question: Question, gameMode: GameMode): Question {
  const answers = question.answers.slice(0, 8).map((answer, index, all) => ({
    ...answer,
    points: calculateAnswerPoints({
      answerIndex: index,
      totalAnswers: all.length,
      roundNumber: question.round,
      gameMode
    }),
    revealed: answer.revealed ?? false
  }));

  return {
    ...question,
    answers,
    totalPoints: answers.reduce((total, answer) => total + answer.points, 0)
  };
}

export function validateQuestionForGameMode(question: Question): ValidationResult {
  const errors: string[] = [];
  if (question.answers.length < 6) errors.push("La pregunta debe tener al menos 6 respuestas.");
  if (question.answers.length > 8) errors.push("La pregunta no puede tener más de 8 respuestas.");
  if (!question.text.trim()) errors.push("La pregunta no puede estar vacía.");
  return { valid: errors.length === 0, errors };
}

function createRounds(mode: GameMode) {
  const count = mode === "MUERTE_SUBITA" ? 1 : mode === "3_RONDAS" ? 3 : 5;
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    multiplier: getRoundMultiplier({ roundNumber: index + 1, gameMode: mode }),
    completed: false
  }));
}

export class GameController {
  private state = createInitialState();

  getState(): GameState {
    return structuredClone(this.state);
  }

  setMode(mode: GameMode): GameState {
    this.state = {
      ...this.state,
      mode,
      rounds: createRounds(mode),
      questions: this.state.questions.map((question) => applyPointPresetToQuestion(question, mode)),
      currentRound: 1,
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  setTeams(teams: [Pick<Team, "id" | "name">, Pick<Team, "id" | "name">]): GameState {
    this.state = {
      ...this.state,
      teams: this.state.teams.map((team) => ({
        ...team,
        name: teams.find((incoming) => incoming.id === team.id)?.name.trim() || team.name
      })) as [Team, Team],
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  setQuestions(questions: Question[]): GameState {
    this.state = {
      ...this.state,
      questions: questions.map((question) => applyPointPresetToQuestion(question, this.state.mode)),
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  start(mode = this.state.mode): GameState {
    const prepared = this.setMode(mode);
    const invalid = prepared.questions.flatMap((question) => validateQuestionForGameMode(question).errors);
    if (invalid.length > 0 || prepared.questions.length === 0) {
      throw new Error(invalid[0] ?? "Carga al menos una pregunta válida antes de iniciar.");
    }
    this.state = { ...this.state, phase: "intro", startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return this.getState();
  }

  reset(): GameState {
    this.state = createInitialState();
    return this.getState();
  }

  setQuestion(questionId: string): GameState {
    const question = this.state.questions.find((item) => item.id === questionId);
    if (!question) throw new Error("Pregunta no encontrada.");
    this.state = {
      ...this.state,
      phase: "playing",
      currentRound: question.round,
      currentQuestionId: questionId,
      pendingNextQuestionId: undefined,
      roundBank: question.answers.filter((answer) => answer.revealed).reduce((total, answer) => total + answer.points, 0),
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  setPendingNextQuestion(questionId: string): GameState {
    const question = this.state.questions.find((item) => item.id === questionId);
    if (!question) throw new Error("Pregunta no encontrada.");

    const expectedRound = this.state.currentRound + 1;
    if (question.round !== expectedRound) {
      throw new Error(`La pregunta seleccionada debe ser de la ronda ${expectedRound}.`);
    }

    this.state = {
      ...this.state,
      pendingNextQuestionId: questionId,
      updatedAt: new Date().toISOString()
    };

    return this.getState();
  }

  revealAnswer(answerIndex: number): GameState {
    this.state = {
      ...this.state,
      questions: this.state.questions.map((question) => {
        if (question.id !== this.state.currentQuestionId) return question;
        const answers = question.answers.map((answer, index) => (index === answerIndex ? { ...answer, revealed: true } : answer));
        return { ...question, answers };
      }),
      updatedAt: new Date().toISOString()
    };

    const current = this.state.questions.find((question) => question.id === this.state.currentQuestionId);
    this.state = {
      ...this.state,
      roundBank: current?.answers.filter((answer) => answer.revealed).reduce((total, answer) => total + answer.points, 0) ?? 0
    };
    return this.getState();
  }

  addError(teamId: Team["id"]): GameState {
    this.state = {
      ...this.state,
      teams: this.state.teams.map((team) => (team.id === teamId ? { ...team, errors: Math.min(team.errors + 1, 3) } : team)) as [
        Team,
        Team
      ],
      phase: "playing",
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  awardRound(teamId: Team["id"]): GameState {
    if (!this.state.currentQuestionId) {
      throw new Error("Selecciona una pregunta antes de adjudicar puntos.");
    }

    const roundIndex = this.state.rounds.findIndex((round) => round.number === this.state.currentRound);
    if (roundIndex < 0) {
      throw new Error("Ronda no encontrada.");
    }

    const currentRound = this.state.rounds[roundIndex];
    const awardedPoints = this.state.roundBank;
    const previousWinnerId = currentRound.winningTeamId;
    const previousAwardedPoints = currentRound.awardedPoints ?? 0;

    this.state = {
      ...this.state,
      phase: "round_result",
      teams: this.state.teams.map((team) => {
        let score = team.score;
        if (previousWinnerId === team.id) score -= previousAwardedPoints;
        if (team.id === teamId) score += awardedPoints;
        return { ...team, score: Math.max(0, score) };
      }) as [Team, Team],
      rounds: this.state.rounds.map((round, index) =>
        index === roundIndex
          ? {
              ...round,
              questionId: this.state.currentQuestionId,
              completed: true,
              winningTeamId: teamId,
              awardedPoints
            }
          : round
      ),
      winnerTeamId: this.state.mode === "MUERTE_SUBITA" ? teamId : this.state.winnerTeamId,
      updatedAt: new Date().toISOString()
    };

    return this.getState();
  }

  resetErrors(): GameState {
    this.state = {
      ...this.state,
      teams: this.state.teams.map((team) => ({ ...team, errors: 0 })) as [Team, Team],
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  setPhase(phase: GamePhase): GameState {
    this.state = { ...this.state, phase, updatedAt: new Date().toISOString() };
    return this.getState();
  }

  nextRound(): GameState {
    const nextRound = Math.min(this.state.currentRound + 1, this.state.rounds.length);
    this.state = {
      ...this.state,
      currentRound: nextRound,
      phase: "round_setup",
      teams: this.state.teams.map((team) => ({ ...team, errors: 0 })) as [Team, Team],
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  hasNextRound(): boolean {
    return this.state.currentRound < this.state.rounds.length;
  }

  startNextRoundWithQuestion(questionId?: string): GameState {
    if (!this.hasNextRound()) {
      return this.end();
    }

    const nextRound = this.state.currentRound + 1;
    const pendingQuestion = questionId ? this.state.questions.find((item) => item.id === questionId) : undefined;
    const question =
      pendingQuestion && pendingQuestion.round === nextRound ? pendingQuestion : this.state.questions.find((item) => item.round === nextRound);

    if (!question) {
      throw new Error(`No hay pregunta cargada para la ronda ${nextRound}.`);
    }

    this.state = {
      ...this.state,
      phase: "playing",
      currentRound: nextRound,
      currentQuestionId: question.id,
      pendingNextQuestionId: undefined,
      roundBank: question.answers.filter((answer) => answer.revealed).reduce((total, answer) => total + answer.points, 0),
      teams: this.state.teams.map((team) => ({ ...team, errors: 0 })) as [Team, Team],
      updatedAt: new Date().toISOString()
    };

    return this.getState();
  }

  end(): GameState {
    const [a, b] = this.state.teams;
    this.state = {
      ...this.state,
      phase: "final_result",
      winnerTeamId: a.score === b.score ? undefined : a.score > b.score ? "A" : "B",
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }
}
