"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { NumberInput } from "@/components/ui/NumberInput";
import { Input } from "@/components/ui/Input";
import { calculateCompletionDate, compareProgress } from "@/lib/utils/calculator";
import { ProgressCalendar } from "@/components/calculator/ProgressCalendar";
import { EnhancedResultCard } from "@/components/calculator/EnhancedResultCard";
import { getAllDailyProgress } from "@/lib/storage/indexeddb";
import { 
  saveCalculatorSettings,
  getCalculatorSettings,
} from "@/features/calculator/services/calculatorSettingsService";
import { DailyProgress } from "@/types/dailyProgress";
import { CalculatorSettings } from "@/types/calculatorSettings";
import { Calculator, Edit2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useSheet } from "@/contexts/SheetContext";
import { useProgress } from "@/features/progress/hooks/useProgress";
import { useAuth } from "@/contexts/AuthContext";

export default function CalculatorPage() {
  const { selectedSheet } = useSheet();
  const { sheet } = useProgress(selectedSheet || undefined);
  
  // Use sheet total if sheet is selected, otherwise use custom total
  const sheetTotal = sheet?.totalQuestions || 0;
  const [customTotalQuestions, setCustomTotalQuestions] = useState(191);
  const totalQuestions = selectedSheet && sheetTotal > 0 ? sheetTotal : customTotalQuestions;
  
  const [questionsPerWeekday, setQuestionsPerWeekday] = useState(0);
  const [extraQuestionsToday, setExtraQuestionsToday] = useState(0);
  const [extraQuestionsWeekend, setExtraQuestionsWeekend] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    // Default to today in YYYY-MM-DD format (local timezone)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Load settings and daily progress on mount
  useEffect(() => {
    loadSettings();
    loadProgress();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCalculatorSettings();
      if (settings) {
        setCustomTotalQuestions(settings.totalQuestions);
        setQuestionsPerWeekday(settings.questionsPerWeekday);
        setExtraQuestionsToday(settings.extraQuestionsToday);
        setExtraQuestionsWeekend(settings.extraQuestionsWeekend);
        setStartDate(settings.startDate);
      }
    } catch (error) {
      console.error("Error loading calculator settings:", error);
    } finally {
      setSettingsLoaded(true);
    }
  };

  // Save settings whenever they change (with debounce)
  useEffect(() => {
    if (!settingsLoaded) return; // Don't save on initial load

    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 500); // Debounce: save 500ms after last change

    return () => clearTimeout(timeoutId);
  }, [
    customTotalQuestions,
    questionsPerWeekday,
    extraQuestionsToday,
    extraQuestionsWeekend,
    startDate,
    settingsLoaded,
  ]);

  const { user } = useAuth();

  const saveSettings = async () => {
    try {
      const settings: CalculatorSettings = {
        id: "default",
        totalQuestions: customTotalQuestions,
        questionsPerWeekday,
        extraQuestionsToday,
        extraQuestionsWeekend,
        startDate,
        updatedAt: new Date(),
      };
      await saveCalculatorSettings(settings, user?.uid || null);
    } catch (error) {
      console.error("Error saving calculator settings:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const entries = await getAllDailyProgress();
      setDailyProgress(entries);
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const handleProgressChange = () => {
    loadProgress();
    // Don't increment progressKey - it causes full calendar re-render
    // The calendar component handles its own state updates
  };

  // Calculate planned result
  const plannedResult = useMemo(() => {
    const start = new Date(startDate);
    return calculateCompletionDate({
      totalQuestions,
      questionsPerWeekday,
      extraQuestionsToday,
      extraQuestionsWeekend,
      startDate: start,
    });
  }, [totalQuestions, questionsPerWeekday, extraQuestionsToday, extraQuestionsWeekend, startDate]);

  // Calculate comparison
  const comparison = useMemo(() => {
    const start = new Date(startDate);
    return compareProgress(
      plannedResult,
      totalQuestions,
      start,
      dailyProgress,
      questionsPerWeekday,
      extraQuestionsWeekend
    );
  }, [plannedResult, totalQuestions, startDate, dailyProgress, questionsPerWeekday, extraQuestionsWeekend]);

  const startDateObj = useMemo(() => new Date(startDate), [startDate]);

  // Check if goal is set (has a valid daily pace)
  const isGoalSet = questionsPerWeekday > 0 && settingsLoaded;

  const handleSaveGoal = () => {
    if (questionsPerWeekday > 0) {
      setIsEditingGoal(false);
    }
  };

  const handleOpenEdit = () => {
    setIsEditingGoal(true);
  };

  const handleCloseEdit = () => {
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Progress Tracker
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {isGoalSet
              ? "Track your daily progress and stay on target"
              : "Set your goal to get started"}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleOpenEdit}
          className="flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          {isGoalSet ? "Edit Goal" : "Set Goal"}
        </Button>
      </div>

      {/* Main Content - Side by side layout */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Results (Compact) */}
        <div className="lg:col-span-1">
          <EnhancedResultCard comparison={comparison} totalQuestions={totalQuestions} />
        </div>

        {/* Right: Calendar (Takes 2/3 of space) */}
        <div className="lg:col-span-2">
          <ProgressCalendar
            startDate={startDateObj}
            endDate={plannedResult.endDate}
            actualEndDate={comparison.actualEndDate}
            questionsPerWeekday={questionsPerWeekday}
            extraQuestionsWeekend={extraQuestionsWeekend}
            onProgressChange={handleProgressChange}
          />
        </div>
      </div>

      {/* Goal Setting Dialog */}
      <Dialog
        open={isEditingGoal || (!isGoalSet && settingsLoaded)}
        onClose={handleCloseEdit}
        title={isGoalSet ? "Edit Your Goal" : "Set Your Goal"}
      >
        <div className="space-y-4">
          <div>
            <NumberInput
              label="Total Questions"
              value={totalQuestions}
              onChange={setCustomTotalQuestions}
              min={1}
              placeholder="191"
              disabled={!!(selectedSheet && sheetTotal > 0)}
            />
            {selectedSheet && sheetTotal > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Using total from {selectedSheet}
              </p>
            )}
          </div>

          <NumberInput
            label="Questions Solved Per Weekday"
            value={questionsPerWeekday}
            onChange={setQuestionsPerWeekday}
            min={0}
            step={0.5}
            required
            placeholder="e.g., 3"
          />

          <NumberInput
            label="Extra Questions on Weekends"
            value={extraQuestionsWeekend}
            onChange={setExtraQuestionsWeekend}
            min={0}
            step={0.5}
            placeholder="0"
          />

          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveGoal} className="flex-1">
              {isGoalSet ? "Save Changes" : "Set Goal"}
            </Button>
            {isGoalSet && (
              <Button variant="ghost" onClick={handleCloseEdit}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Dialog>

    </div>
  );
}
