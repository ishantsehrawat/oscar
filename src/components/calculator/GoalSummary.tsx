"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Target, Edit2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface GoalSummaryProps {
  totalQuestions: number;
  questionsPerWeekday: number;
  extraQuestionsWeekend: number;
  startDate: string;
  onEdit: () => void;
}

export function GoalSummary({
  totalQuestions,
  questionsPerWeekday,
  extraQuestionsWeekend,
  startDate,
  onEdit,
}: GoalSummaryProps) {
  const formattedStartDate = format(new Date(startDate + "T00:00:00"), "MMM d, yyyy");

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Your Goal
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-500">Total Questions</span>
            <p className="text-lg font-semibold text-slate-900">{totalQuestions}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Daily Pace (Weekdays)</span>
            <p className="text-lg font-semibold text-slate-900">
              {questionsPerWeekday} / day
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Weekend Extra</span>
            <p className="text-lg font-semibold text-slate-900">
              +{extraQuestionsWeekend} / day
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Start Date</span>
            <p className="text-lg font-semibold text-slate-900 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formattedStartDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

