import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Question } from "@/types/question";
import { QuestionProgress } from "@/types/progress";
import { Test } from "@/types/test";
import { SyncQueueItem } from "@/types/user";
import { DailyProgress } from "@/types/dailyProgress";
import { CalculatorSettings } from "@/types/calculatorSettings";
import { Sheet } from "@/types/sheet";

interface OscarDB extends DBSchema {
  questions: {
    key: string;
    value: Question;
    indexes: { difficulty: string };
  };
  // @ts-ignore - idb handles Date serialization at runtime, TypeScript types are strict
  progress: {
    key: string;
    value: QuestionProgress;
    indexes: { status: string; markedForRevision: boolean };
  };
  tests: {
    key: string;
    value: Test;
    indexes: { createdAt: Date };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { timestamp: Date };
  };
  dailyProgress: {
    key: string;
    value: DailyProgress;
    indexes: { date: string };
  };
  calculatorSettings: {
    key: string;
    value: CalculatorSettings;
  };
  sheets: {
    key: string;
    value: Sheet;
    indexes: { name: string };
  };
}

const DB_NAME = "oscar-db";
const DB_VERSION = 4;

let dbInstance: IDBPDatabase<OscarDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<OscarDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OscarDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Questions store
      if (!db.objectStoreNames.contains("questions")) {
        const questionStore = db.createObjectStore("questions", {
          keyPath: "id",
        });
        questionStore.createIndex("difficulty", "difficulty");
      }

      // Progress store
      if (!db.objectStoreNames.contains("progress")) {
        const progressStore = db.createObjectStore("progress", {
          keyPath: "questionId",
        });
        progressStore.createIndex("status", "status");
        progressStore.createIndex("markedForRevision", "markedForRevision");
      }

      // Tests store
      if (!db.objectStoreNames.contains("tests")) {
        const testStore = db.createObjectStore("tests", {
          keyPath: "id",
        });
        testStore.createIndex("createdAt", "createdAt");
      }

      // Sync queue store
      if (!db.objectStoreNames.contains("syncQueue")) {
        const syncStore = db.createObjectStore("syncQueue", {
          keyPath: "id",
        });
        syncStore.createIndex("timestamp", "timestamp");
      }

      // Daily progress store
      if (!db.objectStoreNames.contains("dailyProgress")) {
        const dailyProgressStore = db.createObjectStore("dailyProgress", {
          keyPath: "date",
        });
        dailyProgressStore.createIndex("date", "date");
      }

      // Sheets store
      if (!db.objectStoreNames.contains("sheets")) {
        const sheetsStore = db.createObjectStore("sheets", {
          keyPath: "id",
        });
        sheetsStore.createIndex("name", "name");
      }

      // Calculator settings store
      if (!db.objectStoreNames.contains("calculatorSettings")) {
        db.createObjectStore("calculatorSettings", {
          keyPath: "id",
        });
      }
    },
  });

  return dbInstance;
}

// Questions operations
export async function cacheQuestions(questions: Question[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("questions", "readwrite");
  await Promise.all(questions.map((q) => tx.store.put(q)));
  await tx.done;
}

export async function getCachedQuestions(): Promise<Question[]> {
  const db = await getDB();
  return db.getAll("questions");
}

export async function getCachedQuestion(id: string): Promise<Question | undefined> {
  const db = await getDB();
  return db.get("questions", id);
}

// Progress operations
export async function saveProgress(progress: QuestionProgress): Promise<void> {
  const db = await getDB();
  await db.put("progress", progress);
}

export async function getProgress(questionId: string): Promise<QuestionProgress | undefined> {
  const db = await getDB();
  return db.get("progress", questionId);
}

export async function getAllProgress(): Promise<QuestionProgress[]> {
  const db = await getDB();
  return db.getAll("progress");
}

export async function getProgressByStatus(status: string): Promise<QuestionProgress[]> {
  const db = await getDB();
  return db.getAllFromIndex("progress", "status", status);
}

// Tests operations
export async function saveTest(test: Test): Promise<void> {
  const db = await getDB();
  await db.put("tests", test);
}

export async function getTest(id: string): Promise<Test | undefined> {
  const db = await getDB();
  return db.get("tests", id);
}

export async function getAllTests(): Promise<Test[]> {
  const db = await getDB();
  return db.getAll("tests");
}

// Sync queue operations
export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put("syncQueue", item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll("syncQueue");
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("syncQueue", "readwrite");
  await tx.store.clear();
  await tx.done;
}

// Daily progress operations
export async function saveDailyProgress(progress: DailyProgress): Promise<void> {
  const db = await getDB();
  await db.put("dailyProgress", progress);
}

export async function getDailyProgress(date: string): Promise<DailyProgress | undefined> {
  const db = await getDB();
  return db.get("dailyProgress", date);
}

export async function getAllDailyProgress(): Promise<DailyProgress[]> {
  const db = await getDB();
  return db.getAll("dailyProgress");
}

export async function getDailyProgressByDateRange(
  startDate: string,
  endDate: string
): Promise<DailyProgress[]> {
  const db = await getDB();
  const allProgress = await db.getAll("dailyProgress");
  return allProgress.filter(
    (p) => p.date >= startDate && p.date <= endDate
  );
}

export async function deleteDailyProgress(date: string): Promise<void> {
  const db = await getDB();
  await db.delete("dailyProgress", date);
}

// Calculator settings operations
export async function saveCalculatorSettings(settings: CalculatorSettings): Promise<void> {
  const db = await getDB();
  await db.put("calculatorSettings", settings);
}

export async function getCalculatorSettings(): Promise<CalculatorSettings | undefined> {
  const db = await getDB();
  return db.get("calculatorSettings", "default");
}

// Sheets operations
export async function cacheSheet(sheet: Sheet): Promise<void> {
  const db = await getDB();
  await db.put("sheets", sheet);
}

export async function getCachedSheet(sheetName: string): Promise<Sheet | undefined> {
  const db = await getDB();
  const index = db.transaction("sheets").store.index("name");
  return index.get(sheetName);
}

export async function getAllCachedSheets(): Promise<Sheet[]> {
  const db = await getDB();
  return db.getAll("sheets");
}

// Export/Import for non-logged users
export async function exportData(): Promise<string> {
  const [questions, progress, tests, dailyProgress, calculatorSettings] = await Promise.all([
    getAllProgress(),
    getCachedQuestions(),
    getAllTests(),
    getAllDailyProgress(),
    getCalculatorSettings().catch(() => undefined),
  ]);

  return JSON.stringify(
    {
      questions,
      progress,
      tests,
      dailyProgress,
      calculatorSettings,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export async function importData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);
  
  if (data.questions) {
    await cacheQuestions(data.questions);
  }
  
  if (data.progress) {
    const db = await getDB();
    const tx = db.transaction("progress", "readwrite");
    await Promise.all(data.progress.map((p: QuestionProgress) => {
      // Convert date strings back to Date objects
      if (p.lastPracticedAt) p.lastPracticedAt = new Date(p.lastPracticedAt);
      if (p.completedAt) p.completedAt = new Date(p.completedAt);
      if (p.updatedAt) p.updatedAt = new Date(p.updatedAt);
      return tx.store.put(p);
    }));
    await tx.done;
  }
  
  if (data.tests) {
    const db = await getDB();
    const tx = db.transaction("tests", "readwrite");
    await Promise.all(data.tests.map((t: Test) => {
      if (t.createdAt) t.createdAt = new Date(t.createdAt);
      return tx.store.put(t);
    }));
    await tx.done;
  }
  
  if (data.dailyProgress) {
    const db = await getDB();
    const tx = db.transaction("dailyProgress", "readwrite");
    await Promise.all(data.dailyProgress.map((dp: DailyProgress) => {
      if (dp.createdAt) dp.createdAt = new Date(dp.createdAt);
      if (dp.updatedAt) dp.updatedAt = new Date(dp.updatedAt);
      return tx.store.put(dp);
    }));
    await tx.done;
  }
  
  if (data.calculatorSettings) {
    const settings: CalculatorSettings = data.calculatorSettings;
    if (settings.updatedAt) settings.updatedAt = new Date(settings.updatedAt);
    await saveCalculatorSettings(settings);
  }
}

