"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { getAllSheets } from "@/lib/firebase/firestore";

interface SheetContextType {
  selectedSheet: string | null; // null means "none" (all questions)
  setSelectedSheet: (sheet: string | null) => void;
  availableSheets: string[];
  setAvailableSheets: (sheets: string[]) => void;
  refreshSheets: () => Promise<void>;
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

  // Load available sheets
  const refreshSheets = useCallback(async () => {
    try {
      const sheets = await getAllSheets();
      const sheetNames = sheets.map((s) => s.name);
      const uniqueSheetNames = Array.from(new Set(sheetNames));
      setAvailableSheets(uniqueSheetNames);
    } catch (error) {
      console.error("Failed to load sheets:", error);
    }
  }, []);

  // Load sheets on mount
  useEffect(() => {
    refreshSheets();
  }, [refreshSheets]);

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
        refreshSheets,
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
