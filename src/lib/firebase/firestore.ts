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

const db = getFirestoreDB();

// Questions collection (read-only, shared)
export async function getQuestions(sheet?: string | null): Promise<Question[]> {
  const questionsRef = collection(db, "questions");
  let q;
  
  // If sheet is null or undefined, return all questions
  if (sheet) {
    // Filter by sheet using array-contains (for sheets array)
    // Note: This requires a composite index in Firestore
    // If index doesn't exist, Firestore will show an error with a link to create it
    q = query(questionsRef, where("sheets", "array-contains", sheet), orderBy("order"));
  } else {
    q = query(questionsRef, orderBy("order"));
  }
  
  const snapshot = await getDocs(q);
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
    return questions.filter((q) => q.sheets.includes(sheet));
  }
  
  return questions;
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

export async function createQuestion(questionData: Omit<Question, "id" | "createdAt">): Promise<string> {
  const questionsRef = collection(db, "questions");
  const newDocRef = doc(questionsRef);
  
  const sheets = questionData.sheets && questionData.sheets.length > 0 
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

// User progress collection
export async function getUserProgress(userId: string): Promise<QuestionProgress[]> {
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
export async function getUserSettings(userId: string): Promise<UserTestSettings | null> {
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
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }) as Sheet[];
}

export async function createOrUpdateSheet(sheetData: Omit<Sheet, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const sheetsRef = collection(db, "sheets");
  const q = query(sheetsRef, where("name", "==", sheetData.name));
  const snapshot = await getDocs(q);
  
  // Ensure default total for Striver SDE Sheet
  const finalSheetData = {
    ...sheetData,
    totalQuestions: sheetData.name === "Striver SDE Sheet" && sheetData.totalQuestions === 0
      ? 191
      : sheetData.totalQuestions,
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
  // Get all questions that belong to this sheet
  const questions = await getQuestions(sheetName);
  const questionIds = questions.map((q) => q.id);
  
  // Create or update the sheet
  await createOrUpdateSheet({
    name: sheetName,
    questionIds,
    totalQuestions: questionIds.length,
  });
}

