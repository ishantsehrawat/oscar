"use client";

import { useState, useEffect } from "react";
import { fetchQuestions, fetchQuestion } from "../services/questionService";
import { Question } from "@/types/question";

export function useQuestions(sheet?: string | null) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [sheet]);

  async function loadQuestions() {
    try {
      setLoading(true);
      const data = await fetchQuestions(sheet);
      setQuestions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load questions"));
    } finally {
      setLoading(false);
    }
  }

  return {
    questions,
    loading,
    error,
    refetch: loadQuestions,
  };
}

export function useQuestion(id: string) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id]);

  async function loadQuestion() {
    try {
      setLoading(true);
      const data = await fetchQuestion(id);
      setQuestion(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load question"));
    } finally {
      setLoading(false);
    }
  }

  return {
    question,
    loading,
    error,
    refetch: loadQuestion,
  };
}

