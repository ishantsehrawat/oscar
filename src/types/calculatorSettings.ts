export interface CalculatorSettings {
  id: string; // Always "default" for single settings
  totalQuestions: number;
  questionsPerWeekday: number;
  extraQuestionsToday: number;
  extraQuestionsWeekend: number;
  startDate: string; // YYYY-MM-DD format
  updatedAt: Date;
}

