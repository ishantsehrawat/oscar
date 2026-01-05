"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthChange, loginWithGoogle, logout as firebaseLogout } from "@/lib/firebase/auth";
import { 
  getUserProgress, 
  batchSaveUserProgress,
  getUserDailyProgress,
  batchSaveUserDailyProgress,
  getUserCalculatorSettings,
  saveUserCalculatorSettings,
} from "@/lib/firebase/firestore";
import { 
  getAllProgress, 
  saveProgress,
  getAllDailyProgress,
  saveDailyProgress,
  getCalculatorSettings,
  saveCalculatorSettings,
} from "@/lib/storage/indexeddb";
import { QuestionProgress } from "@/types/progress";
import { DailyProgress } from "@/types/dailyProgress";
import { CalculatorSettings } from "@/types/calculatorSettings";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  syncProgressOnLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  const syncProgressOnLogin = useCallback(async (userId: string) => {
    try {
      // Get local progress from IndexedDB
      const localProgress = await getAllProgress();
      
      // Get cloud progress from Firestore
      const cloudProgress = await getUserProgress(userId);

      // Create maps for easy lookup
      const localMap = new Map<string, QuestionProgress>();
      localProgress.forEach((p) => localMap.set(p.questionId, p));

      const cloudMap = new Map<string, QuestionProgress>();
      cloudProgress.forEach((p) => cloudMap.set(p.questionId, p));

      // Merge strategy: keep the most recent progress for each question
      const mergedProgress: QuestionProgress[] = [];
      const allQuestionIds = new Set([
        ...localMap.keys(),
        ...cloudMap.keys(),
      ]);

      for (const questionId of allQuestionIds) {
        const local = localMap.get(questionId);
        const cloud = cloudMap.get(questionId);

        if (!local && cloud) {
          // Only in cloud - use cloud
          mergedProgress.push(cloud);
          await saveProgress(cloud); // Save to local
        } else if (local && !cloud) {
          // Only in local - upload to cloud
          mergedProgress.push(local);
        } else if (local && cloud) {
          // In both - use the one with the most recent updatedAt
          const merged = 
            new Date(local.updatedAt) > new Date(cloud.updatedAt)
              ? local
              : cloud;
          mergedProgress.push(merged);
          
          // Update local if cloud is newer
          if (new Date(cloud.updatedAt) > new Date(local.updatedAt)) {
            await saveProgress(cloud);
          }
        }
      }

      // Upload all merged progress to cloud
      if (mergedProgress.length > 0) {
        await batchSaveUserProgress(userId, mergedProgress);
      }

      // Sync daily progress
      const localDailyProgress = await getAllDailyProgress();
      const cloudDailyProgress = await getUserDailyProgress(userId);

      const localDailyMap = new Map<string, DailyProgress>();
      localDailyProgress.forEach((p) => localDailyMap.set(p.date, p));

      const cloudDailyMap = new Map<string, DailyProgress>();
      cloudDailyProgress.forEach((p) => cloudDailyMap.set(p.date, p));

      const mergedDailyProgress: DailyProgress[] = [];
      const allDates = new Set([
        ...localDailyMap.keys(),
        ...cloudDailyMap.keys(),
      ]);

      for (const date of allDates) {
        const local = localDailyMap.get(date);
        const cloud = cloudDailyMap.get(date);

        if (!local && cloud) {
          mergedDailyProgress.push(cloud);
          await saveDailyProgress(cloud);
        } else if (local && !cloud) {
          mergedDailyProgress.push(local);
        } else if (local && cloud) {
          const merged = 
            new Date(local.updatedAt) > new Date(cloud.updatedAt)
              ? local
              : cloud;
          mergedDailyProgress.push(merged);
          
          if (new Date(cloud.updatedAt) > new Date(local.updatedAt)) {
            await saveDailyProgress(cloud);
          }
        }
      }

      if (mergedDailyProgress.length > 0) {
        await batchSaveUserDailyProgress(userId, mergedDailyProgress);
      }

      // Sync calculator settings
      const localCalculatorSettings = await getCalculatorSettings();
      const cloudCalculatorSettings = await getUserCalculatorSettings(userId);

      if (!localCalculatorSettings && cloudCalculatorSettings) {
        await saveCalculatorSettings(cloudCalculatorSettings);
      } else if (localCalculatorSettings && !cloudCalculatorSettings) {
        await saveUserCalculatorSettings(userId, localCalculatorSettings);
      } else if (localCalculatorSettings && cloudCalculatorSettings) {
        const merged = 
          new Date(localCalculatorSettings.updatedAt) > new Date(cloudCalculatorSettings.updatedAt)
            ? localCalculatorSettings
            : cloudCalculatorSettings;
        
        await saveCalculatorSettings(merged);
        await saveUserCalculatorSettings(userId, merged);
      }
    } catch (error) {
      console.error("Failed to sync progress on login:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      const previousUserId = previousUserIdRef.current;
      const currentUserId = firebaseUser?.uid || null;
      
      setUser(firebaseUser);
      setLoading(false);
      
      // Sync progress when user logs in (transitions from null to a user, or different user)
      if (firebaseUser && currentUserId !== previousUserId) {
        previousUserIdRef.current = currentUserId;
        syncProgressOnLogin(firebaseUser.uid);
      } else if (!firebaseUser) {
        previousUserIdRef.current = null;
      }
    });

    return unsubscribe;
  }, [syncProgressOnLogin]);

  // Sync on page reload if user is logged in (only once per session)
  const hasSyncedOnLoadRef = useRef(false);
  useEffect(() => {
    if (user && !loading && !hasSyncedOnLoadRef.current) {
      hasSyncedOnLoadRef.current = true;
      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        syncProgressOnLogin(user.uid);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, syncProgressOnLogin]);

  const login = useCallback(async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseLogout();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }, []);

  // Expose a version that uses current user for manual sync
  const syncProgressOnLoginWithUser = useCallback(async () => {
    if (!user) return;
    await syncProgressOnLogin(user.uid);
  }, [user, syncProgressOnLogin]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        syncProgressOnLogin: syncProgressOnLoginWithUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

