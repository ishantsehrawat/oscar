"use client";

import { TestConfig, TestSource } from "@/types/test";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { TOPICS } from "@/constants/topics";
import { Question } from "@/types/question";

interface TestConfigProps {
  config: TestConfig;
  onChange: (config: TestConfig) => void;
  questions: Question[];
  completedQuestionIds: string[];
}

export function TestConfigPanel({
  config,
  onChange,
  questions,
  completedQuestionIds,
}: TestConfigProps) {
  const handleSourceChange = (source: TestSource) => {
    onChange({
      ...config,
      source,
      topics: source === "topics" ? config.topics : undefined,
      questionIds: source === "custom" ? config.questionIds : undefined,
    });
  };

  const handleTopicToggle = (topic: string) => {
    const currentTopics = config.topics || [];
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter((t) => t !== topic)
      : [...currentTopics, topic];
    onChange({ ...config, topics: newTopics });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          label="Question Source"
          value={config.source}
          onChange={(e) => handleSourceChange(e.target.value as TestSource)}
          options={[
            { value: "all", label: "All Questions" },
            { value: "completed", label: "Completed Questions Only" },
            { value: "topics", label: "By Topics" },
            { value: "custom", label: "Custom Selection" },
          ]}
        />

        <Input
          label="Number of Questions"
          type="number"
          min="1"
          max="50"
          value={config.count}
          onChange={(e) =>
            onChange({ ...config, count: parseInt(e.target.value) || 10 })
          }
        />

        {config.source === "topics" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Topics
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg">
              {TOPICS.map((topic) => (
                <Checkbox
                  key={topic}
                  label={topic}
                  checked={config.topics?.includes(topic) || false}
                  onChange={(e) => handleTopicToggle(topic)}
                />
              ))}
            </div>
          </div>
        )}

        {config.source === "completed" && (
          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            You have {completedQuestionIds.length} completed questions available.
          </div>
        )}

        {config.source === "custom" && (
          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            Custom selection feature coming soon. For now, use topic-based selection.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

