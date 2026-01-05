export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  count: number;
  questionIds?: string[]; // Array of question IDs solved on this day
  createdAt: Date;
  updatedAt: Date;
}

