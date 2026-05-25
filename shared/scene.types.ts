export type SceneType =
  | "IDLE"
  | "INTRO"
  | "ROUND_INTRO"
  | "QUESTION_BOARD"
  | "ANSWER_REVEAL"
  | "STRIKE"
  | "STEAL"
  | "ROUND_RESULT"
  | "SCOREBOARD"
  | "FINAL_WINNER";

export interface SceneTransition {
  name: "cut" | "fade" | "slide" | "flash";
  durationMs: number;
}

export interface Scene<TPayload = Record<string, unknown>> {
  id: string;
  type: SceneType;
  payload: TPayload;
  transition: SceneTransition;
  duration?: number;
}

export interface SceneOverlay {
  id: string;
  type: "STRIKE" | "STEAL";
  payload: Record<string, unknown>;
  durationMs: number;
}

export interface SceneState {
  active: Scene;
  previous?: Scene;
  next?: Scene;
  overlay?: SceneOverlay;
  queue: Scene[];
  timeline: Scene[];
  updatedAt: string;
}
