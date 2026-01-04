"use client";

import { useState } from "react";
import { TestConfig, getDefaultTestConfig } from "@/types/test";
import { Question } from "@/types/question";
import { TestConfigPanel } from "./TestConfig";
import { TestView } from "./TestView";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertCircle } from "lucide-react";

interface TestGeneratorProps {
  questions: Question[];
  completedQuestionIds: string[];
  onGenerate: (config: TestConfig) => Question[];
  onSaveTest: (testQuestions: Question[], config: TestConfig) => Promise<void>;
  canGenerate: boolean;
}

export function TestGenerator({
  questions,
  completedQuestionIds,
  onGenerate,
  onSaveTest,
  canGenerate,
}: TestGeneratorProps) {
  const [config, setConfig] = useState<TestConfig>(getDefaultTestConfig());
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const handleGenerate = () => {
    const testQuestions = onGenerate(config);
    setGeneratedQuestions(testQuestions);
  };

  const handleSaveResults = async (results: { questionId: string; markedWeak: boolean }[]) => {
    setSaving(true);
    try {
      await onSaveTest(generatedQuestions, config);
      // Reset after save
      setGeneratedQuestions([]);
      setConfig(getDefaultTestConfig());
    } catch (error) {
      console.error("Failed to save test:", error);
    } finally {
      setSaving(false);
    }
  };

  if (generatedQuestions.length > 0) {
    // Show test view
    return (
      <TestView
        test={{
          id: `test-${Date.now()}`,
          createdAt: new Date(),
          questions: generatedQuestions.map((q) => q.id),
          config,
          results: [],
        }}
        questions={generatedQuestions}
        onSaveResults={handleSaveResults}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!canGenerate && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">
                Tests can only be generated on Sundays.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <TestConfigPanel
        config={config}
        onChange={setConfig}
        questions={questions}
        completedQuestionIds={completedQuestionIds}
      />

      <Button
        variant="primary"
        onClick={handleGenerate}
        disabled={!canGenerate || saving}
        className="w-full"
      >
        Generate Test
      </Button>
    </div>
  );
}

