import type { GameMode, GamePhase, GameState, Question, Team } from "./game.types";
import type { QuestionImportResult } from "./import.types";
import type { Scene, SceneState, SceneType } from "./scene.types";

export interface GameCommands {
  "game:start": { mode: GameMode };
  "game:reset": undefined;
  "game:setMode": { mode: GameMode };
  "game:setTeams": { teams: [Pick<Team, "id" | "name">, Pick<Team, "id" | "name">] };
  "game:setQuestions": { questions: Question[] };
  "game:setQuestion": { questionId: string };
  "game:setPendingNextQuestion": { questionId: string };
  "game:revealAnswer": { answerIndex: number };
  "game:addError": { teamId: Team["id"] };
  "game:awardRound": { teamId: Team["id"] };
  "game:resetErrors": undefined;
  "game:nextRound": undefined;
  "game:setPhase": { phase: GamePhase };
  "game:end": undefined;
  "game:importQuestions": undefined;
}

export interface SceneCommands {
  "scene:set": { type: SceneType; payload?: Record<string, unknown> };
  "scene:next": undefined;
  "scene:previous": undefined;
  "scene:flashSteal": undefined;
  "scene:flashStrike": undefined;
  "scene:toggleScoreboard": undefined;
}

export type IpcCommandMap = GameCommands & SceneCommands;
export type IpcCommandName = keyof IpcCommandMap;

export interface IpcEventMap {
  "game:stateUpdated": GameState;
  "scene:stateUpdated": SceneState;
}

export interface AppSnapshot {
  game: GameState;
  scene: SceneState;
}

export interface OllinPulseApi {
  invoke<TName extends IpcCommandName>(
    channel: TName,
    payload: IpcCommandMap[TName]
  ): Promise<AppSnapshot | QuestionImportResult | void>;
  onGameStateUpdated(callback: (state: GameState) => void): () => void;
  onSceneStateUpdated(callback: (state: SceneState) => void): () => void;
  getSnapshot(): Promise<AppSnapshot>;
  getWindowRole(): "operator" | "public";
}

export type IpcScenePayload = Pick<Scene, "type" | "payload">;
