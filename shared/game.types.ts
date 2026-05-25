export type GameMode = "3_RONDAS" | "5_RONDAS" | "MUERTE_SUBITA";

export type GamePhase =
  | "idle"
  | "intro"
  | "round_setup"
  | "playing"
  | "steal"
  | "round_result"
  | "final_result";

export interface Team {
  id: "A" | "B";
  name: string;
  score: number;
  errors: number;
}

export interface Answer {
  id: string;
  text: string;
  points: number;
  revealed: boolean;
}

export interface Question {
  id: string;
  round: number;
  text: string;
  answers: Answer[];
  totalPoints: number;
}

export interface Round {
  number: number;
  multiplier: number;
  questionId?: string;
  completed: boolean;
  winningTeamId?: Team["id"];
  awardedPoints?: number;
}

export interface GameState {
  mode: GameMode;
  phase: GamePhase;
  teams: [Team, Team];
  rounds: Round[];
  questions: Question[];
  currentRound: number;
  currentQuestionId?: string;
  pendingNextQuestionId?: string;
  roundBank: number;
  winnerTeamId?: Team["id"];
  startedAt?: string;
  updatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  "3_RONDAS": "3 rondas",
  "5_RONDAS": "5 rondas",
  MUERTE_SUBITA: "Muerte súbita"
};
