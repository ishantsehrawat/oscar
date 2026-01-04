"use client";

import { useState, useMemo } from "react";
import { Question } from "@/types/question";
import { QuestionProgress } from "@/types/progress";
import { QuestionCard } from "./QuestionCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TOPICS } from "@/constants/topics";
import { Search, Filter } from "lucide-react";

function QuestionCardWrapper(props: any) {
  return <QuestionCard {...props} />;
}

interface QuestionListProps {
  questions: Question[];
  progressMap: Map<string, QuestionProgress>;
  onMarkDone: (questionId: string) => void;
  onMarkRevision: (questionId: string) => void;
  onIncrementAttempt: (questionId: string) => void;
  onQuestionClick: (questionId: string) => void;
}

export function QuestionList({
  questions,
  progressMap,
  onMarkDone,
  onMarkRevision,
  onIncrementAttempt,
  onQuestionClick,
}: QuestionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      // Search
      if (
        searchQuery &&
        !question.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Topic filter - check if any topic in the array matches
      if (selectedTopic !== "all" && !question.topics.includes(selectedTopic)) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all") {
        const progress = progressMap.get(question.id);
        const status = progress?.status || "not_started";
        if (status !== selectedStatus) {
          return false;
        }
      }

      // Difficulty filter
      if (selectedDifficulty !== "all" && question.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [questions, progressMap, searchQuery, selectedTopic, selectedStatus, selectedDifficulty]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter className="w-4 h-4" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2"
          />

          <Select
            label="Topic"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            options={[
              { value: "all", label: "All Topics" },
              ...TOPICS.map((topic) => ({ value: topic, label: topic })),
            ]}
          />

          <Select
            label="Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "all", label: "All Status" },
              { value: "not_started", label: "Not Started" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ]}
          />

          <Select
            label="Difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            options={[
              { value: "all", label: "All Difficulties" },
              { value: "Easy", label: "Easy" },
              { value: "Medium", label: "Medium" },
              { value: "Hard", label: "Hard" },
            ]}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-600">
        Showing {filteredQuestions.length} of {questions.length} questions
      </div>

      {/* Question list */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No questions found matching your filters.</p>
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const questionProgress = progressMap.get(question.id);
            return (
              <QuestionCardWrapper
                key={question.id}
                question={question}
                progress={questionProgress}
                onMarkDone={() => onMarkDone(question.id)}
                onMarkRevision={() => onMarkRevision(question.id)}
                onIncrementAttempt={() => onIncrementAttempt(question.id)}
                onClick={() => onQuestionClick(question.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

