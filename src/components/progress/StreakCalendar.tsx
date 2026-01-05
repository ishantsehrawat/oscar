"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAllDailyProgress } from "@/lib/storage/indexeddb";
import { DailyProgress } from "@/types/dailyProgress";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface StreakCalendarProps {
  streak: number;
}

export function StreakCalendar({ streak }: StreakCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [progressEntries, setProgressEntries] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const entries = await getAllDailyProgress();
      setProgressEntries(entries);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(currentYear, i, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const firstDayOfWeek = getDay(monthStart);
      const paddingStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

      const paddedDays: (Date | null)[] = [];

      // Add padding from previous month
      for (let j = 0; j < paddingStart; j++) {
        paddedDays.push(null);
      }

      // Add actual month days
      days.forEach((day) => paddedDays.push(day));

      // Add padding to end (to make complete weeks)
      const remaining = 7 - (paddedDays.length % 7);
      if (remaining < 7) {
        for (let j = 0; j < remaining; j++) {
          paddedDays.push(null);
        }
      }

      // Group into weeks
      const weeks: (Date | null)[][] = [];
      for (let j = 0; j < paddedDays.length; j += 7) {
        weeks.push(paddedDays.slice(j, j + 7));
      }

      return {
        month: i,
        monthName: format(monthDate, "MMM"),
        weeks,
      };
    });
  }, [currentYear]);

  const getProgressForDate = (date: Date): number => {
    const dateStr = format(date, "yyyy-MM-dd");
    const entry = progressEntries.find((e) => e.date === dateStr);
    return entry?.count || 0;
  };

  const getColorForCount = (count: number): string => {
    // Fire gradient: light yellow/orange to deep red/orange
    // Level 0: No contributions (handled separately)
    // Level 1: 1 question - Light yellow (fire start)
    // Level 2: 2 questions - Orange (fire growing)
    // Level 3: 3 questions - Deep orange (fire hot)
    // Level 4: 4 questions - Red (fire intense)
    // Level 5: 5 questions - Deep red (fire blazing)
    // Level 6: 6+ questions - Darkest red (fire inferno)

    if (count === 0) return ""; // No background color
    if (count === 1) return "#ffed4e"; // Light yellow (fire start)
    if (count === 2) return "#ffa500"; // Orange (fire growing)
    if (count === 3) return "#ff6b35"; // Deep orange (fire hot)
    if (count === 4) return "#e03131"; // Red (fire intense)
    if (count === 5) return "#c92a2a"; // Deep red (fire blazing)
    return "#a61e4d"; // Darkest red (fire inferno - 6+)
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Streak: {streak} days
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentYear(currentYear - 1)}
              className="text-slate-700 hover:text-slate-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 min-w-[80px] text-center">
              {currentYear}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentYear(currentYear + 1)}
              className="text-slate-700 hover:text-slate-900"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {months.map(({ month, monthName, weeks }) => (
              <div key={month} className="space-y-1">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  {monthName}
                </div>
                <div className="space-y-0.5">
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex gap-0.5">
                      {week.map((day, dayIdx) => {
                        if (!day) {
                          return (
                            <div
                              key={`empty-${month}-${weekIdx}-${dayIdx}`}
                              className="w-[16px] h-[16px]"
                            />
                          );
                        }

                        const questionCount = getProgressForDate(day);
                        const hasProgress = questionCount > 0;
                        const isInMonth = isSameMonth(
                          day,
                          new Date(currentYear, month, 1)
                        );
                        const isTodayDate = isToday(day);
                        const bgColor = hasProgress
                          ? getColorForCount(questionCount)
                          : undefined;

                        return (
                          <div
                            key={format(day, "yyyy-MM-dd")}
                            className={cn(
                              "w-[16px] h-[16px] rounded-sm transition-all cursor-pointer",
                              !isInMonth && "opacity-20",
                              isTodayDate && "ring-1 ring-blue-500",
                              !hasProgress && "bg-slate-200"
                            )}
                            style={
                              hasProgress
                                ? { backgroundColor: bgColor }
                                : undefined
                            }
                            title={`${format(
                              day,
                              "MMM d, yyyy"
                            )}: ${questionCount} question${
                              questionCount !== 1 ? "s" : ""
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
