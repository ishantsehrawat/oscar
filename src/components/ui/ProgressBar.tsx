import React from "react";
import { cn } from "@/lib/utils/cn";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-slate-900 h-full transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

