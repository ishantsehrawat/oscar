import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { getFirestoreDB } from "./config";
import { Question } from "@/types/question";
import { QuestionProgress } from "@/types/progress";
import { Test, UserTestSettings } from "@/types/test";
import { Sheet } from "@/types/sheet";
import { DailyProgress } from "@/types/dailyProgress";
import { CalculatorSettings } from "@/types/calculatorSettings";

const db = getFirestoreDB();

// Questions collection (read-only, shared)
export async function getQuestions(sheet?: string | null): Promise<Question[]> {
  const questionsRef = collection(db, "questions");
  let snapshot;

  // If sheet is null or undefined, return all questions
  if (sheet) {
    // Filter by sheet using array-contains (for sheets array)
    // Note: This requires a composite index in Firestore
    // If index doesn't exist, Firestore will show an error with a link to create it
    try {
      const q = query(
        questionsRef,
        where("sheets", "array-contains", sheet),
        orderBy("order")
      );
      snapshot = await getDocs(q);
    } catch (error: any) {
      // If composite index doesn't exist, fall back to query without orderBy
      if (error?.code === "failed-precondition") {
        console.warn("Composite index not found, querying without orderBy");
        const q = query(questionsRef, where("sheets", "array-contains", sheet));
        snapshot = await getDocs(q);
      } else {
        throw error;
      }
    }
  } else {
    // For "All Questions", query without orderBy to include all documents
    // Then sort client-side to handle missing order fields
    snapshot = await getDocs(questionsRef);
  }

  const questions = snapshot.docs.map((doc) => {
    const data = doc.data();
    // Handle migration from old sheet (string) to new sheets (array)
    let sheets: string[] = [];
    if (data.sheets && Array.isArray(data.sheets)) {
      sheets = data.sheets;
    } else if (data.sheet) {
      sheets = [data.sheet];
    } else {
      sheets = ["Striver SDE Sheet"]; // Default for old documents
    }

    return {
      id: doc.id,
      ...data,
      sheets,
      createdAt: data.createdAt?.toDate(),
    };
  }) as Question[];

  // If sheet filter is specified, also filter client-side as fallback
  if (sheet) {
    const filtered = questions.filter((q) => q.sheets.includes(sheet));
    // Sort by order if available
    return filtered.sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });
  }

  // Sort all questions by order (client-side)
  return questions.sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    return orderA - orderB;
  });
}

export async function getAvailableSheets(): Promise<string[]> {
  const questionsRef = collection(db, "questions");
  const snapshot = await getDocs(questionsRef);
  const sheets = new Set<string>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // Handle both old (sheet) and new (sheets) format
    if (data.sheets && Array.isArray(data.sheets)) {
      data.sheets.forEach((s: string) => sheets.add(s));
    } else if (data.sheet) {
      sheets.add(data.sheet);
    }
  });

  return Array.from(sheets).sort();
}

export async function getQuestion(id: string): Promise<Question | null> {
  const docRef = doc(db, "questions", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  // Handle migration from old sheet (string) to new sheets (array)
  let sheets: string[] = [];
  if (data.sheets && Array.isArray(data.sheets)) {
    sheets = data.sheets;
  } else if (data.sheet) {
    sheets = [data.sheet];
  } else {
    sheets = ["Striver SDE Sheet"]; // Default for old documents
  }

  return {
    id: docSnap.id,
    ...data,
    sheets,
    createdAt: data.createdAt?.toDate(),
  } as Question;
}

export async function createQuestion(
  questionData: Omit<Question, "id" | "createdAt">
): Promise<string> {
  const questionsRef = collection(db, "questions");
  const newDocRef = doc(questionsRef);

  const sheets =
    questionData.sheets && questionData.sheets.length > 0
      ? questionData.sheets
      : ["Striver SDE Sheet"]; // Default to Striver SDE Sheet

  await setDoc(newDocRef, {
    ...questionData,
    sheets,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Sync sheets after creating question
  for (const sheetName of sheets) {
    try {
      await syncSheetFromQuestions(sheetName);
    } catch (error) {
      console.error(`Failed to sync sheet ${sheetName}:`, error);
      // Don't fail the question creation if sheet sync fails
    }
  }

  return newDocRef.id;
}

export async function updateQuestion(
  questionId: string,
  questionData: Partial<Omit<Question, "id" | "createdAt">>
): Promise<void> {
  const questionRef = doc(db, "questions", questionId);

  // Get current question to track sheet changes
  const currentQuestion = await getDoc(questionRef);
  const currentData = currentQuestion.data();
  const oldSheets = currentData?.sheets || [];
  const newSheets = questionData.sheets || oldSheets;

  await updateDoc(questionRef, {
    ...questionData,
    updatedAt: Timestamp.now(),
  });

  // Sync all affected sheets
  const allSheets = new Set([...oldSheets, ...newSheets]);
  for (const sheetName of allSheets) {
    try {
      await syncSheetFromQuestions(sheetName);
    } catch (error) {
      console.error(`Failed to sync sheet ${sheetName}:`, error);
    }
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const questionRef = doc(db, "questions", questionId);

  // Get current question to track which sheets it belongs to
  const currentQuestion = await getDoc(questionRef);
  const currentData = currentQuestion.data();
  const sheets = currentData?.sheets || [];

  // Delete the question
  await deleteDoc(questionRef);

  // Sync all affected sheets
  for (const sheetName of sheets) {
    try {
      await syncSheetFromQuestions(sheetName);
    } catch (error) {
      console.error(`Failed to sync sheet ${sheetName}:`, error);
    }
  }
}

// User progress collection
export async function getUserProgress(
  userId: string
): Promise<QuestionProgress[]> {
  const q = query(collection(db, "users", userId, "progress"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    lastPracticedAt: doc.data().lastPracticedAt?.toDate() || null,
    completedAt: doc.data().completedAt?.toDate() || null,
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as QuestionProgress[];
}

export async function saveUserProgress(
  userId: string,
  progress: QuestionProgress
): Promise<void> {
  const docRef = doc(db, "users", userId, "progress", progress.questionId);
  await setDoc(docRef, {
    ...progress,
    lastPracticedAt: progress.lastPracticedAt
      ? Timestamp.fromDate(progress.lastPracticedAt)
      : null,
    completedAt: progress.completedAt
      ? Timestamp.fromDate(progress.completedAt)
      : null,
    updatedAt: Timestamp.fromDate(progress.updatedAt),
  });
}

export async function batchSaveUserProgress(
  userId: string,
  progressList: QuestionProgress[]
): Promise<void> {
  const batch = writeBatch(db);
  progressList.forEach((progress) => {
    const docRef = doc(db, "users", userId, "progress", progress.questionId);
    batch.set(docRef, {
      ...progress,
      lastPracticedAt: progress.lastPracticedAt
        ? Timestamp.fromDate(progress.lastPracticedAt)
        : null,
      completedAt: progress.completedAt
        ? Timestamp.fromDate(progress.completedAt)
        : null,
      updatedAt: Timestamp.fromDate(progress.updatedAt),
    });
  });
  await batch.commit();
}

// Tests collection
export async function getUserTests(userId: string): Promise<Test[]> {
  const q = query(
    collection(db, "users", userId, "tests"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    results: doc.data().results || [],
  })) as Test[];
}

export async function saveUserTest(userId: string, test: Test): Promise<void> {
  const docRef = doc(db, "users", userId, "tests", test.id);
  await setDoc(docRef, {
    ...test,
    createdAt: Timestamp.fromDate(test.createdAt),
  });
}

// Settings collection
export async function getUserSettings(
  userId: string
): Promise<UserTestSettings | null> {
  const docRef = doc(db, "users", userId, "settings", "test");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    ...data,
    lastSyncedAt: data.lastSyncedAt?.toDate() || null,
  } as UserTestSettings;
}

export async function saveUserSettings(
  userId: string,
  settings: UserTestSettings
): Promise<void> {
  const docRef = doc(db, "users", userId, "settings", "test");
  await setDoc(docRef, {
    ...settings,
    lastSyncedAt: settings.lastSyncedAt
      ? Timestamp.fromDate(settings.lastSyncedAt)
      : null,
  });
}

// Daily Progress collection
export async function getUserDailyProgress(
  userId: string
): Promise<DailyProgress[]> {
  const q = query(collection(db, "users", userId, "dailyProgress"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      date: data.date,
      count: data.count,
      questionIds: data.questionIds || undefined,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as DailyProgress;
  });
}

export async function saveUserDailyProgress(
  userId: string,
  progress: DailyProgress
): Promise<void> {
  const docRef = doc(db, "users", userId, "dailyProgress", progress.date);
  await setDoc(docRef, {
    date: progress.date,
    count: progress.count,
    questionIds: progress.questionIds || null,
    createdAt: Timestamp.fromDate(progress.createdAt),
    updatedAt: Timestamp.fromDate(progress.updatedAt),
  });
}

export async function batchSaveUserDailyProgress(
  userId: string,
  progressList: DailyProgress[]
): Promise<void> {
  const batch = writeBatch(db);
  progressList.forEach((progress) => {
    const docRef = doc(db, "users", userId, "dailyProgress", progress.date);
    batch.set(docRef, {
      date: progress.date,
      count: progress.count,
      questionIds: progress.questionIds || null,
      createdAt: Timestamp.fromDate(progress.createdAt),
      updatedAt: Timestamp.fromDate(progress.updatedAt),
    });
  });
  await batch.commit();
}

// Calculator Settings collection
export async function getUserCalculatorSettings(
  userId: string
): Promise<CalculatorSettings | null> {
  const docRef = doc(db, "users", userId, "settings", "calculator");
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    ...data,
    updatedAt: data.updatedAt?.toDate(),
  } as CalculatorSettings;
}

export async function saveUserCalculatorSettings(
  userId: string,
  settings: CalculatorSettings
): Promise<void> {
  const docRef = doc(db, "users", userId, "settings", "calculator");
  await setDoc(docRef, {
    ...settings,
    updatedAt: Timestamp.fromDate(settings.updatedAt),
  });
}

// Sheets collection
export async function getSheet(sheetName: string): Promise<Sheet | null> {
  try {
    const sheetsRef = collection(db, "sheets");
    const q = query(sheetsRef, where("name", "==", sheetName));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Create default sheet if it doesn't exist (for Striver SDE Sheet)
      if (sheetName === "Striver SDE Sheet") {
        const defaultSheet: Omit<Sheet, "id" | "createdAt" | "updatedAt"> = {
          name: "Striver SDE Sheet",
          questionIds: [],
          totalQuestions: 191,
        };
        const sheetId = await createOrUpdateSheet(defaultSheet);
        return {
          id: sheetId,
          ...defaultSheet,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    }

    const sheetDoc = snapshot.docs[0];
    const data = sheetDoc.data();
    const sheet = {
      id: sheetDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Sheet;

    // Always hardcode total to 191 for Striver SDE Sheet
    if (sheet.name === "Striver SDE Sheet") {
      sheet.totalQuestions = 191;
    }

    // Cache in IndexedDB
    const { cacheSheet } = await import("@/lib/storage/indexeddb");
    await cacheSheet(sheet);

    return sheet;
  } catch (error) {
    console.error("Failed to get sheet from Firestore:", error);
    // Fallback to cache
    const { getCachedSheet } = await import("@/lib/storage/indexeddb");
    const cached = await getCachedSheet(sheetName);
    if (cached) return cached;

    // If still not found and it's Striver SDE Sheet, return default
    if (sheetName === "Striver SDE Sheet") {
      return {
        id: "default",
        name: "Striver SDE Sheet",
        questionIds: [],
        totalQuestions: 191,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return null;
  }
}

export async function getAllSheets(): Promise<Sheet[]> {
  const sheetsRef = collection(db, "sheets");
  const q = query(sheetsRef, orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const sheet = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Sheet;

    // Always hardcode total to 191 for Striver SDE Sheet
    if (sheet.name === "Striver SDE Sheet") {
      sheet.totalQuestions = 191;
    }

    return sheet;
  }) as Sheet[];
}

export async function createOrUpdateSheet(
  sheetData: Omit<Sheet, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const sheetsRef = collection(db, "sheets");
  const q = query(sheetsRef, where("name", "==", sheetData.name));
  const snapshot = await getDocs(q);

  // Always hardcode total to 191 for Striver SDE Sheet
  const finalSheetData = {
    ...sheetData,
    totalQuestions:
      sheetData.name === "Striver SDE Sheet" ? 191 : sheetData.totalQuestions,
  };

  if (snapshot.empty) {
    // Create new sheet
    const newDocRef = doc(sheetsRef);
    const newSheet = {
      ...finalSheetData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(newDocRef, newSheet);

    // Cache in IndexedDB
    const { cacheSheet } = await import("@/lib/storage/indexeddb");
    await cacheSheet({
      id: newDocRef.id,
      ...newSheet,
      createdAt: newSheet.createdAt.toDate(),
      updatedAt: newSheet.updatedAt.toDate(),
    });

    return newDocRef.id;
  } else {
    // Update existing sheet
    const existingDoc = snapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      ...finalSheetData,
      updatedAt: Timestamp.now(),
    });

    // Update cache
    const existingData = existingDoc.data();
    const { cacheSheet } = await import("@/lib/storage/indexeddb");
    await cacheSheet({
      id: existingDoc.id,
      ...finalSheetData,
      createdAt: existingData.createdAt?.toDate() || new Date(),
      updatedAt: new Date(),
    });

    return existingDoc.id;
  }
}

export async function syncSheetFromQuestions(sheetName: string): Promise<void> {
  // Get all questions that belong to this sheet (without ordering for sync)
  // This avoids requiring a composite index
  const questionsRef = collection(db, "questions");
  const q = query(questionsRef, where("sheets", "array-contains", sheetName));
  const snapshot = await getDocs(q);

  const questionIds = snapshot.docs.map((doc) => doc.id);

  // Always use 191 for Striver SDE Sheet, otherwise use actual count
  const totalQuestions =
    sheetName === "Striver SDE Sheet" ? 191 : questionIds.length;

  // Create or update the sheet
  await createOrUpdateSheet({
    name: sheetName,
    questionIds,
    totalQuestions,
  });
}
