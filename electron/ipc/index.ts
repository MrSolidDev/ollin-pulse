import { dialog, ipcMain } from "electron";
import { readFile } from "node:fs/promises";
import * as XLSX from "xlsx";
import { GameController } from "../gameController";
import { SceneManager } from "../sceneManager";
import type { IpcCommandMap, IpcCommandName, AppSnapshot } from "../../shared/ipc.types";
import type { QuestionImportResult } from "../../shared/import.types";
import type { WindowManager } from "../windowManager";
import { parseQuestionsFromWorkbook } from "../services/questionImporter";

export function registerIpc(params: { game: GameController; scenes: SceneManager; windows: WindowManager }): void {
  const { game, scenes, windows } = params;
  let transientSceneTimer: NodeJS.Timeout | undefined;

  const snapshot = (): AppSnapshot => ({ game: game.getState(), scene: scenes.getState() });
  const broadcast = () => {
    windows.broadcast("game:stateUpdated", game.getState());
    windows.broadcast("scene:stateUpdated", scenes.getState());
  };
  const clearTransientScene = () => {
    if (transientSceneTimer) {
      clearTimeout(transientSceneTimer);
      transientSceneTimer = undefined;
    }
  };
  const returnToQuestionBoard = (delayMs: number) => {
    clearTransientScene();
    transientSceneTimer = setTimeout(() => {
      const state = game.getState();
      const question = state.questions.find((item) => item.id === state.currentQuestionId);
      scenes.setScene("QUESTION_BOARD", { question, teams: state.teams.map((team) => team.name) });
      broadcast();
      transientSceneTimer = undefined;
    }, delayMs);
  };
  const flashOverlay = (type: "STRIKE" | "STEAL", payload: Record<string, unknown>, delayMs: number) => {
    clearTransientScene();
    scenes.setOverlay(type, payload, delayMs);
    transientSceneTimer = setTimeout(() => {
      scenes.clearOverlay();
      broadcast();
      transientSceneTimer = undefined;
    }, delayMs);
  };

  ipcMain.handle("app:getSnapshot", () => snapshot());

  ipcMain.handle("ollin:command", async (_event, channel: IpcCommandName, payload: IpcCommandMap[IpcCommandName]) => {
    switch (channel) {
      case "game:start": {
        clearTransientScene();
        const typed = payload as IpcCommandMap["game:start"];
        game.start(typed.mode);
        scenes.setScene("INTRO", { teams: game.getState().teams });
        break;
      }
      case "game:reset":
        clearTransientScene();
        game.reset();
        scenes.reset();
        break;
      case "game:setMode":
        game.setMode((payload as IpcCommandMap["game:setMode"]).mode);
        break;
      case "game:setTeams":
        game.setTeams((payload as IpcCommandMap["game:setTeams"]).teams);
        break;
      case "game:setQuestions":
        game.setQuestions((payload as IpcCommandMap["game:setQuestions"]).questions);
        break;
      case "game:setQuestion": {
        clearTransientScene();
        const state = game.setQuestion((payload as IpcCommandMap["game:setQuestion"]).questionId);
        const question = state.questions.find((item) => item.id === state.currentQuestionId);
        scenes.setQueue(scenes.buildQuestionQueue(state, question));
        scenes.next();
        break;
      }
      case "game:setPendingNextQuestion":
        game.setPendingNextQuestion((payload as IpcCommandMap["game:setPendingNextQuestion"]).questionId);
        break;
      case "game:revealAnswer": {
        clearTransientScene();
        const typed = payload as IpcCommandMap["game:revealAnswer"];
        const state = game.revealAnswer(typed.answerIndex);
        const question = state.questions.find((item) => item.id === state.currentQuestionId);
        scenes.setScene("ANSWER_REVEAL", { question, answerIndex: typed.answerIndex });
        break;
      }
      case "game:addError": {
        const typed = payload as IpcCommandMap["game:addError"];
        const state = game.addError(typed.teamId);
        flashOverlay("STRIKE", { teamId: typed.teamId, teams: state.teams }, 900);
        break;
      }
      case "game:awardRound": {
        clearTransientScene();
        const typed = payload as IpcCommandMap["game:awardRound"];
        const state = game.awardRound(typed.teamId);
        scenes.setScene("ROUND_RESULT", {
          teams: state.teams,
          winningTeamId: typed.teamId,
          roundBank: state.roundBank,
          round: state.currentRound
        });
        break;
      }
      case "game:resetErrors":
        game.resetErrors();
        break;
      case "game:nextRound":
        clearTransientScene();
        game.nextRound();
        scenes.setScene("ROUND_INTRO", { round: game.getState().currentRound });
        break;
      case "game:setPhase":
        game.setPhase((payload as IpcCommandMap["game:setPhase"]).phase);
        break;
      case "game:end":
        clearTransientScene();
        game.end();
        scenes.setScene("FINAL_WINNER", { teams: game.getState().teams, winnerTeamId: game.getState().winnerTeamId });
        break;
      case "scene:set": {
        clearTransientScene();
        const typed = payload as IpcCommandMap["scene:set"];
        scenes.setScene(typed.type, typed.payload ?? {});
        break;
      }
      case "scene:flashSteal":
        flashOverlay("STEAL", { teams: game.getState().teams }, 1400);
        break;
      case "scene:flashStrike":
        flashOverlay("STRIKE", { teams: game.getState().teams, visualOnly: true }, 900);
        break;
      case "scene:toggleScoreboard": {
        clearTransientScene();
        if (scenes.getState().overlay?.type === "SCOREBOARD") {
          scenes.clearOverlay();
        } else {
          const state = game.getState();
          scenes.setOverlay("SCOREBOARD", { teams: state.teams, roundBank: state.roundBank }, 0);
        }
        break;
      }
      case "scene:next":
        clearTransientScene();
        if (scenes.getState().active.type === "FINAL_WINNER") {
          break;
        }
        if (scenes.getState().active.type === "ROUND_RESULT") {
          if (game.hasNextRound()) {
            const currentState = game.getState();
            const state = game.startNextRoundWithQuestion(currentState.pendingNextQuestionId);
            const question = state.questions.find((item) => item.id === state.currentQuestionId);
            scenes.setQueue(scenes.buildQuestionQueue(state, question).slice(1));
            scenes.setScene("ROUND_INTRO", {
              round: state.currentRound,
              multiplier: state.rounds[state.currentRound - 1]?.multiplier,
              question
            });
          } else {
            const state = game.end();
            scenes.setScene("FINAL_WINNER", { teams: state.teams, winnerTeamId: state.winnerTeamId });
          }
        } else {
          scenes.advance(game.getState());
        }
        break;
      case "scene:previous":
        clearTransientScene();
        if (scenes.getState().active.type === "FINAL_WINNER") {
          break;
        }
        scenes.previous();
        break;
      case "game:importQuestions": {
        const result = await importQuestionsFromFile(game.getState().mode);
        if (result.questions.length > 0) game.setQuestions(result.questions);
        broadcast();
        return result;
      }
      default:
        throw new Error(`Comando IPC no soportado: ${String(channel)}`);
    }

    broadcast();
    return snapshot();
  });
}

async function importQuestionsFromFile(gameMode: import("../../shared/game.types").GameMode): Promise<QuestionImportResult> {
  const selected = await dialog.showOpenDialog({
    title: "Importar preguntas",
    properties: ["openFile"],
    filters: [{ name: "Preguntas", extensions: ["csv", "xlsx", "xls"] }]
  });

  if (selected.canceled || selected.filePaths.length === 0) {
    return { questions: [], errors: [] };
  }

  const buffer = await readFile(selected.filePaths[0]);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return parseQuestionsFromWorkbook(workbook, gameMode);
}
