"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
} from "lucide-react";
import { ProgressComparison } from "@/lib/utils/calculator";
import { cn } from "@/lib/utils/cn";

interface EnhancedResultCardProps {
  comparison: ProgressComparison;
  totalQuestions: number;
}

export function EnhancedResultCard({
  comparison,
  totalQuestions,
}: EnhancedResultCardProps) {
  const {
    plannedEndDateFormatted,
    plannedDays,
    actualEndDateFormatted,
    actualDays,
    daysAhead,
    questionsCompleted,
    questionsRemaining,
    daysLeftToPlanned,
    daysLeftToActual,
  } = comparison;

  const isAhead = daysAhead !== null && daysAhead > 0;
  const isBehind = daysAhead !== null && daysAhead < 0;
  const isOnTrack = daysAhead !== null && daysAhead === 0;

  return (
    <div className="space-y-3">
      {/* Planned Goal - Compact */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4" />
            Planned Goal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">End Date</span>
            <span className="text-base font-bold text-slate-900">
              {plannedEndDateFormatted}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{plannedDays} days</span>
            <span className="text-slate-600">
              {daysLeftToPlanned} remaining
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actual Progress - Compact */}
      {actualDays !== null && (
        <Card
          className={cn(
            "border-2",
            isAhead && "bg-green-50 border-green-300",
            isBehind && "bg-red-50 border-red-300",
            isOnTrack && "bg-blue-50 border-blue-300"
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {isAhead && <TrendingUp className="w-4 h-4 text-green-600" />}
              {isBehind && <TrendingDown className="w-4 h-4 text-red-600" />}
              {isOnTrack && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              Actual Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Projected</span>
              <span className="text-base font-bold text-slate-900">
                {actualEndDateFormatted}
              </span>
            </div>
            {daysAhead !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {daysLeftToActual !== null
                    ? `${daysLeftToActual} days left`
                    : ""}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    isAhead && "text-green-600",
                    isBehind && "text-red-600",
                    isOnTrack && "text-blue-600"
                  )}
                >
                  {isAhead && `+${Math.abs(daysAhead)} ahead`}
                  {isBehind && `-${Math.abs(daysAhead)} behind`}
                  {isOnTrack && "On track"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Stats - Compact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Completed</span>
            <span className="text-base font-bold text-slate-900">
              {questionsCompleted}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {questionsRemaining} remaining
            </span>
            <span className="text-slate-600">
              {totalQuestions > 0
                ? `${Math.round((questionsCompleted / totalQuestions) * 100)}%`
                : "0%"}
            </span>
          </div>
          {questionsCompleted > 0 && (
            <div className="pt-1">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (questionsCompleted / totalQuestions) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
