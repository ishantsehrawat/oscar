"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SheetContextType {
  selectedSheet: string | null; // null means "none" (all questions)
  setSelectedSheet: (sheet: string | null) => void;
  availableSheets: string[];
  setAvailableSheets: (sheets: string[]) => void;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

const STORAGE_KEY = "oscar-selected-sheet";

export function SheetProvider({ children }: { children: ReactNode }) {
  const [selectedSheet, setSelectedSheetState] = useState<string | null>(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || null; // null means "none" (all questions)
    }
    return null;
  });

  const [availableSheets, setAvailableSheets] = useState<string[]>([]);

  // Persist to localStorage when selection changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedSheet === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, selectedSheet);
      }
    }
  }, [selectedSheet]);

  const setSelectedSheet = (sheet: string | null) => {
    setSelectedSheetState(sheet);
  };

  return (
    <SheetContext.Provider
      value={{
        selectedSheet,
        setSelectedSheet,
        availableSheets,
        setAvailableSheets,
      }}
    >
      {children}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error("useSheet must be used within SheetProvider");
  }
  return context;
}

