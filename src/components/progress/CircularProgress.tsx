"use client";

import { useState, useEffect, useRef } from "react";
import { ProgressStats } from "@/types/progress";
import { Card, CardContent } from "@/components/ui/Card";

interface CircularProgressProps {
  stats: ProgressStats;
}

export function CircularProgress({ stats }: CircularProgressProps) {
  const size = 200;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate totals
  const easyTotal = stats.byDifficulty.easy.total;
  const mediumTotal = stats.byDifficulty.medium.total;
  const hardTotal = stats.byDifficulty.hard.total;
  const markedTotal = easyTotal + mediumTotal + hardTotal;
  const unmarkedTotal = Math.max(0, stats.total - markedTotal);

  // Calculate completed
  const easyCompleted = stats.byDifficulty.easy.completed;
  const mediumCompleted = stats.byDifficulty.medium.completed;
  const hardCompleted = stats.byDifficulty.hard.completed;

  // Calculate percentages of total for each segment
  const easyPercentage = stats.total > 0 ? (easyTotal / stats.total) * 100 : 0;
  const mediumPercentage =
    stats.total > 0 ? (mediumTotal / stats.total) * 100 : 0;
  const hardPercentage = stats.total > 0 ? (hardTotal / stats.total) * 100 : 0;
  const unmarkedPercentage =
    stats.total > 0 ? (unmarkedTotal / stats.total) * 100 : 0;

  // Calculate arc lengths for each segment
  const easyArcLength = (easyPercentage / 100) * circumference;
  const mediumArcLength = (mediumPercentage / 100) * circumference;
  const hardArcLength = (hardPercentage / 100) * circumference;
  const unmarkedArcLength = (unmarkedPercentage / 100) * circumference;

  // Calculate completion within each segment
  const easyCompletion = easyTotal > 0 ? (easyCompleted / easyTotal) * 100 : 0;
  const mediumCompletion =
    mediumTotal > 0 ? (mediumCompleted / mediumTotal) * 100 : 0;
  const hardCompletion = hardTotal > 0 ? (hardCompleted / hardTotal) * 100 : 0;

  // Calculate filled arc lengths
  const easyFilledLength = (easyCompletion / 100) * easyArcLength;
  const mediumFilledLength = (mediumCompletion / 100) * mediumArcLength;
  const hardFilledLength = (hardCompletion / 100) * hardArcLength;

  // Calculate starting angles (in degrees, starting from top)
  // Ensure segments connect seamlessly without gaps or overlaps
  let currentAngle = -90; // Start from top

  const easyStartAngle = currentAngle;
  const easyEndAngle = easyStartAngle + (easyPercentage / 100) * 360;
  currentAngle = easyEndAngle;

  const mediumStartAngle = currentAngle;
  const mediumEndAngle = mediumStartAngle + (mediumPercentage / 100) * 360;
  currentAngle = mediumEndAngle;

  const hardStartAngle = currentAngle;
  const hardEndAngle = hardStartAngle + (hardPercentage / 100) * 360;
  currentAngle = hardEndAngle;

  const unmarkedStartAngle = currentAngle;
  const unmarkedEndAngle =
    unmarkedStartAngle + (unmarkedPercentage / 100) * 360;

  // Helper function to convert degrees to radians
  const degToRad = (deg: number) => (deg * Math.PI) / 180;

  // Helper function to get point on circle
  const getPoint = (angle: number) => {
    const rad = degToRad(angle);
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  // Helper function to create arc path
  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = getPoint(startAngle);
    const end = getPoint(endAngle);
    // Normalize angles to handle wrapping
    let normalizedStart = ((startAngle % 360) + 360) % 360;
    let normalizedEnd = ((endAngle % 360) + 360) % 360;

    // Ensure we go in the positive direction
    if (normalizedEnd < normalizedStart) {
      normalizedEnd += 360;
    }

    const angleDiff = normalizedEnd - normalizedStart;
    const largeArc = angleDiff > 180 ? 1 : 0;
    const sweepFlag = 1; // Always sweep in positive direction

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}`;
  };

  // Create filled paths (completed portions) - ensure they don't exceed segment boundaries
  const easySegmentSpan = easyEndAngle - easyStartAngle;
  const mediumSegmentSpan = mediumEndAngle - mediumStartAngle;
  const hardSegmentSpan = hardEndAngle - hardStartAngle;

  const easyFilledEndAngle =
    easyStartAngle + (easyCompletion / 100) * easySegmentSpan;
  const mediumFilledEndAngle =
    mediumStartAngle + (mediumCompletion / 100) * mediumSegmentSpan;
  const hardFilledEndAngle =
    hardStartAngle + (hardCompletion / 100) * hardSegmentSpan;

  // Calculate arc lengths for animation
  const easyArcLengthForAnim = easyArcLength;
  const mediumArcLengthForAnim = mediumArcLength;
  const hardArcLengthForAnim = hardArcLength;

  const difficulties = [
    {
      key: "easy" as const,
      label: "Easy",
      color: "#10b981",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      total: easyTotal,
      completed: easyCompleted,
      startAngle: easyStartAngle,
      endAngle: easyEndAngle,
      filledEndAngle: easyFilledEndAngle,
    },
    {
      key: "medium" as const,
      label: "Medium",
      color: "#eab308",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      total: mediumTotal,
      completed: mediumCompleted,
      startAngle: mediumStartAngle,
      endAngle: mediumEndAngle,
      filledEndAngle: mediumFilledEndAngle,
    },
    {
      key: "hard" as const,
      label: "Hard",
      color: "#ef4444",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      total: hardTotal,
      completed: hardCompleted,
      startAngle: hardStartAngle,
      endAngle: hardEndAngle,
      filledEndAngle: hardFilledEndAngle,
    },
  ];

  const [isHovered, setIsHovered] = useState(false);
  const easyPathRef = useRef<SVGPathElement>(null);
  const mediumPathRef = useRef<SVGPathElement>(null);
  const hardPathRef = useRef<SVGPathElement>(null);
  const overallCircleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    // Only animate when not hovered (showing difficulty segments)
    if (isHovered) return;

    // Reset to initial state first, then animate
    if (easyPathRef.current && easyTotal > 0 && easyCompleted > 0) {
      easyPathRef.current.style.strokeDashoffset = `${easyArcLengthForAnim}px`;
    }
    if (mediumPathRef.current && mediumTotal > 0 && mediumCompleted > 0) {
      mediumPathRef.current.style.strokeDashoffset = `${mediumArcLengthForAnim}px`;
    }
    if (hardPathRef.current && hardTotal > 0 && hardCompleted > 0) {
      hardPathRef.current.style.strokeDashoffset = `${hardArcLengthForAnim}px`;
    }

    // Trigger animation by setting the final offset after a small delay
    const timer = setTimeout(() => {
      if (easyPathRef.current && easyTotal > 0 && easyCompleted > 0) {
        const finalOffset =
          easyArcLengthForAnim - (easyCompletion / 100) * easyArcLengthForAnim;
        easyPathRef.current.style.strokeDashoffset = `${finalOffset}px`;
      }
      if (mediumPathRef.current && mediumTotal > 0 && mediumCompleted > 0) {
        const finalOffset =
          mediumArcLengthForAnim -
          (mediumCompletion / 100) * mediumArcLengthForAnim;
        mediumPathRef.current.style.strokeDashoffset = `${finalOffset}px`;
      }
      if (hardPathRef.current && hardTotal > 0 && hardCompleted > 0) {
        const finalOffset =
          hardArcLengthForAnim - (hardCompletion / 100) * hardArcLengthForAnim;
        hardPathRef.current.style.strokeDashoffset = `${finalOffset}px`;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [
    isHovered,
    easyTotal,
    easyCompleted,
    mediumTotal,
    mediumCompleted,
    hardTotal,
    hardCompleted,
    easyArcLengthForAnim,
    mediumArcLengthForAnim,
    hardArcLengthForAnim,
    easyCompletion,
    mediumCompletion,
    hardCompletion,
  ]);

  useEffect(() => {
    // Handle hover animation for overall circle
    if (overallCircleRef.current && isHovered) {
      const timer = setTimeout(() => {
        if (overallCircleRef.current) {
          const finalOffset =
            circumference - (stats.completionPercentage / 100) * circumference;
          overallCircleRef.current.style.strokeDashoffset = `${finalOffset}px`;
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (overallCircleRef.current && !isHovered) {
      // Reset when not hovered
      overallCircleRef.current.style.strokeDashoffset = `${circumference}px`;
    }
  }, [isHovered, stats.completionPercentage, circumference]);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Single Segmented Circle */}
          <div className="flex flex-col items-center">
            <div
              className="relative"
              style={{ width: size, height: size }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  fill="none"
                  className="text-slate-200"
                />

                {/* Show difficulty segments when not hovered, completion when hovered */}
                {!isHovered ? (
                  <>
                    {/* Easy segment background */}
                    {easyTotal > 0 && (
                      <path
                        d={createArcPath(easyStartAngle, easyEndAngle)}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-green-100"
                        strokeLinecap="butt"
                      />
                    )}

                    {/* Medium segment background */}
                    {mediumTotal > 0 && (
                      <path
                        d={createArcPath(mediumStartAngle, mediumEndAngle)}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-yellow-100"
                        strokeLinecap="butt"
                      />
                    )}

                    {/* Hard segment background */}
                    {hardTotal > 0 && (
                      <path
                        d={createArcPath(hardStartAngle, hardEndAngle)}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-red-100"
                        strokeLinecap="butt"
                      />
                    )}

                    {/* Unmarked segment (blue) */}
                    {unmarkedTotal > 0 && (
                      <path
                        d={createArcPath(unmarkedStartAngle, unmarkedEndAngle)}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-blue-200"
                        strokeLinecap="butt"
                      />
                    )}

                    {/* Easy filled (completed) */}
                    {easyTotal > 0 && easyCompleted > 0 && (
                      <path
                        ref={easyPathRef}
                        d={createArcPath(easyStartAngle, easyFilledEndAngle)}
                        stroke="#10b981"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: easyArcLengthForAnim,
                          strokeDashoffset: easyArcLengthForAnim,
                          transition: "stroke-dashoffset 0.8s ease-out",
                        }}
                      />
                    )}

                    {/* Medium filled (completed) */}
                    {mediumTotal > 0 && mediumCompleted > 0 && (
                      <path
                        ref={mediumPathRef}
                        d={createArcPath(
                          mediumStartAngle,
                          mediumFilledEndAngle
                        )}
                        stroke="#eab308"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: mediumArcLengthForAnim,
                          strokeDashoffset: mediumArcLengthForAnim,
                          transition: "stroke-dashoffset 0.8s ease-out 0.1s",
                        }}
                      />
                    )}

                    {/* Hard filled (completed) */}
                    {hardTotal > 0 && hardCompleted > 0 && (
                      <path
                        ref={hardPathRef}
                        d={createArcPath(hardStartAngle, hardFilledEndAngle)}
                        stroke="#ef4444"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: hardArcLengthForAnim,
                          strokeDashoffset: hardArcLengthForAnim,
                          transition: "stroke-dashoffset 0.8s ease-out 0.2s",
                        }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* Overall completion circle when hovered */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke="currentColor"
                      strokeWidth={strokeWidth}
                      fill="none"
                      className="text-slate-200"
                    />
                    <circle
                      ref={overallCircleRef}
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke="#3b82f6"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference}
                      strokeLinecap="round"
                      style={{
                        transition: "stroke-dashoffset 0.8s ease-out",
                      }}
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-slate-900">
                  {stats.completed}/{stats.total}
                </div>
                <div className="text-sm text-slate-600">
                  {Math.round(stats.completionPercentage)}%
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {isHovered ? "Overall Progress" : "By Difficulty"}
            </p>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {isHovered ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Completed</span>
                  <span className="text-slate-700">
                    {stats.completed} / {stats.total}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    In Progress
                  </span>
                  <span className="text-slate-700">{stats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Not Started
                  </span>
                  <span className="text-slate-700">{stats.notStarted}</span>
                </div>
              </>
            ) : (
              <>
                {/* Overall Progress */}
                <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-200">
                  <span className="font-medium text-slate-700">Overall</span>
                  <span className="text-slate-700">
                    {stats.completed} / {stats.total}
                  </span>
                </div>
                {difficulties.map(
                  ({ key, label, color, textColor, total, completed }) => {
                    if (total === 0) return null;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                          <span className={`font-medium ${textColor}`}>
                            {label}
                          </span>
                        </div>
                        <span className="text-slate-700">
                          {completed} / {total}
                        </span>
                      </div>
                    );
                  }
                )}
                {unmarkedTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-400" />
                      <span className="font-medium text-blue-600">
                        Unmarked
                      </span>
                    </div>
                    <span className="text-slate-700">0 / {unmarkedTotal}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
