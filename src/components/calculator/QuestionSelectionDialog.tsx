"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useSheet } from "@/contexts/SheetContext";
import { Question } from "@/types/question";
import { createQuestion } from "@/lib/firebase/firestore";
import { CreateQuestionDialog } from "@/components/sheet/CreateQuestionDialog";
import { Search, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { updateProgress, getProgressForQuestion } from "@/features/questions/services/progressService";
import { QuestionProgress } from "@/types/progress";
import { useAuth } from "@/contexts/AuthContext";

interface QuestionSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  date: string;
  maxQuestions: number; // Maximum number of questions user did on this day
  selectedQuestionIds: string[];
  onSave: (questionIds: string[]) => Promise<void>;
}

export function QuestionSelectionDialog({
  open,
  onClose,
  date,
  maxQuestions,
  selectedQuestionIds,
  onSave,
}: QuestionSelectionDialogProps) {
  const { selectedSheet } = useSheet();
  const { questions, loading, refetch } = useQuestions(selectedSheet);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedQuestionIds);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Initialize selectedIds when dialog opens or selectedQuestionIds changes
  useEffect(() => {
    if (open) {
      setSelectedIds(selectedQuestionIds);
      setSearchQuery("");
    }
  }, [open, selectedQuestionIds]);

  // Filter questions based on search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.title.toLowerCase().includes(query) ||
        q.topics.some((topic) => topic.toLowerCase().includes(query))
    );
  }, [questions, searchQuery]);

  const handleToggleQuestion = (questionId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        // Check if we've reached the max
        if (prev.length >= maxQuestions) {
          return prev; // Don't add if at max
        }
        return [...prev, questionId];
      }
    });
  };

  const handleCreateQuestion = async (data: {
    title: string;
    topics: string[];
    difficulty: string;
    leetcodeLink: string;
    youtubeLink: string | null;
    order: number;
    sheets: string[];
  }) => {
    try {
      const questionId = await createQuestion({
        title: data.title,
        topics: data.topics,
        difficulty: data.difficulty as "Easy" | "Medium" | "Hard",
        leetcodeLink: data.leetcodeLink,
        youtubeLink: data.youtubeLink,
        order: data.order,
        sheets: data.sheets,
      });

      // Refetch questions to include the newly created one
      await refetch();

      // Add the newly created question to selected list if we haven't reached max
      if (selectedIds.length < maxQuestions) {
        setSelectedIds((prev) => [...prev, questionId]);
      }

      setIsCreatingQuestion(false);
    } catch (error) {
      console.error("Error creating question:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mark all selected questions as completed
      const now = new Date();
      await Promise.all(
        selectedIds.map(async (questionId) => {
          // Check if question already has progress
          const existingProgress = await getProgressForQuestion(questionId);
          const newProgress: QuestionProgress = {
            questionId,
            status: "completed",
            attempts: existingProgress?.status === "completed" 
              ? (existingProgress.attempts + 1) // Increment if already completed
              : (existingProgress?.attempts || 0) + 1, // First completion
            lastPracticedAt: now,
            markedForRevision: false,
            completedAt: existingProgress?.completedAt || now, // Keep original completion date
            updatedAt: now,
          };
          await updateProgress(newProgress, user?.uid || null);
        })
      );
      
      await onSave(selectedIds);
      onClose();
    } catch (error) {
      console.error("Error saving questions:", error);
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestions = useMemo(() => {
    return questions.filter((q) => selectedIds.includes(q.id));
  }, [questions, selectedIds]);

  const remainingSlots = maxQuestions - selectedIds.length;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={`Select Questions for ${new Date(date).toLocaleDateString()}`}
        className="max-w-4xl max-h-[90vh]"
      >
        <div className="space-y-4">
          {/* Header info */}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              You solved <span className="font-semibold text-slate-900">{maxQuestions}</span> question
              {maxQuestions !== 1 ? "s" : ""} on this day
            </div>
            <div>
              <span className="font-semibold text-slate-900">{selectedIds.length}</span> / {maxQuestions} selected
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions by title or topic..."
              className="pl-10"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingQuestion(true)}
              disabled={selectedIds.length >= maxQuestions}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Question
            </Button>
            {selectedIds.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Questions list */}
          <div className="border border-slate-200 rounded-lg max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchQuery ? "No questions found matching your search" : "No questions available"}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQuestions.map((question) => {
                  const isSelected = selectedIds.includes(question.id);
                  const isDisabled = !isSelected && selectedIds.length >= maxQuestions;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => handleToggleQuestion(question.id)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full p-4 text-left hover:bg-slate-50 transition-colors",
                        isSelected && "bg-blue-50 hover:bg-blue-100",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center",
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-slate-300"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-slate-900">{question.title}</h3>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium flex-shrink-0",
                                question.difficulty === "Easy" && "bg-green-100 text-green-700",
                                question.difficulty === "Medium" && "bg-yellow-100 text-yellow-700",
                                question.difficulty === "Hard" && "bg-red-100 text-red-700"
                              )}
                            >
                              {question.difficulty}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {question.topics.slice(0, 3).map((topic) => (
                              <span
                                key={topic}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                              >
                                {topic}
                              </span>
                            ))}
                            {question.topics.length > 3 && (
                              <span className="px-2 py-0.5 text-slate-500 text-xs">
                                +{question.topics.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected questions summary */}
          {selectedQuestions.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Selected Questions ({selectedQuestions.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    <span>{question.title}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleQuestion(question.id)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning if not all slots filled */}
          {selectedIds.length < maxQuestions && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              You have {remainingSlots} remaining slot{remainingSlots !== 1 ? "s" : ""} to fill. You can select
              questions from the list or create new ones.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={saving || selectedIds.length === 0}
            >
              {saving ? "Saving..." : `Save ${selectedIds.length} Question${selectedIds.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Create Question Dialog */}
      <CreateQuestionDialog
        open={isCreatingQuestion}
        onClose={() => setIsCreatingQuestion(false)}
        onSubmit={handleCreateQuestion}
        nextOrder={questions.length + 1}
        defaultSheet={selectedSheet || "Striver SDE Sheet"}
      />
    </>
  );
}

