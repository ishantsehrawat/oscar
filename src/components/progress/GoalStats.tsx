"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCalculatorSettings } from "@/lib/storage/indexeddb";
import { getAllDailyProgress } from "@/lib/storage/indexeddb";
import { CalculatorSettings } from "@/types/calculatorSettings";
import { format, differenceInDays } from "date-fns";
import { Target, Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { 
  calculateCompletionDate, 
  calculateCompletionDateFromProgress,
  compareProgress 
} from "@/lib/utils/calculator";

export function GoalStats() {
  const [settings, setSettings] = useState<CalculatorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<{
    projectedEndDate: Date | null;
    originalEndDate: Date | null;
    overshootDays: number | null;
    daysLeft: number | null;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      calculateDates();
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      const data = await getCalculatorSettings();
      setSettings(data || null);
    } catch (error) {
      console.error("Error loading calculator settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDates = async () => {
    if (!settings || settings.questionsPerWeekday === 0) return;

    try {
      const dailyProgress = await getAllDailyProgress();
      const startDate = new Date(settings.startDate + "T00:00:00");

      // Calculate original (planned) end date
      const plannedResult = calculateCompletionDate({
        totalQuestions: settings.totalQuestions,
        questionsPerWeekday: settings.questionsPerWeekday,
        extraQuestionsToday: settings.extraQuestionsToday,
        extraQuestionsWeekend: settings.extraQuestionsWeekend,
        startDate,
      });

      // Calculate projected (actual) end date based on progress
      const projectedResult = calculateCompletionDateFromProgress(
        settings.totalQuestions,
        startDate,
        dailyProgress,
        settings.questionsPerWeekday,
        settings.extraQuestionsWeekend
      );

      const today = new Date();
      const overshootDays = projectedResult
        ? differenceInDays(projectedResult.endDate, plannedResult.endDate)
        : null;
      const daysLeft = projectedResult
        ? Math.max(0, differenceInDays(projectedResult.endDate, today))
        : null;

      setComparison({
        projectedEndDate: projectedResult?.endDate || null,
        originalEndDate: plannedResult.endDate,
        overshootDays,
        daysLeft,
      });
    } catch (error) {
      console.error("Error calculating dates:", error);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!settings || settings.questionsPerWeekday === 0) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-slate-500">
            <Target className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">No goal set yet</p>
            <p className="text-xs text-slate-400 mt-1">Set a goal in the Calculator page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Calculating...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Your Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Total Questions</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{settings.totalQuestions}</span>
          </div>

          {/* Projected End Date */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Projected End Date</span>
            </div>
            <span className="text-sm font-semibold text-green-700">
              {comparison.projectedEndDate
                ? format(comparison.projectedEndDate, "MMM d, yyyy")
                : "Not enough data"}
            </span>
          </div>

          {/* Original End Date */}
          {comparison.originalEndDate && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Original End Date</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {format(comparison.originalEndDate, "MMM d, yyyy")}
              </span>
            </div>
          )}

          {/* Schedule Difference */}
          {comparison.overshootDays !== null && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Schedule Difference</span>
              </div>
              <span
                className={`text-sm font-semibold ${
                  comparison.overshootDays > 0
                    ? "text-red-600"
                    : comparison.overshootDays < 0
                    ? "text-green-600"
                    : "text-slate-900"
                }`}
              >
                {comparison.overshootDays > 0
                  ? `+${comparison.overshootDays} days`
                  : comparison.overshootDays < 0
                  ? `${comparison.overshootDays} days`
                  : "On track"}
              </span>
            </div>
          )}

          {/* Days Left */}
          {comparison.daysLeft !== null && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Days Left</span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {comparison.daysLeft} days
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

