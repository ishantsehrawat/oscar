import { getSyncQueue, removeFromSyncQueue } from "./syncQueue";
import {
  saveUserProgress,
  batchSaveUserProgress,
  saveUserTest,
  saveUserSettings,
  batchSaveUserDailyProgress,
  saveUserDailyProgress,
  saveUserCalculatorSettings,
} from "@/lib/firebase/firestore";
import { SyncQueueItem } from "@/types/user";
import { QuestionProgress } from "@/types/progress";
import { Test, UserTestSettings } from "@/types/test";
import { DailyProgress } from "@/types/dailyProgress";
import { CalculatorSettings } from "@/types/calculatorSettings";

export async function syncQueueToFirestore(userId: string): Promise<void> {
  const queue = await getSyncQueue();
  const progressItems: QuestionProgress[] = [];
  const testItems: Test[] = [];
  let settingsItem: UserTestSettings | null = null;
  const dailyProgressItems: DailyProgress[] = [];
  let calculatorSettingsItem: CalculatorSettings | null = null;

  // Group items by type
  for (const item of queue) {
    try {
      switch (item.type) {
        case "progress":
          if (item.action === "update" || item.action === "create") {
            progressItems.push(item.data as QuestionProgress);
          }
          break;
        case "test":
          if (item.action === "create" || item.action === "update") {
            testItems.push(item.data as Test);
          }
          break;
        case "settings":
          if (item.action === "update") {
            settingsItem = item.data as UserTestSettings;
          }
          break;
        case "dailyProgress":
          if (item.action === "update" || item.action === "create") {
            dailyProgressItems.push(item.data as DailyProgress);
          }
          break;
        case "calculatorSettings":
          if (item.action === "update") {
            calculatorSettingsItem = item.data as CalculatorSettings;
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to process sync item ${item.id}:`, error);
    }
  }

  // Batch sync progress
  if (progressItems.length > 0) {
    try {
      await batchSaveUserProgress(userId, progressItems);
      // Remove synced items from queue
      for (const item of queue) {
        if (item.type === "progress") {
          await removeFromSyncQueue(item.id);
        }
      }
    } catch (error) {
      console.error("Failed to sync progress:", error);
    }
  }

  // Sync tests
  for (const test of testItems) {
    try {
      await saveUserTest(userId, test);
      const item = queue.find((q) => q.type === "test" && q.data.id === test.id);
      if (item) {
        await removeFromSyncQueue(item.id);
      }
    } catch (error) {
      console.error(`Failed to sync test ${test.id}:`, error);
    }
  }

  // Sync settings
  if (settingsItem) {
    try {
      await saveUserSettings(userId, settingsItem);
      const item = queue.find((q) => q.type === "settings");
      if (item) {
        await removeFromSyncQueue(item.id);
      }
    } catch (error) {
      console.error("Failed to sync settings:", error);
    }
  }

  // Batch sync daily progress
  if (dailyProgressItems.length > 0) {
    try {
      await batchSaveUserDailyProgress(userId, dailyProgressItems);
      // Remove synced items from queue
      for (const item of queue) {
        if (item.type === "dailyProgress") {
          await removeFromSyncQueue(item.id);
        }
      }
    } catch (error) {
      console.error("Failed to sync daily progress:", error);
    }
  }

  // Sync calculator settings
  if (calculatorSettingsItem) {
    try {
      await saveUserCalculatorSettings(userId, calculatorSettingsItem);
      const item = queue.find((q) => q.type === "calculatorSettings");
      if (item) {
        await removeFromSyncQueue(item.id);
      }
    } catch (error) {
      console.error("Failed to sync calculator settings:", error);
    }
  }
}

export async function checkSyncStatus(): Promise<{
  hasPendingItems: boolean;
  itemCount: number;
}> {
  const queue = await getSyncQueue();
  return {
    hasPendingItems: queue.length > 0,
    itemCount: queue.length,
  };
}

