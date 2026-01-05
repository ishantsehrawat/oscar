"use client";

import { useState, useEffect } from "react";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useAllProgress } from "@/features/questions/hooks/useQuestionProgress";
import { calculateProgressStats } from "../services/progressService";
import { ProgressStats } from "@/types/progress";
import { getSheet } from "@/lib/firebase/firestore";
import { Sheet } from "@/types/sheet";
import { getCachedSheet } from "@/lib/storage/indexeddb";

export function useProgress(sheetName?: string | null) {
  const { questions, loading: questionsLoading } = useQuestions(sheetName);
  const { progress, loading: progressLoading } = useAllProgress();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  const [stats, setStats] = useState<ProgressStats | null>(null);

  useEffect(() => {
    if (sheetName) {
      setSheetLoading(true);

      // Try to get from cache first for faster loading
      getCachedSheet(sheetName)
        .then((cachedSheet) => {
          if (cachedSheet) {
            setSheet(cachedSheet);
            setSheetLoading(false);
          }
        })
        .catch(() => {
          // Ignore cache errors, continue to Firestore
        });

      // Then get from Firestore (will update cache)
      getSheet(sheetName)
        .then((sheetData) => {
          if (sheetData) {
            setSheet(sheetData);
          } else if (sheetName === "Striver SDE Sheet") {
            // Default sheet if not found
            const defaultSheet: Sheet = {
              id: "default",
              name: "Striver SDE Sheet",
              questionIds: [],
              totalQuestions: 191,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setSheet(defaultSheet);
            // Cache the default sheet
            const { cacheSheet } = require("@/lib/storage/indexeddb");
            cacheSheet(defaultSheet).catch(() => {});
          }
        })
        .catch((error) => {
          console.error("Failed to load sheet:", error);
          // Set default for Striver SDE Sheet
          if (sheetName === "Striver SDE Sheet") {
            const defaultSheet: Sheet = {
              id: "default",
              name: "Striver SDE Sheet",
              questionIds: [],
              totalQuestions: 191,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setSheet(defaultSheet);
          }
        })
        .finally(() => {
          setSheetLoading(false);
        });
    } else {
      setSheet(null);
    }
  }, [sheetName]);

  useEffect(() => {
    if (!questionsLoading && !progressLoading && !sheetLoading) {
      // Filter questions and progress to only include questions from the selected sheet
      let filteredQuestions = questions;
      let filteredProgress = progress;

      if (sheet && sheet.questionIds.length > 0) {
        // Filter questions by sheet questionIds
        filteredQuestions = questions.filter((q) =>
          sheet.questionIds.includes(q.id)
        );
        // Filter progress to only include questions from the selected sheet
        filteredProgress = progress.filter((p) =>
          sheet.questionIds.includes(p.questionId)
        );
      }

      // Use sheet total if available, otherwise use filtered questions length
      // For Striver SDE Sheet, default to 191 if sheet not loaded yet
      let total = sheet?.totalQuestions ?? filteredQuestions.length;
      if (sheetName === "Striver SDE Sheet" && total === 0 && !sheet) {
        total = 191; // Default total for Striver SDE Sheet
      }

      // Always calculate stats, even if total is 0 (will show 0/191)
      const calculatedStats = calculateProgressStats(
        filteredQuestions,
        filteredProgress,
        total
      );
      setStats(calculatedStats);
    }
  }, [
    questions,
    progress,
    questionsLoading,
    progressLoading,
    sheetLoading,
    sheet,
  ]);

  return {
    stats,
    loading: questionsLoading || progressLoading || sheetLoading,
    questions,
    progress,
    sheet,
  };
}
