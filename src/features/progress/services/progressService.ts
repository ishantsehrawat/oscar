import { getAllProgress } from "@/lib/storage/indexeddb";
import { ProgressStats, QuestionProgress } from "@/types/progress";
import { Question } from "@/types/question";
import { getProficiencyLevel } from "@/types/progress";

export function calculateProgressStats(
  questions: Question[],
  progressList: QuestionProgress[],
  total?: number
): ProgressStats {
  const progressMap = new Map(progressList.map((p) => [p.questionId, p]));

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  
  // Use provided total or calculate from questions
  const totalQuestions = total ?? questions.length;

  const byDifficulty = {
    easy: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    hard: { total: 0, completed: 0 },
  };

  const byTopic: Record<string, { total: number; completed: number }> = {};

  questions.forEach((question) => {
    const progress = progressMap.get(question.id);
    const status = progress?.status || "not_started";

    if (status === "completed") completed++;
    else if (status === "in_progress") inProgress++;
    else notStarted++;

    // By difficulty
    byDifficulty[question.difficulty.toLowerCase() as "easy" | "medium" | "hard"].total++;
    if (status === "completed") {
      byDifficulty[question.difficulty.toLowerCase() as "easy" | "medium" | "hard"].completed++;
    }

    // By topic - iterate over all topics in the array
    question.topics.forEach((topic) => {
      if (!byTopic[topic]) {
        byTopic[topic] = { total: 0, completed: 0 };
      }
      byTopic[topic].total++;
      if (status === "completed") {
        byTopic[topic].completed++;
      }
    });
  });

  // Calculate streak (consecutive days with at least one practice)
  const streak = calculateStreak(progressList);

  return {
    total: totalQuestions,
    completed,
    inProgress,
    notStarted,
    completionPercentage: totalQuestions > 0 ? (completed / totalQuestions) * 100 : 0,
    byDifficulty,
    byTopic,
    streak,
  };
}

function calculateStreak(progressList: QuestionProgress[]): number {
  if (progressList.length === 0) return 0;

  const practiceDates = progressList
    .filter((p) => p.lastPracticedAt)
    .map((p) => {
      const date = p.lastPracticedAt!;
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    })
    .filter((date, index, self) => {
      return index === self.findIndex((d) => d.getTime() === date.getTime());
    })
    .sort((a, b) => b.getTime() - a.getTime());

  if (practiceDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expectedDate = new Date(today);

  for (const date of practiceDates) {
    if (date.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (date.getTime() < expectedDate.getTime()) {
      break;
    }
  }

  return streak;
}

export async function getProgressData(): Promise<QuestionProgress[]> {
  return getAllProgress();
}

