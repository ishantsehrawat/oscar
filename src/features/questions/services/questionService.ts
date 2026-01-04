import { getQuestions, getQuestion } from "@/lib/firebase/firestore";
import { cacheQuestions, getCachedQuestions, getCachedQuestion } from "@/lib/storage/indexeddb";
import { Question } from "@/types/question";

export async function fetchQuestions(sheet?: string | null): Promise<Question[]> {
  try {
    // Try Firestore first
    const questions = await getQuestions(sheet);
    // Cache in IndexedDB
    await cacheQuestions(questions);
    return questions;
  } catch (error) {
    // Fallback to cache
    console.warn("Failed to fetch from Firestore, using cache:", error);
    const cached = await getCachedQuestions();
    // Filter by sheet if specified
    if (sheet) {
      return cached.filter((q) => {
        // Handle both old (sheet) and new (sheets) format
        if (q.sheets && Array.isArray(q.sheets)) {
          return q.sheets.includes(sheet);
        }
        // Fallback for old format
        return (q as any).sheet === sheet;
      });
    }
    return cached;
  }
}

export async function fetchQuestion(id: string): Promise<Question | null> {
  try {
    const question = await getQuestion(id);
    if (question) {
      // Cache it
      await cacheQuestions([question]);
    }
    return question;
  } catch (error) {
    console.warn("Failed to fetch from Firestore, using cache:", error);
    return getCachedQuestion(id) || null;
  }
}

