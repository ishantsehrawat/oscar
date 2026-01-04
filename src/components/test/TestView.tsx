"use client";

import { Test } from "@/types/test";
import { Question } from "@/types/question";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, Save } from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/lib/utils/dateUtils";

interface TestViewProps {
  test: Test;
  questions: Question[];
  onSaveResults: (results: { questionId: string; markedWeak: boolean }[]) => void;
}

export function TestView({ test, questions, onSaveResults }: TestViewProps) {
  const [results, setResults] = useState<Map<string, boolean>>(
    new Map(
      test.results?.map((r) => [r.questionId, r.markedWeak]) ||
        test.questions.map((id) => [id, false])
    )
  );

  const testQuestions = questions.filter((q) => test.questions.includes(q.id));

  const handleToggleWeak = (questionId: string) => {
    setResults((prev) => {
      const next = new Map(prev);
      next.set(questionId, !next.get(questionId));
      return next;
    });
  };

  const handleSave = () => {
    const resultsArray = Array.from(results.entries()).map(([questionId, markedWeak]) => ({
      questionId,
      markedWeak,
    }));
    onSaveResults(resultsArray);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sunday Test</CardTitle>
            <span className="text-sm text-slate-600">
              {formatDateTime(test.createdAt)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testQuestions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No questions in this test.
              </p>
            ) : (
              testQuestions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    checked={results.get(question.id) || false}
                    onChange={() => handleToggleWeak(question.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900">{question.title}</h4>
                      <Badge
                        variant={
                          question.difficulty === "Easy"
                            ? "success"
                            : question.difficulty === "Medium"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {question.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      {question.leetcodeLink && (
                        <a
                          href={question.leetcodeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-slate-900"
                        >
                          LeetCode <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {question.youtubeLink && (
                        <a
                          href={question.youtubeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-slate-900"
                        >
                          YouTube <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <Button variant="primary" onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Results
            </Button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Mark questions you found difficult as "weak" for revision.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

