import type { GameState, Question } from "../shared/game.types";
import type { Scene, SceneState, SceneType } from "../shared/scene.types";

const transition = { name: "fade", durationMs: 360 } as const;

function createScene(type: SceneType, payload: Record<string, unknown> = {}): Scene {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    payload,
    transition
  };
}

export class SceneManager {
  private state: SceneState = {
    active: createScene("IDLE"),
    queue: [],
    timeline: [],
    updatedAt: new Date().toISOString()
  };

  getState(): SceneState {
    return structuredClone(this.state);
  }

  reset(): SceneState {
    this.state = {
      active: createScene("IDLE"),
      previous: undefined,
      next: undefined,
      overlay: undefined,
      queue: [],
      timeline: [],
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  setScene(type: SceneType, payload: Record<string, unknown> = {}): SceneState {
    const nextScene = createScene(type, payload);
    this.state = {
      ...this.state,
      previous: this.state.active,
      active: nextScene,
      next: this.state.queue[0],
      timeline: [...this.state.timeline, nextScene].slice(-20),
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  setQueue(queue: Scene[]): SceneState {
    this.state = {
      ...this.state,
      queue,
      next: queue[0],
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  setOverlay(type: "STRIKE" | "STEAL" | "SCOREBOARD", payload: Record<string, unknown> = {}, durationMs = 1000): SceneState {
    this.state = {
      ...this.state,
      overlay: {
        id: `${type}-overlay-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type,
        payload,
        durationMs
      },
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  clearOverlay(): SceneState {
    this.state = {
      ...this.state,
      overlay: undefined,
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  next(): SceneState {
    if (this.state.queue.length === 0) {
      return this.getState();
    }

    const [active, ...queue] = this.state.queue;
    this.state = {
      ...this.state,
      previous: this.state.active,
      active,
      queue,
      next: queue[0],
      timeline: [...this.state.timeline, active].slice(-20),
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  advance(game: GameState): SceneState {
    if (this.state.queue.length > 0) {
      return this.next();
    }

    const question = game.questions.find((item) => item.id === game.currentQuestionId);
    const teams = game.teams.map((team) => team.name);

    switch (this.state.active.type) {
      case "IDLE":
        return this.setScene("INTRO", { teams: game.teams });
      case "INTRO":
        return this.setScene("ROUND_INTRO", {
          round: game.currentRound,
          multiplier: game.rounds[game.currentRound - 1]?.multiplier
        });
      case "ROUND_INTRO":
        return this.setScene("QUESTION_BOARD", { question, teams });
      case "ANSWER_REVEAL":
      case "STRIKE":
      case "STEAL":
        return this.setScene("QUESTION_BOARD", { question, teams });
      case "QUESTION_BOARD":
        return this.getState();
      case "SCOREBOARD":
      case "ROUND_RESULT":
        return this.getState();
      case "FINAL_WINNER":
      default:
        return this.getState();
    }
  }

  previous(): SceneState {
    if (!this.state.previous) {
      return this.getState();
    }

    const active = this.state.previous;
    this.state = {
      ...this.state,
      previous: undefined,
      active,
      next: this.state.active,
      updatedAt: new Date().toISOString()
    };
    return this.getState();
  }

  buildQuestionQueue(game: GameState, question?: Question): Scene[] {
    const teamNames = game.teams.map((team) => team.name);
    return [
      createScene("ROUND_INTRO", { round: game.currentRound, multiplier: game.rounds[game.currentRound - 1]?.multiplier }),
      createScene("QUESTION_BOARD", { question, teams: teamNames })
    ];
  }
}
