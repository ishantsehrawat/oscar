"use client";

import { Question } from "@/types/question";
import { QuestionProgress } from "@/types/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/dateUtils";
import { ExternalLink, X, BookOpen, Clock } from "lucide-react";

interface QuestionDetailProps {
  question: Question;
  progress?: QuestionProgress;
  onClose: () => void;
  onMarkDone: () => void;
  onMarkRevision: () => void;
  onIncrementAttempt: () => void;
}

export function QuestionDetail({
  question,
  progress,
  onClose,
  onMarkDone,
  onMarkRevision,
  onIncrementAttempt,
}: QuestionDetailProps) {
  const status = progress?.status || "not_started";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex-1">{question.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={question.difficulty === "Easy" ? "success" : question.difficulty === "Medium" ? "warning" : "danger"}>
              {question.difficulty}
            </Badge>
            <span className="text-sm text-slate-600 flex items-center gap-1 flex-wrap">
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
          </div>

          {progress && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <Badge variant={status === "completed" ? "success" : status === "in_progress" ? "warning" : "default"}>
                  {status.replace("_", " ")}
                </Badge>
              </div>
              {progress.attempts > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Attempts</span>
                  <span className="text-sm text-slate-600">{progress.attempts}</span>
                </div>
              )}
              {progress.lastPracticedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last Practiced
                  </span>
                  <span className="text-sm text-slate-600">{formatDate(progress.lastPracticedAt)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {question.leetcodeLink && (
              <a
                href={question.leetcodeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">LeetCode</span>
                <ExternalLink className="w-4 h-4 text-slate-600" />
              </a>
            )}
            {question.youtubeLink && (
              <a
                href={question.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="font-medium text-slate-900">YouTube</span>
                <ExternalLink className="w-4 h-4 text-slate-600" />
              </a>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button
              variant="primary"
              onClick={onMarkDone}
              className="flex-1"
            >
              {status === "completed" ? "Redo Question" : "Mark as Done"}
            </Button>
            <Button
              variant={progress?.markedForRevision ? "secondary" : "ghost"}
              onClick={onMarkRevision}
            >
              {progress?.markedForRevision ? "Remove from Revision" : "Mark for Revision"}
            </Button>
            <Button variant="ghost" onClick={onIncrementAttempt}>
              + Attempt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

