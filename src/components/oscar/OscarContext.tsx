"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { OscarMessage, generateOscarMessage } from "@/constants/oscarMessages";
import { useProgress } from "@/features/progress/hooks/useProgress";
import { isTodaySunday } from "@/lib/utils/dateUtils";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useAllProgress } from "@/features/questions/hooks/useQuestionProgress";

interface OscarContextType {
  messages: OscarMessage[];
  addMessage: (message: OscarMessage) => void;
  dismissMessage: (id: string) => void;
}

const OscarContext = createContext<OscarContextType | undefined>(undefined);

export function OscarProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<OscarMessage[]>([]);
  const { stats } = useProgress();
  const { questions } = useQuestions();
  const { progress } = useAllProgress();

  useEffect(() => {
    // Check for Sunday test
    if (isTodaySunday()) {
      addMessage({
        id: `sunday-${Date.now()}`,
        message: generateOscarMessage("reminder", { isSunday: true }),
        type: "reminder",
        timestamp: new Date(),
      });
    }

    // Check for milestones
    if (stats && stats.completed > 0) {
      if (stats.completed % 10 === 0) {
        addMessage({
          id: `milestone-${Date.now()}`,
          message: generateOscarMessage("milestone", { count: stats.completed }),
          type: "milestone",
          timestamp: new Date(),
        });
      }
    }

    // Check for topic avoidance (simplified: check if no progress in last 7 days)
    // This is a basic implementation - can be enhanced
  }, [stats, questions, progress]);

  const addMessage = (message: OscarMessage) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissMessage(message.id);
    }, 5000);
  };

  const dismissMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <OscarContext.Provider value={{ messages, addMessage, dismissMessage }}>
      {children}
    </OscarContext.Provider>
  );
}

export function useOscar() {
  const context = useContext(OscarContext);
  if (!context) {
    throw new Error("useOscar must be used within OscarProvider");
  }
  return context;
}

