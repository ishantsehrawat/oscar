"use client";

import { useState, useEffect, useCallback } from "react";
import {
  updateProgress,
  getProgressForQuestion,
  getAllUserProgress,
} from "../services/progressService";
import { QuestionProgress, getProficiencyLevel } from "@/types/progress";
import { onAuthChange } from "@/lib/firebase/auth";
import { User as FirebaseUser } from "firebase/auth";

export function useQuestionProgress(questionId: string) {
  const [progress, setProgress] = useState<QuestionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    loadProgress();
    return unsubscribe;
  }, [questionId]);

  async function loadProgress() {
    try {
      const data = await getProgressForQuestion(questionId);
      setProgress(data || null);
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoading(false);
    }
  }

  const markAsDone = useCallback(async () => {
    const now = new Date();
    const newProgress: QuestionProgress = {
      questionId,
      status: "completed",
      attempts: (progress?.attempts || 0) + 1,
      lastPracticedAt: now,
      markedForRevision: false,
      completedAt: progress?.completedAt || now,
      updatedAt: now,
    };

    await updateProgress(newProgress, user?.uid || null);
    setProgress(newProgress);
  }, [questionId, progress, user]);

  const markForRevision = useCallback(async () => {
    const now = new Date();
    const newProgress: QuestionProgress = {
      questionId,
      status: progress?.status || "in_progress",
      attempts: progress?.attempts || 0,
      lastPracticedAt: progress?.lastPracticedAt || now,
      markedForRevision: !progress?.markedForRevision,
      completedAt: progress?.completedAt || null,
      updatedAt: now,
    };

    await updateProgress(newProgress, user?.uid || null);
    setProgress(newProgress);
  }, [questionId, progress, user]);

  const incrementAttempt = useCallback(async () => {
    const now = new Date();
    const newProgress: QuestionProgress = {
      questionId,
      status: progress?.status || "in_progress",
      attempts: (progress?.attempts || 0) + 1,
      lastPracticedAt: now,
      markedForRevision: progress?.markedForRevision || false,
      completedAt: progress?.completedAt || null,
      updatedAt: now,
    };

    await updateProgress(newProgress, user?.uid || null);
    setProgress(newProgress);
  }, [questionId, progress, user]);

  const proficiency = progress ? getProficiencyLevel(progress.attempts) : null;

  return {
    progress,
    loading,
    proficiency,
    markAsDone,
    markForRevision,
    incrementAttempt,
    refetch: loadProgress,
  };
}

export function useAllProgress() {
  const [progress, setProgress] = useState<QuestionProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      const data = await getAllUserProgress();
      setProgress(data);
    } catch (error) {
      console.error("Failed to load progress:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    progress,
    loading,
    refetch: loadProgress,
  };
}

