import {
  saveCalculatorSettings as saveLocalCalculatorSettings,
  getCalculatorSettings as getLocalCalculatorSettings,
} from "@/lib/storage/indexeddb";
import {
  saveUserCalculatorSettings as saveFirestoreCalculatorSettings,
  getUserCalculatorSettings as getFirestoreCalculatorSettings,
} from "@/lib/firebase/firestore";
import { CalculatorSettings } from "@/types/calculatorSettings";
import { addToSyncQueue } from "@/features/sync/services/syncQueue";

export async function saveCalculatorSettings(
  settings: CalculatorSettings,
  userId: string | null = null
): Promise<void> {
  // Always save locally first
  await saveLocalCalculatorSettings(settings);

  // If logged in, try to sync
  if (userId) {
    try {
      await saveFirestoreCalculatorSettings(userId, settings);
    } catch (error) {
      // Queue for later sync
      console.warn("Failed to sync calculator settings, queuing:", error);
      await addToSyncQueue({
        id: `calculatorSettings-${Date.now()}`,
        type: "calculatorSettings",
        action: "update",
        data: settings,
        timestamp: new Date(),
      });
    }
  }
}

export async function getCalculatorSettings(): Promise<CalculatorSettings | undefined> {
  return getLocalCalculatorSettings();
}

export async function loadCalculatorSettingsFromFirestore(
  userId: string
): Promise<CalculatorSettings | null> {
  return getFirestoreCalculatorSettings(userId);
}

