"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useAllProgress } from "@/features/questions/hooks/useQuestionProgress";
import { QuestionList } from "@/components/sheet/QuestionList";
import { QuestionDetail } from "@/components/sheet/QuestionDetail";
import { CreateQuestionDialog } from "@/components/sheet/CreateQuestionDialog";
import { EditQuestionDialog } from "@/components/sheet/EditQuestionDialog";
import { Loader2, Plus } from "lucide-react";
import {
  updateProgress,
} from "@/features/questions/services/progressService";
import { useAuth } from "@/contexts/AuthContext";
import { QuestionProgress } from "@/types/progress";
import { createQuestion, updateQuestion, deleteQuestion } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useSheet } from "@/contexts/SheetContext";
import { Question } from "@/types/question";

export default function SheetPage() {
  const { selectedSheet, availableSheets, refreshSheets } = useSheet();
  const { questions, loading: questionsLoading, refetch: refetchQuestions } = useQuestions(selectedSheet || undefined);
  const { progress, loading: progressLoading, refetch: refetchProgress } = useAllProgress();
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
  }, [progressMap, user?.uid, refetchProgress]);

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
  }, [progressMap, user?.uid, refetchProgress]);

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
  }, [progressMap, user?.uid, refetchProgress]);

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
    await refetchQuestions();
    // Refresh sheets to update counts and available sheets list
    await refreshSheets();
  }, [refetchQuestions, refreshSheets]);

  const handleUpdateQuestion = useCallback(async (data: {
    title: string;
    topics: string[];
    difficulty: "Easy" | "Medium" | "Hard";
    leetcodeLink: string;
    youtubeLink: string | null;
    order: number;
    sheets: string[];
  }) => {
    if (!selectedQuestionId) return;
    await updateQuestion(selectedQuestionId, data);
    await refetchQuestions();
    // Refresh sheets to update counts and available sheets list
    await refreshSheets();
    setEditDialogOpen(false);
  }, [selectedQuestionId, refetchQuestions, refreshSheets]);

  const handleDeleteQuestion = useCallback(async () => {
    if (!selectedQuestionId) return;
    await deleteQuestion(selectedQuestionId);
    await refetchQuestions();
    // Refresh sheets to update counts and available sheets list
    await refreshSheets();
    setDeleteConfirmOpen(false);
    setSelectedQuestionId(null);
  }, [selectedQuestionId, refetchQuestions, refreshSheets]);

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
          onEdit={() => setEditDialogOpen(true)}
          onDelete={() => setDeleteConfirmOpen(true)}
        />
      )}

      <EditQuestionDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        question={selectedQuestion}
        onSubmit={handleUpdateQuestion}
        availableSheets={availableSheets}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Question"
      >
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete "{selectedQuestion?.title}"? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteQuestion}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
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
  onEdit,
  onDelete,
}: {
  question: Question;
  progress?: QuestionProgress;
  onClose: () => void;
  onMarkDone: () => void;
  onMarkRevision: () => void;
  onIncrementAttempt: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <QuestionDetail
      question={question}
      progress={progress}
      onClose={onClose}
      onMarkDone={onMarkDone}
      onMarkRevision={onMarkRevision}
      onIncrementAttempt={onIncrementAttempt}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

