"use client";

import { useProgress } from "@/features/progress/hooks/useProgress";
import { CircularProgress } from "@/components/progress/CircularProgress";
import { ScrollableTopicProgress } from "@/components/progress/ScrollableTopicProgress";
import { StreakCalendar } from "@/components/progress/StreakCalendar";
import { GoalStats } from "@/components/progress/GoalStats";
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

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
        {/* Row 1: Circular Progress - spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <CircularProgress stats={stats} />
        </div>

        {/* Row 2: Streak Calendar - spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <StreakCalendar streak={stats.streak} />
        </div>

        {/* Row 1: Topic Progress - spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <ScrollableTopicProgress stats={stats} />
        </div>

        {/* Row 2: Goal Stats - spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <GoalStats />
        </div>
      </div>
    </div>
  );
}
