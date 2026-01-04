import { UserTestSettings, TestConfig, getDefaultTestConfig } from "@/types/test";
import { getUserSettings, saveUserSettings } from "@/lib/firebase/firestore";
import { addToSyncQueue } from "@/features/sync/services/syncQueue";

export async function loadUserTestSettings(
  userId: string | null
): Promise<UserTestSettings | null> {
  if (!userId) return null;

  try {
    return await getUserSettings(userId);
  } catch (error) {
    console.warn("Failed to load settings from Firestore:", error);
    return null;
  }
}

export async function saveUserTestSettings(
  settings: UserTestSettings,
  userId: string | null
): Promise<void> {
  if (!userId) {
    // For non-logged users, we could store in localStorage
    // For now, just queue it
    await addToSyncQueue({
      id: `settings-${Date.now()}`,
      type: "settings",
      action: "update",
      data: settings,
      timestamp: new Date(),
    });
    return;
  }

  try {
    await saveUserSettings(userId, settings);
  } catch (error) {
    console.warn("Failed to save settings, queuing:", error);
    await addToSyncQueue({
      id: `settings-${Date.now()}`,
      type: "settings",
      action: "update",
      data: settings,
      timestamp: new Date(),
    });
  }
}

