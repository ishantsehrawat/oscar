export type QuestionStatus = "not_started" | "in_progress" | "completed";

export type ProficiencyLevel = "beginner" | "intermediate" | "proficient";

export interface QuestionProgress {
  questionId: string;
  status: QuestionStatus;
  attempts: number;
  lastPracticedAt: Date | null;
  markedForRevision: boolean;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionPercentage: number;
  byDifficulty: {
    easy: { total: number; completed: number };
    medium: { total: number; completed: number };
    hard: { total: number; completed: number };
  };
  byTopic: Record<string, { total: number; completed: number }>;
  streak: number;
}

export function getProficiencyLevel(attempts: number): ProficiencyLevel {
  if (attempts === 1) return "beginner";
  if (attempts >= 2 && attempts <= 3) return "intermediate";
  return "proficient";
}

