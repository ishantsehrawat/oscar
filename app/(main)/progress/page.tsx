"use client";

import { useProgress } from "@/features/progress/hooks/useProgress";
import { ProgressOverview } from "@/components/progress/ProgressOverview";
import { TopicProgress } from "@/components/progress/TopicProgress";
import { Loader2 } from "lucide-react";
import { useSheet } from "@/contexts/SheetContext";

export default function ProgressPage() {
  const { selectedSheet } = useSheet();
  const { stats, loading, sheet } = useProgress(selectedSheet || undefined);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Progress</h1>
        <p className="text-slate-600">Track your learning journey</p>
      </div>

      {sheet && (
        <div className="text-sm text-slate-600">
          {sheet.totalQuestions} total questions in {sheet.name}
        </div>
      )}

      {!selectedSheet && (
        <div className="text-sm text-slate-600">
          Showing progress for all questions
        </div>
      )}

      <ProgressOverview stats={stats} />
      <TopicProgress stats={stats} />
    </div>
  );
}

