"use client";

import { useMemo } from "react";
import { useTest } from "@/features/test/hooks/useTest";
import { TestGenerator } from "@/components/test/TestGenerator";
import { Loader2 } from "lucide-react";

export default function TestPage() {
  const { generateNewTest, saveTest, canGenerateTest, questions, progress } = useTest();

  const completedQuestionIds = useMemo(() => {
    return progress
      .filter((p) => p.status === "completed")
      .map((p) => p.questionId);
  }, [progress]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sunday Test</h1>
        <p className="text-slate-600">
          Generate a test from your completed questions
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <TestGenerator
          questions={questions}
          completedQuestionIds={completedQuestionIds}
          onGenerate={generateNewTest}
          onSaveTest={saveTest}
          canGenerate={canGenerateTest}
        />
      )}
    </div>
  );
}

