import { saveTest, getTest, getAllTests } from "@/lib/storage/indexeddb";
import { saveUserTest, getUserTests } from "@/lib/firebase/firestore";
import { Test, TestConfig } from "@/types/test";
import { Question } from "@/types/question";
import { QuestionProgress } from "@/types/progress";
import { addToSyncQueue } from "@/features/sync/services/syncQueue";

export function generateTest(
  questions: Question[],
  progressList: QuestionProgress[],
  config: TestConfig
): Question[] {
  let candidateQuestions: Question[] = [];

  const progressMap = new Map(progressList.map((p) => [p.questionId, p]));

  switch (config.source) {
    case "all":
      candidateQuestions = questions;
      break;
    case "completed":
      candidateQuestions = questions.filter((q) => {
        const progress = progressMap.get(q.id);
        return progress?.status === "completed";
      });
      break;
    case "topics":
      if (config.topics && config.topics.length > 0) {
        candidateQuestions = questions.filter((q) => 
          q.topics.some(topic => config.topics!.includes(topic))
        );
      } else {
        candidateQuestions = questions;
      }
      break;
    case "custom":
      if (config.questionIds && config.questionIds.length > 0) {
        candidateQuestions = questions.filter((q) => config.questionIds!.includes(q.id));
      } else {
        candidateQuestions = [];
      }
      break;
  }

  // Shuffle and take N
  const shuffled = [...candidateQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.count);
}

export async function createTest(
  test: Test,
  userId: string | null
): Promise<void> {
  // Always save locally first
  await saveTest(test);

  // If logged in, try to sync
  if (userId) {
    try {
      await saveUserTest(userId, test);
    } catch (error) {
      // Queue for later sync
      console.warn("Failed to sync test, queuing:", error);
      await addToSyncQueue({
        id: `test-${test.id}-${Date.now()}`,
        type: "test",
        action: "create",
        data: test,
        timestamp: new Date(),
      });
    }
  }
}

export async function getTestById(id: string): Promise<Test | undefined> {
  return getTest(id);
}

export async function getAllUserTests(): Promise<Test[]> {
  return getAllTests();
}

export async function loadTestsFromFirestore(userId: string): Promise<Test[]> {
  return getUserTests(userId);
}

