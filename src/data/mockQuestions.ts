import type { Question } from "@shared/game.types";
import { applyPointPresetToQuestion } from "@/services/gameEngine";

const raw: Question[] = [
  {
    id: "mock-1",
    round: 1,
    text: "¿Qué haces al llegar a casa?",
    answers: ["Dormir", "Comer", "Ver TV", "Bañarme", "Descansar", "Usar celular"].map((text, index) => ({
      id: `mock-1-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  },
  {
    id: "mock-1-two",
    round: 1,
    text: "Elige entre estas dos opciones para validar el tablero.",
    answers: ["Opcion A", "Opcion B"].map((text, index) => ({
      id: `mock-1-two-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  },
  {
    id: "mock-1-three",
    round: 1,
    text: "Menciona un premio rapido para una dinamica.",
    answers: ["Playera", "Vaso", "Gorra"].map((text, index) => ({
      id: `mock-1-three-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  },
  {
    id: "mock-1-four",
    round: 1,
    text: "Menciona un elemento que se ve en una mesa de evento.",
    answers: ["Vasos", "Servilletas", "Hielera", "Botanas"].map((text, index) => ({
      id: `mock-1-four-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  },
  {
    id: "mock-1-five",
    round: 1,
    text: "Menciona una actividad para romper el hielo.",
    answers: ["Brindis", "Foto grupal", "Juego corto", "Presentacion", "Trivia"].map((text, index) => ({
      id: `mock-1-five-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  },
  {
    id: "mock-2",
    round: 2,
    text: "Menciona algo que no puede faltar en un evento.",
    answers: ["Música", "Comida", "Bebidas", "Invitados", "Luces", "Fotos", "Premios", "Pantallas"].map((text, index) => ({
      id: `mock-2-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  },
  {
    id: "mock-2-seven",
    round: 2,
    text: "Menciona algo que la gente suele pedir en una fiesta.",
    answers: ["Musica", "Hielo", "Bebida", "Comida", "Fotos", "Premios", "Taxi"].map((text, index) => ({
      id: `mock-2-seven-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  },
  {
    id: "mock-3",
    round: 3,
    text: "Menciona una forma de celebrar una victoria.",
    answers: ["Gritar", "Aplaudir", "Bailar", "Brindar", "Abrazar", "Tomar fotos"].map((text, index) => ({
      id: `mock-3-a-${index + 1}`,
      text,
      points: 0,
      revealed: false
    })),
    totalPoints: 0
  }
];

export const mockQuestions = raw.map((question) => applyPointPresetToQuestion(question, "3_RONDAS"));
