import type { Question } from "./game.types";

export interface ImportedQuestionRow {
  round: number;
  question: string;
  answer_1?: string;
  answer_2?: string;
  answer_3?: string;
  answer_4?: string;
  answer_5?: string;
  answer_6?: string;
  answer_7?: string;
  answer_8?: string;
}

export interface QuestionValidationError {
  row: number;
  field: string;
  message: string;
}

export interface QuestionImportResult {
  questions: Question[];
  errors: QuestionValidationError[];
}
