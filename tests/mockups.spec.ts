import { test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const mockupDir = join(process.cwd(), "docs", "mockups");

type SceneType =
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

const now = "2026-06-04T12:00:00.000Z";

const baseQuestions = [
  {
    id: "mock-1",
    round: 1,
    text: "¿Qué haces al llegar a casa?",
    totalPoints: 100,
    answers: [
      ["Dormir", 32],
      ["Comer", 24],
      ["Ver TV", 18],
      ["Bañarme", 11],
      ["Descansar", 9],
      ["Usar celular", 6]
    ].map(([text, points], index) => ({
      id: `mock-1-a-${index + 1}`,
      text,
      points,
      revealed: false
    }))
  },
  {
    id: "mock-2",
    round: 2,
    text: "Menciona algo que no puede faltar en un evento.",
    totalPoints: 200,
    answers: [
      ["Música", 56],
      ["Comida", 44],
      ["Bebidas", 35],
      ["Invitados", 25],
      ["Luces", 18],
      ["Fotos", 12],
      ["Premios", 7],
      ["Pantallas", 3]
    ].map(([text, points], index) => ({
      id: `mock-2-a-${index + 1}`,
      text,
      points,
      revealed: false
    }))
  },
  {
    id: "mock-3",
    round: 3,
    text: "Menciona una forma de celebrar una victoria.",
    totalPoints: 300,
    answers: [
      ["Gritar", 84],
      ["Aplaudir", 63],
      ["Bailar", 51],
      ["Brindar", 42],
      ["Abrazar", 36],
      ["Tomar fotos", 24]
    ].map(([text, points], index) => ({
      id: `mock-3-a-${index + 1}`,
      text,
      points,
      revealed: false
    }))
  }
];

function questionsFor(type: SceneType) {
  const revealCount = type === "QUESTION_BOARD" || type === "ROUND_INTRO" ? 0 : type === "ANSWER_REVEAL" ? 4 : 3;

  return baseQuestions.map((question) => ({
    ...question,
    answers: question.answers.map((answer, index) => ({
      ...answer,
      revealed: question.id === "mock-1" && index < revealCount
    }))
  }));
}

function scene(type: SceneType, suffix = type.toLowerCase()) {
  return {
    id: `${suffix}-${now}`,
    type,
    payload: {},
    transition: { name: "fade", durationMs: 360 }
  };
}

function snapshotFor(type: SceneType, role: "operator" | "public") {
  const active = scene(type);
  const isFinal = type === "FINAL_WINNER";
  const isRoundResult = type === "ROUND_RESULT";

  return {
    game: {
      mode: "3_RONDAS",
      phase: isFinal ? "final_result" : isRoundResult ? "round_result" : "playing",
      teams: [
        { id: "A", name: "Amanecer", score: 190, errors: type === "STRIKE" ? 2 : 1 },
        { id: "B", name: "Cenit", score: 150, errors: 1 }
      ],
      rounds: [
        { number: 1, multiplier: 1, questionId: "mock-1", completed: isRoundResult || isFinal, winningTeamId: "A", awardedPoints: 96 },
        { number: 2, multiplier: 2, questionId: "mock-2", completed: isFinal, winningTeamId: "B", awardedPoints: 150 },
        { number: 3, multiplier: 3, questionId: "mock-3", completed: isFinal, winningTeamId: "A", awardedPoints: 220 }
      ],
      questions: questionsFor(type),
      currentRound: type === "ROUND_INTRO" ? 2 : 1,
      currentQuestionId: type === "ROUND_INTRO" ? "mock-2" : "mock-1",
      pendingNextQuestionId: "mock-2",
      roundBank: type === "ROUND_INTRO" ? 0 : 74,
      winnerTeamId: isFinal ? "A" : undefined,
      startedAt: now,
      updatedAt: now
    },
    scene: {
      active,
      previous: scene("INTRO", "previous"),
      next: scene("SCOREBOARD", "next"),
      overlay:
        type === "STRIKE" || type === "STEAL"
          ? { id: `overlay-${type}`, type, payload: {}, durationMs: 900 }
          : undefined,
      queue: [scene("QUESTION_BOARD", "queue-question"), scene("SCOREBOARD", "queue-scoreboard")],
      timeline: [scene("IDLE", "timeline-idle"), scene("INTRO", "timeline-intro"), active],
      updatedAt: now
    },
    role
  };
}

async function installOllinPulseMock(page: Page, type: SceneType, role: "operator" | "public") {
  const initialSnapshot = snapshotFor(type, role);

  await page.addInitScript((snapshot) => {
    let current = snapshot;
    const gameListeners = new Set<(state: unknown) => void>();
    const sceneListeners = new Set<(state: unknown) => void>();

    function emit() {
      gameListeners.forEach((listener) => listener(current.game));
      sceneListeners.forEach((listener) => listener(current.scene));
    }

    window.ollinPulse = {
      getWindowRole: () => current.role,
      getSnapshot: async () => current,
      onGameStateUpdated: (callback: (state: unknown) => void) => {
        gameListeners.add(callback);
        return () => gameListeners.delete(callback);
      },
      onSceneStateUpdated: (callback: (state: unknown) => void) => {
        sceneListeners.add(callback);
        return () => sceneListeners.delete(callback);
      },
      invoke: async (channel: string, payload: { type?: SceneType } | undefined) => {
        if (channel === "scene:set" && payload?.type) {
          current = { ...current, scene: { ...current.scene, active: { ...current.scene.active, type: payload.type } } };
        }
        emit();
        return current;
      }
    };
  }, initialSnapshot);
}

async function capture(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: join(mockupDir, `${name}.png`), fullPage: true });
}

test.beforeAll(() => {
  mkdirSync(mockupDir, { recursive: true });
});

test("operator view mockups", async ({ page }) => {
  await installOllinPulseMock(page, "QUESTION_BOARD", "operator");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/operator");
  await capture(page, "operator-desktop");

  await page.setViewportSize({ width: 390, height: 1200 });
  await capture(page, "operator-mobile");
});

const publicScenes: Array<[SceneType, string]> = [
  ["IDLE", "public-01-idle"],
  ["INTRO", "public-02-intro"],
  ["ROUND_INTRO", "public-03-round-intro"],
  ["QUESTION_BOARD", "public-04-question-board"],
  ["ANSWER_REVEAL", "public-05-answer-reveal"],
  ["STRIKE", "public-06-strike"],
  ["STEAL", "public-07-steal"],
  ["ROUND_RESULT", "public-08-round-result"],
  ["SCOREBOARD", "public-09-scoreboard"],
  ["FINAL_WINNER", "public-10-final-winner"]
];

for (const [type, name] of publicScenes) {
  test(`${name} mockup`, async ({ page }) => {
    await installOllinPulseMock(page, type, "public");
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/#/public");
    await capture(page, name);
  });
}
