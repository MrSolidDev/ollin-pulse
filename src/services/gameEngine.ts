import type { GameMode, Question, ValidationResult } from "@shared/game.types";

type AnswerCount = 2 | 3 | 4 | 5 | 6 | 7 | 8;

const presets: Record<AnswerCount, number[]> = {
  2: [60, 40],
  3: [50, 30, 20],
  4: [40, 30, 20, 10],
  5: [35, 25, 20, 12, 8],
  6: [35, 25, 15, 10, 8, 7],
  7: [32, 24, 16, 10, 8, 6, 4],
  8: [28, 22, 18, 12, 8, 6, 4, 2]
};

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
  const total = Math.min(Math.max(params.totalAnswers, 2), 8) as AnswerCount;
  return presets[total][params.answerIndex] * getRoundMultiplier({ roundNumber: params.roundNumber, gameMode: params.gameMode });
}

export function applyPointPresetToQuestion(question: Question, gameMode: GameMode): Question {
  const answers = question.answers.slice(0, 8).map((answer, index, all) => ({
    ...answer,
    points: calculateAnswerPoints({ answerIndex: index, totalAnswers: all.length, roundNumber: question.round, gameMode })
  }));
  return { ...question, answers, totalPoints: answers.reduce((total, answer) => total + answer.points, 0) };
}

export function validateQuestionForGameMode(question: Question): ValidationResult {
  const errors = [];
  if (question.answers.length < 2) errors.push("Debe tener al menos 2 respuestas.");
  if (question.answers.length > 8) errors.push("Debe tener máximo 8 respuestas.");
  return { valid: errors.length === 0, errors };
}
