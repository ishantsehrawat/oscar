"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useAllProgress } from "@/features/questions/hooks/useQuestionProgress";
import { generateTest, createTest } from "../services/testService";
import { Test, TestConfig } from "@/types/test";
import { Question } from "@/types/question";
import { onAuthChange } from "@/lib/firebase/auth";
import { User as FirebaseUser } from "firebase/auth";
import { isTodaySunday } from "@/lib/utils/dateUtils";
import { useSheet } from "@/contexts/SheetContext";

export function useTest() {
  const { selectedSheet } = useSheet();
  const { questions } = useQuestions(selectedSheet);
  const { progress } = useAllProgress();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return unsubscribe;
  }, []);

  const generateNewTest = useCallback(
    (config: TestConfig): Question[] => {
      return generateTest(questions, progress, config);
    },
    [questions, progress]
  );

  const saveTest = useCallback(
    async (testQuestions: Question[], config: TestConfig): Promise<void> => {
      const test: Test = {
        id: `test-${Date.now()}`,
        createdAt: new Date(),
        questions: testQuestions.map((q) => q.id),
        config,
      };

      await createTest(test, user?.uid || null);
      setCurrentTest(test);
    },
    [user]
  );

  const canGenerateTest = isTodaySunday();

  return {
    currentTest,
    generateNewTest,
    saveTest,
    canGenerateTest,
    questions,
    progress,
  };
}

