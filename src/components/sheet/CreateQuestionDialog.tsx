"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TOPICS } from "@/constants/topics";
import { Difficulty } from "@/types/question";
import { Plus, X } from "lucide-react";

interface CreateQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    topics: string[];
    difficulty: Difficulty;
    leetcodeLink: string;
    youtubeLink: string | null;
    order: number;
    sheets: string[];
  }) => Promise<void>;
  nextOrder?: number;
  defaultSheet?: string;
}

export function CreateQuestionDialog({
  open,
  onClose,
  onSubmit,
  nextOrder = 1,
  defaultSheet = "Striver SDE Sheet",
}: CreateQuestionDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([defaultSheet]);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [leetcodeLink, setLeetcodeLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [order, setOrder] = useState(nextOrder);
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleAddCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics((prev) => [...prev, customTopic.trim()]);
      setCustomTopic("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setSelectedTopics((prev) => prev.filter((t) => t !== topic));
  };

  const handleSheetToggle = (sheetName: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetName)
        ? prev.filter((s) => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const handleRemoveSheet = (sheetName: string) => {
    setSelectedSheets((prev) => prev.filter((s) => s !== sheetName));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (selectedTopics.length === 0) {
      newErrors.topics = "At least one topic is required";
    }

    if (selectedSheets.length === 0) {
      newErrors.sheets = "At least one sheet is required";
    }

    if (!leetcodeLink.trim()) {
      newErrors.leetcodeLink = "LeetCode link is required";
    } else if (
      !leetcodeLink.includes("leetcode.com") &&
      !leetcodeLink.includes("leetcode.cn")
    ) {
      newErrors.leetcodeLink = "Please enter a valid LeetCode URL";
    }

    if (youtubeLink.trim() && !youtubeLink.includes("youtu")) {
      newErrors.youtubeLink = "Please enter a valid YouTube URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        topics: selectedTopics,
        difficulty,
        leetcodeLink: leetcodeLink.trim(),
        youtubeLink: youtubeLink.trim() || null,
        order,
        sheets: selectedSheets,
      });

      // Reset form
      setTitle("");
      setSelectedTopics([]);
      setSelectedSheets([defaultSheet]);
      setDifficulty("Easy");
      setLeetcodeLink("");
      setYoutubeLink("");
      setOrder(nextOrder);
      setCustomTopic("");
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error creating question:", error);
      setErrors({ submit: "Failed to create question. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add New Question" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Question Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Two Sum"
          error={errors.title}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Sheets * {selectedSheets.length > 0 && `(${selectedSheets.length} selected)`}
          </label>
          
          {/* Selected sheets as chips */}
          {selectedSheets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedSheets.map((sheetName) => (
                <span
                  key={sheetName}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-sm"
                >
                  {sheetName}
                  <button
                    type="button"
                    onClick={() => handleRemoveSheet(sheetName)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Sheet checkboxes */}
          <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedSheets.includes("Striver SDE Sheet")}
                onChange={() => handleSheetToggle("Striver SDE Sheet")}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 focus:ring-2"
              />
              <span className="text-sm text-slate-700">Striver SDE Sheet</span>
            </label>
          </div>

          {errors.sheets && (
            <p className="mt-1 text-sm text-red-600">{errors.sheets}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Topics * {selectedTopics.length > 0 && `(${selectedTopics.length} selected)`}
          </label>
          
          {/* Selected topics as chips */}
          {selectedTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTopics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Topic checkboxes */}
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
            {TOPICS.map((topic) => (
              <label
                key={topic}
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedTopics.includes(topic)}
                  onChange={() => handleTopicToggle(topic)}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 focus:ring-2"
                />
                <span className="text-sm text-slate-700">{topic}</span>
              </label>
            ))}
          </div>

          {/* Custom topic input */}
          <div className="mt-3 flex gap-2">
            <Input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Add custom topic"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTopic();
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddCustomTopic}
              disabled={!customTopic.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {errors.topics && (
            <p className="mt-1 text-sm text-red-600">{errors.topics}</p>
          )}
        </div>

        <Select
          label="Difficulty *"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          options={[
            { value: "Easy", label: "Easy" },
            { value: "Medium", label: "Medium" },
            { value: "Hard", label: "Hard" },
          ]}
          required
        />

        <Input
          label="LeetCode Link *"
          type="url"
          value={leetcodeLink}
          onChange={(e) => setLeetcodeLink(e.target.value)}
          placeholder="https://leetcode.com/problems/two-sum/"
          error={errors.leetcodeLink}
          required
        />

        <Input
          label="YouTube Link (optional)"
          type="url"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          error={errors.youtubeLink}
        />

        <Input
          label="Order"
          type="number"
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value) || nextOrder)}
          min={1}
        />

        {errors.submit && (
          <p className="text-sm text-red-600">{errors.submit}</p>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? "Creating..." : "Create Question"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

