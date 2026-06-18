import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const mockupDir = join(process.cwd(), "docs", "mockups");
const questionBankPath = join(process.cwd(), "docs", "banco_preguntas_v1_formato_ejemplo.csv");

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
      next: scene("QUESTION_BOARD", "next"),
      overlay:
        type === "STRIKE" || type === "STEAL"
          ? { id: `overlay-${type}`, type, payload: {}, durationMs: 900 }
          : undefined,
      queue: [scene("QUESTION_BOARD", "queue-question")],
      timeline: [scene("IDLE", "timeline-idle"), scene("INTRO", "timeline-intro"), active],
      updatedAt: now
    },
    role
  };
}

function longestQuestionFromBank() {
  const workbook = XLSX.readFile(questionBankPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: "" });
  const row = rows
    .map((item, rowIndex) => {
      const answers = Array.from({ length: 8 }, (_, index) => String(item[`answer_${index + 1}`] ?? "").trim()).filter(Boolean);
      const question = String(item.question ?? "").trim();
      return {
        id: `bank-long-${rowIndex + 1}`,
        round: Number(item.round) || 1,
        text: question,
        weight: question.length + answers.reduce((total, answer) => total + answer.length, 0),
        answers
      };
    })
    .filter((item) => item.text && item.answers.length >= 2)
    .sort((left, right) => right.weight - left.weight)[0];

  if (!row) throw new Error("No se encontro una pregunta valida en el banco.");

  const pointsByCount: Record<number, number[]> = {
    2: [60, 40],
    3: [50, 30, 20],
    4: [40, 30, 20, 10],
    5: [35, 25, 20, 12, 8],
    6: [35, 25, 15, 10, 8, 7],
    7: [32, 24, 16, 10, 8, 6, 4],
    8: [28, 22, 18, 12, 8, 6, 4, 2]
  };
  const points = pointsByCount[row.answers.length] ?? pointsByCount[8];

  return {
    id: row.id,
    round: row.round,
    text: row.text,
    totalPoints: points.slice(0, row.answers.length).reduce((total, point) => total + point, 0),
    answers: row.answers.map((answer, index) => ({
      id: `${row.id}-a-${index + 1}`,
      text: answer,
      points: points[index],
      revealed: true
    }))
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

async function installStaticSnapshot(page: Page, snapshot: ReturnType<typeof snapshotFor>) {
  await page.addInitScript((initialSnapshot) => {
    window.ollinPulse = {
      getWindowRole: () => initialSnapshot.role,
      getSnapshot: async () => initialSnapshot,
      onGameStateUpdated: () => () => undefined,
      onSceneStateUpdated: () => () => undefined,
      invoke: async () => initialSnapshot
    };
  }, snapshot);
}

async function expectBoardLayoutToFit(page: Page) {
  const logoBox = await page.locator(".board-logo").boundingBox();
  const questionBox = await page.locator(".question-text").boundingBox();
  expect(logoBox).not.toBeNull();
  expect(questionBox).not.toBeNull();

  const overflowTolerancePx = 4;
  const overflowing = await page.locator(".question-text, .answer-tile").evaluateAll((elements, tolerance) =>
    elements
      .map((element) => ({
        className: element.className,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        text: element.textContent?.trim() ?? ""
      }))
      .filter((item) => item.scrollWidth > item.clientWidth + tolerance || item.scrollHeight > item.clientHeight + tolerance),
    overflowTolerancePx
  );
  expect(overflowing).toEqual([]);

  for (const tile of await page.locator(".answer-tile").all()) {
    const tileBox = await tile.boundingBox();
    expect(tileBox).not.toBeNull();
    const overlapsLogo =
      logoBox!.x < tileBox!.x + tileBox!.width &&
      logoBox!.x + logoBox!.width > tileBox!.x &&
      logoBox!.y < tileBox!.y + tileBox!.height &&
      logoBox!.y + logoBox!.height > tileBox!.y;
    const overlapsQuestion =
      questionBox!.x < tileBox!.x + tileBox!.width &&
      questionBox!.x + questionBox!.width > tileBox!.x &&
      questionBox!.y < tileBox!.y + tileBox!.height &&
      questionBox!.y + questionBox!.height > tileBox!.y;
    expect(overlapsLogo).toBe(false);
    expect(overlapsQuestion).toBe(false);
  }
}

test.beforeAll(() => {
  mkdirSync(mockupDir, { recursive: true });
});

test("operator view mockups", async ({ page }) => {
  await installOllinPulseMock(page, "QUESTION_BOARD", "operator");

  await page.setViewportSize({ width: 1366, height: 768 });
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

test("answer reveal keeps the board logo clear of eight answers on compact displays", async ({ page }) => {
  const snapshot = snapshotFor("ANSWER_REVEAL", "public");
  snapshot.game.currentQuestionId = "mock-2";
  snapshot.game.questions = snapshot.game.questions.map((question) =>
    question.id === "mock-2"
      ? {
          ...question,
          answers: question.answers.map((answer) => ({ ...answer, revealed: true }))
        }
      : question
  );

  await installStaticSnapshot(page, snapshot);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/#/public");
  await expectBoardLayoutToFit(page);
});

test("answer reveal fits the longest real question bank entry on compact displays", async ({ page }) => {
  const question = longestQuestionFromBank();
  const snapshot = snapshotFor("ANSWER_REVEAL", "public");
  snapshot.game.currentRound = question.round;
  snapshot.game.currentQuestionId = question.id;
  snapshot.game.questions = [question];
  snapshot.game.roundBank = question.totalPoints;
  snapshot.game.rounds = snapshot.game.rounds.map((round) => (round.number === question.round ? { ...round, questionId: question.id } : round));

  await installStaticSnapshot(page, snapshot);

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1080, height: 1920 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/#/public");
    await expectBoardLayoutToFit(page);
    if (viewport.width === 1920) await capture(page, "public-13-answer-reveal-bank-longest-1920x1080");
    if (viewport.width === 1280) await capture(page, "public-11-answer-reveal-bank-longest");
    if (viewport.width === 1080) await capture(page, "public-12-answer-reveal-bank-longest-1080x1920");
  }
});

test("start game and round intro sounds do not overlap or replay on scene refresh", async ({ page }) => {
  const initialSnapshot = snapshotFor("INTRO", "public");

  await page.addInitScript((snapshot) => {
    let current = snapshot;
    const sceneListeners = new Set<(state: unknown) => void>();
    const startedSources: string[] = [];
    let nowMs = 1_000;
    const timers: Array<{ due: number; callback: () => void }> = [];
    Date.now = () => nowMs;
    window.setTimeout = ((callback: TimerHandler, delay?: number) => {
      timers.push({ due: nowMs + Number(delay ?? 0), callback: callback as () => void });
      return timers.length as unknown as number;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (!id) return;
      timers[id - 1] = { due: Number.POSITIVE_INFINITY, callback: () => undefined };
    }) as typeof window.clearTimeout;

    (window as any).__startedSources = startedSources;
    (window as any).__advanceAudioClock = (ms: number) => {
      nowMs += ms;
      timers
        .filter((timer) => timer.due <= nowMs)
        .splice(0)
        .forEach((timer) => {
          timer.due = Number.POSITIVE_INFINITY;
          timer.callback();
        });
    };
    (window as any).__emitRoundIntroScene = (round: number, id: string) => {
      current = {
        ...current,
        game: { ...current.game, currentRound: round },
        scene: {
          ...current.scene,
          active: {
            ...current.scene.active,
            id,
            type: "ROUND_INTRO",
            payload: { round }
          }
        }
      };
      sceneListeners.forEach((listener) => listener(current.scene));
    };

    window.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }) as Response;
    (window as any).AudioContext = class {
      state = "running";
      async resume() {
        this.state = "running";
      }
      async decodeAudioData(_buffer: ArrayBuffer) {
        return { duration: 5.2 };
      }
      createBufferSource() {
        const source = {
          buffer: undefined as { duration?: number } | undefined,
          connect: () => undefined,
          start: () => {
            startedSources.push(String(source.buffer?.duration ?? "unknown"));
          }
        };
        return {
          get buffer() {
            return source.buffer;
          },
          set buffer(value) {
            source.buffer = value;
          },
          connect: source.connect,
          start: source.start
        };
      }
      get destination() {
        return {};
      }
    };

    window.ollinPulse = {
      getWindowRole: () => current.role,
      getSnapshot: async () => current,
      onGameStateUpdated: () => () => undefined,
      onSceneStateUpdated: (callback: (state: unknown) => void) => {
        sceneListeners.add(callback);
        return () => sceneListeners.delete(callback);
      },
      invoke: async () => current
    };
  }, initialSnapshot);

  await page.goto("/#/public");
  await expect.poll(() => page.evaluate(() => (window as any).__startedSources.length)).toBe(1);

  await page.evaluate(() => (window as any).__emitRoundIntroScene(2, "round-intro-after-start"));
  await page.waitForTimeout(100);
  await expect(page.evaluate(() => (window as any).__startedSources.length)).resolves.toBe(1);

  await page.evaluate(() => (window as any).__advanceAudioClock(5_200));
  await expect.poll(() => page.evaluate(() => (window as any).__startedSources.length)).toBe(2);

  await page.evaluate(() => (window as any).__emitRoundIntroScene(2, "round-intro-refreshed-same-round"));
  await page.waitForTimeout(100);
  await expect(page.evaluate(() => (window as any).__startedSources.length)).resolves.toBe(2);
});
