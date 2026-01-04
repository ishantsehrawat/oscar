"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useAllProgress } from "@/features/questions/hooks/useQuestionProgress";
import { QuestionList } from "@/components/sheet/QuestionList";
import { QuestionDetail } from "@/components/sheet/QuestionDetail";
import { CreateQuestionDialog } from "@/components/sheet/CreateQuestionDialog";
import { Loader2, Plus } from "lucide-react";
import {
  updateProgress,
} from "@/features/questions/services/progressService";
import { onAuthChange } from "@/lib/firebase/auth";
import { User as FirebaseUser } from "firebase/auth";
import { useEffect } from "react";
import { QuestionProgress } from "@/types/progress";
import { createQuestion } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";
import { useSheet } from "@/contexts/SheetContext";

export default function SheetPage() {
  const { selectedSheet } = useSheet();
  const { questions, loading: questionsLoading, refetch: refetchQuestions } = useQuestions(selectedSheet || undefined);
  const { progress, loading: progressLoading, refetch: refetchProgress } = useAllProgress();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return unsubscribe;
  }, []);

  const progressMap = useMemo(() => {
    const map = new Map();
    progress.forEach((p) => map.set(p.questionId, p));
    return map;
  }, [progress]);

  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId) return null;
    return questions.find((q) => q.id === selectedQuestionId) || null;
  }, [questions, selectedQuestionId]);

  const selectedProgress = selectedQuestionId
    ? progressMap.get(selectedQuestionId)
    : undefined;

  const handleMarkDone = useCallback(async (questionId: string) => {
    const existing = progressMap.get(questionId);
    const now = new Date();
    const newProgress: QuestionProgress = {
      questionId,
      status: "completed",
      attempts: (existing?.attempts || 0) + 1,
      lastPracticedAt: now,
      markedForRevision: false,
      completedAt: existing?.completedAt || now,
      updatedAt: now,
    };
    await updateProgress(newProgress, user?.uid || null);
    refetchProgress();
  }, [progressMap, user, refetchProgress]);

  const handleMarkRevision = useCallback(async (questionId: string) => {
    const existing = progressMap.get(questionId);
    const now = new Date();
    const newProgress: QuestionProgress = {
      questionId,
      status: existing?.status || "in_progress",
      attempts: existing?.attempts || 0,
      lastPracticedAt: existing?.lastPracticedAt || now,
      markedForRevision: !existing?.markedForRevision,
      completedAt: existing?.completedAt || null,
      updatedAt: now,
    };
    await updateProgress(newProgress, user?.uid || null);
    refetchProgress();
  }, [progressMap, user, refetchProgress]);

  const handleIncrementAttempt = useCallback(async (questionId: string) => {
    const existing = progressMap.get(questionId);
    const now = new Date();
    const newProgress: QuestionProgress = {
      questionId,
      status: existing?.status || "in_progress",
      attempts: (existing?.attempts || 0) + 1,
      lastPracticedAt: now,
      markedForRevision: existing?.markedForRevision || false,
      completedAt: existing?.completedAt || null,
      updatedAt: now,
    };
    await updateProgress(newProgress, user?.uid || null);
    refetchProgress();
  }, [progressMap, user, refetchProgress]);

  const handleCreateQuestion = useCallback(async (data: {
    title: string;
    topics: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    leetcodeLink: string;
    youtubeLink: string | null;
    order: number;
    sheets: string[];
  }) => {
    await createQuestion({
      title: data.title,
      topics: data.topics,
      difficulty: data.difficulty,
      leetcodeLink: data.leetcodeLink,
      youtubeLink: data.youtubeLink,
      order: data.order,
      sheets: data.sheets,
    });
    refetchQuestions();
  }, [refetchQuestions]);

  const nextOrder = useMemo(() => {
    if (questions.length === 0) return 1;
    return Math.max(...questions.map((q) => q.order || 0)) + 1;
  }, [questions]);

  if (questionsLoading || progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Learning Sheet</h1>
          <p className="text-slate-600">
            Track your progress through coding problems
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </Button>
      </div>

      {selectedSheet && (
        <div className="text-sm text-slate-600">
          {questions.length} question{questions.length !== 1 ? "s" : ""} in this sheet
        </div>
      )}

      <QuestionList
        questions={questions}
        progressMap={progressMap}
        onMarkDone={handleMarkDone}
        onMarkRevision={handleMarkRevision}
        onIncrementAttempt={handleIncrementAttempt}
        onQuestionClick={setSelectedQuestionId}
      />

      <CreateQuestionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateQuestion}
        nextOrder={nextOrder}
        defaultSheet={selectedSheet || "Striver SDE Sheet"}
      />

      {selectedQuestion && selectedQuestionId && (
        <QuestionDetailWrapper
          question={selectedQuestion}
          progress={selectedProgress}
          onClose={() => setSelectedQuestionId(null)}
          onMarkDone={() => handleMarkDone(selectedQuestionId)}
          onMarkRevision={() => handleMarkRevision(selectedQuestionId)}
          onIncrementAttempt={() => handleIncrementAttempt(selectedQuestionId)}
        />
      )}
    </div>
  );
}

function QuestionDetailWrapper({
  question,
  progress,
  onClose,
  onMarkDone,
  onMarkRevision,
  onIncrementAttempt,
}: {
  question: any;
  progress?: any;
  onClose: () => void;
  onMarkDone: () => void;
  onMarkRevision: () => void;
  onIncrementAttempt: () => void;
}) {
  return (
    <QuestionDetail
      question={question}
      progress={progress}
      onClose={onClose}
      onMarkDone={onMarkDone}
      onMarkRevision={onMarkRevision}
      onIncrementAttempt={onIncrementAttempt}
    />
  );
}

