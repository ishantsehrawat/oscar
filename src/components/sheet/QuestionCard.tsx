"use client";

import { Question } from "@/types/question";
import { QuestionProgress, getProficiencyLevel } from "@/types/progress";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/dateUtils";
import { ExternalLink, CheckCircle2, Circle, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QuestionCardProps {
  question: Question;
  progress?: QuestionProgress;
  onMarkDone?: () => void;
  onMarkRevision?: () => void;
  onIncrementAttempt?: () => void;
  onClick?: () => void;
}

export function QuestionCard({
  question,
  progress,
  onMarkDone,
  onMarkRevision,
  onIncrementAttempt,
  onClick,
}: QuestionCardProps) {
  const status = progress?.status || "not_started";
  const proficiency = progress ? getProficiencyLevel(progress.attempts) : null;

  const difficultyColors = {
    Easy: "success",
    Medium: "warning",
    Hard: "danger",
  } as const;

  const proficiencyColors = {
    beginner: "info",
    intermediate: "warning",
    proficient: "success",
  } as const;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer",
        status === "completed" && "border-green-200 bg-green-50/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 truncate">{question.title}</h3>
              <Badge variant={difficultyColors[question.difficulty]}>
                {question.difficulty}
              </Badge>
              {proficiency && (
                <Badge variant={proficiencyColors[proficiency] as any}>
                  {proficiency}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
              <span className="flex items-center gap-1 flex-wrap">
                <BookOpen className="w-4 h-4" />
                {question.topics.length > 0 ? (
                  question.topics.map((topic, idx) => (
                    <span key={idx} className="inline-flex items-center">
                      {topic}
                      {idx < question.topics.length - 1 && <span className="mx-1">/</span>}
                    </span>
                  ))
                ) : (
                  <span>No topics</span>
                )}
              </span>
              {progress?.lastPracticedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(progress.lastPracticedAt)}
                </span>
              )}
              {progress && progress.attempts > 0 && (
                <span className="text-slate-500">
                  {progress.attempts} {progress.attempts === 1 ? "attempt" : "attempts"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {question.leetcodeLink && (
                <a
                  href={question.leetcodeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  LeetCode <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {question.youtubeLink && (
                <a
                  href={question.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  YouTube <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : status === "in_progress" ? (
              <Clock className="w-5 h-5 text-yellow-600" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300" />
            )}
          </div>
        </div>

        {(onMarkDone || onMarkRevision || onIncrementAttempt) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
            {onMarkDone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkDone();
                }}
                className="text-xs"
              >
                {status === "completed" ? "Redo" : "Mark Done"}
              </Button>
            )}
            {onMarkRevision && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRevision();
                }}
                className={cn(
                  "text-xs",
                  progress?.markedForRevision && "bg-yellow-50 text-yellow-700"
                )}
              >
                {progress?.markedForRevision ? "Remove Revision" : "Mark Revision"}
              </Button>
            )}
            {onIncrementAttempt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrementAttempt();
                }}
                className="text-xs"
              >
                + Attempt
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

