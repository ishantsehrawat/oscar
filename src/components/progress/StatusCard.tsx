"use client";

import { ProgressStats } from "@/types/progress";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Clock, Circle } from "lucide-react";

interface StatusCardProps {
  stats: ProgressStats;
}

export function StatusCard({ stats }: StatusCardProps) {
  const statuses = [
    {
      key: "completed" as const,
      label: "Completed",
      count: stats.completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      key: "inProgress" as const,
      label: "In Progress",
      count: stats.inProgress,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      key: "notStarted" as const,
      label: "Not Started",
      count: stats.notStarted,
      icon: Circle,
      color: "text-slate-400",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
    },
  ];

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {statuses.map((status) => {
            const Icon = status.icon;
            const percentage = stats.total > 0 ? (status.count / stats.total) * 100 : 0;

            return (
              <div
                key={status.key}
                className={`p-4 rounded-lg border-2 ${status.bgColor} ${status.borderColor} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status.bgColor}`}>
                      <Icon className={`w-5 h-5 ${status.color}`} />
                    </div>
                    <span className="font-medium text-slate-700">{status.label}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${status.color}`}>
                      {status.count}
                    </div>
                    <div className="text-xs text-slate-500">
                      {Math.round(percentage)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      status.key === "completed"
                        ? "bg-green-600"
                        : status.key === "inProgress"
                        ? "bg-yellow-600"
                        : "bg-slate-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

