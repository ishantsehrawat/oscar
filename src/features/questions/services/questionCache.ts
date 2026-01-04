import {
  getCachedQuestions,
  getCachedQuestion,
  cacheQuestions,
} from "@/lib/storage/indexeddb";
import { Question } from "@/types/question";

export async function getQuestionsFromCache(): Promise<Question[]> {
  return getCachedQuestions();
}

export async function getQuestionFromCache(id: string): Promise<Question | undefined> {
  return getCachedQuestion(id);
}

export async function updateQuestionsCache(questions: Question[]): Promise<void> {
  await cacheQuestions(questions);
}

