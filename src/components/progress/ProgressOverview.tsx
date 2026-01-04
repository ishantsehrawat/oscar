"use client";

import { ProgressStats } from "@/types/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Clock, Circle, Flame } from "lucide-react";

interface ProgressOverviewProps {
  stats: ProgressStats;
}

export function ProgressOverview({ stats }: ProgressOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-slate-900">
                {stats.completed} / {stats.total}
              </span>
              <span className="text-lg text-slate-600">
                {Math.round(stats.completionPercentage)}%
              </span>
            </div>
            <ProgressBar value={stats.completionPercentage} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.completed}
                </span>
              </div>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.inProgress}
                </span>
              </div>
              <p className="text-sm text-slate-600">In Progress</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Circle className="w-5 h-5 text-slate-300" />
                <span className="text-2xl font-semibold text-slate-900">
                  {stats.notStarted}
                </span>
              </div>
              <p className="text-sm text-slate-600">Not Started</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak */}
      {stats.streak > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.streak}</div>
                <div className="text-sm text-slate-600">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>By Difficulty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["easy", "medium", "hard"] as const).map((difficulty) => {
            const data = stats.byDifficulty[difficulty];
            const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
            return (
              <div key={difficulty}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {difficulty}
                    </span>
                    <Badge variant="default">
                      {data.completed} / {data.total}
                    </Badge>
                  </div>
                  <span className="text-sm text-slate-600">
                    {Math.round(percentage)}%
                  </span>
                </div>
                <ProgressBar value={percentage} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

