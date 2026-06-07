import * as XLSX from "xlsx";
import { applyPointPresetToQuestion } from "../gameController";
import type { GameMode, Question } from "../../shared/game.types";
import type { ImportedQuestionRow, QuestionImportResult, QuestionValidationError } from "../../shared/import.types";

export function parseQuestionsFromWorkbook(workbook: XLSX.WorkBook, gameMode: GameMode): QuestionImportResult {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ImportedQuestionRow>(firstSheet, { defval: "" });
  const errors = validateQuestionRows(rows);
  const questions = errors.length > 0 ? [] : mapRowsToQuestions(rows, gameMode);
  return { questions, errors };
}

export function validateQuestionRows(rows: ImportedQuestionRow[]): QuestionValidationError[] {
  const errors: QuestionValidationError[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!Number(row.round)) {
      errors.push({ row: rowNumber, field: "round", message: "La ronda es obligatoria y debe ser numérica." });
    }
    if (!String(row.question ?? "").trim()) {
      errors.push({ row: rowNumber, field: "question", message: "La pregunta es obligatoria." });
    }

    const answers = extractAnswers(row);
    if (answers.length < 2) {
      errors.push({ row: rowNumber, field: "answers", message: "Cada pregunta debe tener al menos 2 respuestas." });
    }
    if (answers.length > 8) {
      errors.push({ row: rowNumber, field: "answers", message: "Cada pregunta debe tener máximo 8 respuestas." });
    }
  });

  return errors;
}

export function mapRowsToQuestions(rows: ImportedQuestionRow[], gameMode: GameMode): Question[] {
  return rows.map((row, rowIndex) => {
    const question: Question = {
      id: `q-${row.round}-${rowIndex + 1}`,
      round: Number(row.round),
      text: String(row.question).trim(),
      answers: extractAnswers(row).map((text, index) => ({
        id: `q-${row.round}-${rowIndex + 1}-a-${index + 1}`,
        text,
        points: 0,
        revealed: false
      })),
      totalPoints: 0
    };

    return applyPointPresetToQuestion(question, gameMode);
  });
}

function extractAnswers(row: ImportedQuestionRow): string[] {
  return Array.from({ length: 8 }, (_, index) => String(row[`answer_${index + 1}` as keyof ImportedQuestionRow] ?? "").trim()).filter(
    Boolean
  );
}
