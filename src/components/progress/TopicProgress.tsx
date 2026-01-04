"use client";

import { ProgressStats } from "@/types/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BookOpen } from "lucide-react";

interface TopicProgressProps {
  stats: ProgressStats;
}

export function TopicProgress({ stats }: TopicProgressProps) {
  const topics = Object.entries(stats.byTopic).sort((a, b) => {
    const aPercentage = a[1].total > 0 ? (a[1].completed / a[1].total) * 100 : 0;
    const bPercentage = b[1].total > 0 ? (b[1].completed / b[1].total) * 100 : 0;
    return bPercentage - aPercentage;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No topics available</p>
        ) : (
          topics.map(([topic, data]) => {
            const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
            return (
              <div key={topic}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">
                      {data.completed} / {data.total}
                    </span>
                    <span className="text-xs text-slate-500">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>
                <ProgressBar value={percentage} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

