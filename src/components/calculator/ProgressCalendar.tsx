"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getAllDailyProgress } from "@/lib/storage/indexeddb";
import { saveDailyProgress } from "@/features/dailyProgress/services/dailyProgressService";
import { DailyProgress } from "@/types/dailyProgress";
import { useAuth } from "@/contexts/AuthContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
  addMonths,
  subMonths,
  parseISO,
  getDay,
  isWeekend,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { QuestionSelectionDialog } from "./QuestionSelectionDialog";

interface ProgressCalendarProps {
  startDate: Date;
  endDate: Date;
  actualEndDate: Date | null;
  questionsPerWeekday: number;
  extraQuestionsWeekend: number;
  onProgressChange?: () => void;
}

export function ProgressCalendar({
  startDate,
  endDate,
  actualEndDate,
  questionsPerWeekday,
  extraQuestionsWeekend,
  onProgressChange,
}: ProgressCalendarProps) {
  // Calculate the maximum end date (planned vs actual, whichever is greater)
  const maxEndDate = useMemo(() => {
    if (!actualEndDate) return endDate;
    return actualEndDate > endDate ? actualEndDate : endDate;
  }, [endDate, actualEndDate]);

  // Initialize current month to start date, or today if within range
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    const start = startOfMonth(startDate);
    // Calculate max end date inline for initialization
    const calculatedMaxEnd = actualEndDate && actualEndDate > endDate ? actualEndDate : endDate;
    const end = startOfMonth(calculatedMaxEnd);
    const todayMonth = startOfMonth(today);
    
    // If today is within range, use today's month, otherwise use start month
    if (todayMonth >= start && todayMonth <= end) {
      return today;
    }
    return startDate;
  });
  const [progressEntries, setProgressEntries] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if month navigation should be disabled
  const canNavigateToMonth = (month: Date): boolean => {
    const monthStart = startOfMonth(month);
    const goalStart = startOfMonth(startDate);
    const goalEnd = startOfMonth(maxEndDate);
    
    // Check if the month is within the goal period
    return monthStart >= goalStart && monthStart <= goalEnd;
  };

  // Load progress entries
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const entries = await getAllDailyProgress();
      setProgressEntries(entries);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  const handleUpdateProgress = async (date: string, delta: number) => {
    const existing = progressEntries.find((e) => e.date === date);
    const now = new Date();
    const newCount = Math.max(0, (existing?.count || 0) + delta);

    const progress: DailyProgress = {
      date,
      count: newCount,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await saveDailyProgress(progress, user?.uid || null);
      // Update local state immediately without full reload to prevent re-render
      setProgressEntries((prev) => {
        const filtered = prev.filter((e) => e.date !== date);
        return [...filtered, progress];
      });
      onProgressChange?.();
    } catch (error) {
      console.error("Error saving progress:", error);
      // Reload on error
      await loadProgress();
    }
  };

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days from previous/next month to fill the grid
    const firstDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.
    const paddingStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday = 0
    
    const paddedDays: (Date | null)[] = [];
    
    // Add padding from previous month
    for (let i = 0; i < paddingStart; i++) {
      paddedDays.push(null);
    }
    
    // Add actual month days
    days.forEach(day => paddedDays.push(day));
    
    // Add padding to end (to make 7-day weeks)
    const remaining = 7 - (paddedDays.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        paddedDays.push(null);
      }
    }
    
    return paddedDays;
  }, [currentMonth]);

  const getProgressForDate = (date: Date): number => {
    const dateStr = format(date, "yyyy-MM-dd");
    return progressEntries.find((e) => e.date === dateStr)?.count || 0;
  };

  const getProgressEntryForDate = (date: Date): DailyProgress | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return progressEntries.find((e) => e.date === dateStr);
  };

  const handleDayClick = (date: Date) => {
    if (!isDateEditable(date)) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const count = getProgressForDate(date);
    // Only open dialog if there are questions to select
    if (count > 0) {
      setSelectedDate(dateStr);
      setIsDialogOpen(true);
    }
  };

  const handleSaveQuestions = async (questionIds: string[]) => {
    if (!selectedDate) return;

    const existing = getProgressEntryForDate(parseISO(selectedDate));
    const now = new Date();

    const progress: DailyProgress = {
      date: selectedDate,
      count: existing?.count || questionIds.length,
      questionIds: questionIds,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await saveDailyProgress(progress, user?.uid || null);
      // Update local state
      setProgressEntries((prev) => {
        const filtered = prev.filter((e) => e.date !== selectedDate);
        return [...filtered, progress];
      });
      onProgressChange?.();
    } catch (error) {
      console.error("Error saving questions:", error);
      await loadProgress();
    }
  };

  const getDailyGoal = (date: Date): number => {
    if (isWeekend(date)) {
      return questionsPerWeekday + extraQuestionsWeekend;
    }
    return questionsPerWeekday;
  };

  const getGoalStatus = (date: Date, count: number): "met" | "exceeded" | "not-met" | null => {
    const goal = getDailyGoal(date);
    if (goal === 0) return null; // No goal set
    if (count > goal) return "exceeded";
    if (count === goal) return "met";
    return "not-met";
  };

  const isDateInRange = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    const startStr = format(startDate, "yyyy-MM-dd");
    return dateStr >= startStr;
  };

  const isDateEditable = (date: Date): boolean => {
    // Can only edit dates within the goal period (start date to max end date)
    // and only today or past dates
    const today = startOfDay(new Date());
    const dateToCheck = startOfDay(date);
    const maxEndDateCheck = startOfDay(maxEndDate);
    return (
      dateToCheck <= today &&
      dateToCheck <= maxEndDateCheck &&
      isDateInRange(date)
    );
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              disabled={!canNavigateToMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              disabled={!canNavigateToMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] sm:text-xs font-medium text-slate-500 py-1 sm:py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dateStr = format(day, "yyyy-MM-dd");
                const count = getProgressForDate(day);
                const isInRange = isDateInRange(day);
                const isEditable = isDateEditable(day);
                const isTodayDate = isToday(day);
                // Only show goal status for editable dates (past/today)
                const goalStatus = isEditable ? getGoalStatus(day, count) : null;

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "aspect-square border rounded-lg p-1 sm:p-2 flex flex-col relative overflow-hidden",
                      !isInRange && "opacity-40",
                      isTodayDate && "border-2 border-blue-500",
                      // Only apply colors for editable dates
                      isEditable && goalStatus === "met" && "bg-yellow-50 border-yellow-300",
                      isEditable && goalStatus === "exceeded" && "bg-green-50 border-green-300",
                      isEditable && goalStatus === "not-met" && "bg-red-50 border-red-300",
                      isEditable && "cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                    )}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* Date on top center */}
                    <div
                      className={cn(
                        "text-[10px] sm:text-xs font-medium text-center mb-0.5 sm:mb-1",
                        isTodayDate && "text-blue-600 font-bold"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    
                    {/* Content area with buttons and count - only for editable dates */}
                    {isEditable ? (
                      <div className="flex-1 flex items-center justify-center gap-0 sm:gap-0.5 sm:gap-1 min-w-0 w-full">
                        {/* Subtract button on left */}
                        <button
                          type="button"
                          className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0 flex-shrink-0 flex items-center justify-center min-w-0 rounded hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateProgress(dateStr, -1);
                          }}
                          disabled={count === 0}
                        >
                          <Minus className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                        </button>
                        
                        {/* Question count in center - clickable to open dialog */}
                        <div 
                          className="flex-1 text-center min-w-0 px-0.5 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayClick(day);
                          }}
                        >
                          <div className="text-[10px] sm:text-xs md:text-base font-bold text-slate-900 truncate">
                            {count}
                          </div>
                        </div>
                        
                        {/* Add button on right */}
                        <button
                          type="button"
                          className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0 flex-shrink-0 flex items-center justify-center min-w-0 rounded hover:bg-slate-100 active:bg-slate-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateProgress(dateStr, 1);
                          }}
                        >
                          <Plus className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-4 text-xs text-slate-600 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 rounded" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border rounded bg-yellow-50 border-yellow-300" />
                <span>Goal met</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border rounded bg-green-50 border-green-300" />
                <span>Above goal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border rounded bg-red-50 border-red-300" />
                <span>Below goal</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Question Selection Dialog */}
      {selectedDate && (
        <QuestionSelectionDialog
          open={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedDate(null);
          }}
          date={selectedDate}
          maxQuestions={getProgressForDate(parseISO(selectedDate)) || 0}
          selectedQuestionIds={getProgressEntryForDate(parseISO(selectedDate))?.questionIds || []}
          onSave={handleSaveQuestions}
        />
      )}
    </Card>
  );
}

