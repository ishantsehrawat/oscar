import {
  saveProgress,
  getProgress,
  getAllProgress,
  getProgressByStatus,
} from "@/lib/storage/indexeddb";
import {
  saveUserProgress as saveFirestoreProgress,
  batchSaveUserProgress,
  getUserProgress as getFirestoreProgress,
} from "@/lib/firebase/firestore";
import { QuestionProgress } from "@/types/progress";
import { addToSyncQueue } from "@/features/sync/services/syncQueue";

export async function updateProgress(
  progress: QuestionProgress,
  userId: string | null = null
): Promise<void> {
  // Always save locally first
  await saveProgress(progress);

  // If logged in, try to sync
  if (userId) {
    try {
      await saveFirestoreProgress(userId, progress);
    } catch (error) {
      // Queue for later sync
      console.warn("Failed to sync progress, queuing:", error);
      await addToSyncQueue({
        id: `progress-${progress.questionId}-${Date.now()}`,
        type: "progress",
        action: "update",
        data: progress,
        timestamp: new Date(),
      });
    }
  }
}

export async function getProgressForQuestion(
  questionId: string
): Promise<QuestionProgress | undefined> {
  return getProgress(questionId);
}

export async function getAllUserProgress(): Promise<QuestionProgress[]> {
  return getAllProgress();
}

export async function getProgressByStatusFilter(
  status: string
): Promise<QuestionProgress[]> {
  return getProgressByStatus(status);
}

export async function syncProgressToFirestore(
  userId: string,
  progressList: QuestionProgress[]
): Promise<void> {
  await batchSaveUserProgress(userId, progressList);
}

export async function loadProgressFromFirestore(
  userId: string
): Promise<QuestionProgress[]> {
  return getFirestoreProgress(userId);
}

