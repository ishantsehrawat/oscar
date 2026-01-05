"use client";

import { ProgressStats } from "@/types/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BookOpen } from "lucide-react";

interface ScrollableTopicProgressProps {
  stats: ProgressStats;
}

export function ScrollableTopicProgress({ stats }: ScrollableTopicProgressProps) {
  const topics = Object.entries(stats.byTopic).sort((a, b) => {
    const aPercentage = a[1].total > 0 ? (a[1].completed / a[1].total) * 100 : 0;
    const bPercentage = b[1].total > 0 ? (b[1].completed / b[1].total) * 100 : 0;
    return bPercentage - aPercentage;
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Topic Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-2 space-y-4">
          {topics.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No topics available</p>
          ) : (
            topics.map(([topic, data]) => {
              const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
              return (
                <div key={topic} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">
                        {data.completed} / {data.total}
                      </span>
                      <span className="text-xs font-medium text-slate-500 min-w-[40px] text-right">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={percentage} />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

