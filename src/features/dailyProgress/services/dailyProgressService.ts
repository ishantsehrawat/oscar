import {
  saveDailyProgress as saveLocalDailyProgress,
  getAllDailyProgress as getAllLocalDailyProgress,
} from "@/lib/storage/indexeddb";
import {
  saveUserDailyProgress as saveFirestoreDailyProgress,
  batchSaveUserDailyProgress,
  getUserDailyProgress as getFirestoreDailyProgress,
} from "@/lib/firebase/firestore";
import { DailyProgress } from "@/types/dailyProgress";
import { addToSyncQueue } from "@/features/sync/services/syncQueue";

export async function saveDailyProgress(
  progress: DailyProgress,
  userId: string | null = null
): Promise<void> {
  // Always save locally first
  await saveLocalDailyProgress(progress);

  // If logged in, try to sync
  if (userId) {
    try {
      await saveFirestoreDailyProgress(userId, progress);
    } catch (error) {
      // Queue for later sync
      console.warn("Failed to sync daily progress, queuing:", error);
      await addToSyncQueue({
        id: `dailyProgress-${progress.date}-${Date.now()}`,
        type: "dailyProgress",
        action: "update",
        data: progress,
        timestamp: new Date(),
      });
    }
  }
}

export async function getAllDailyProgress(): Promise<DailyProgress[]> {
  return getAllLocalDailyProgress();
}

export async function syncDailyProgressToFirestore(
  userId: string,
  progressList: DailyProgress[]
): Promise<void> {
  await batchSaveUserDailyProgress(userId, progressList);
}

export async function loadDailyProgressFromFirestore(
  userId: string
): Promise<DailyProgress[]> {
  return getFirestoreDailyProgress(userId);
}

