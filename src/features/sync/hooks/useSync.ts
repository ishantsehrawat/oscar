"use client";

import { useState, useEffect, useCallback } from "react";
import { syncQueueToFirestore, checkSyncStatus } from "../services/syncService";
import { onAuthChange } from "@/lib/firebase/auth";
import { User as FirebaseUser } from "firebase/auth";

export function useSync() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    hasPendingItems: boolean;
    itemCount: number;
  }>({ hasPendingItems: false, itemCount: 0 });

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && user && !syncing) {
      performSync();
    }
  }, [isOnline, user, syncing]);

  async function updateSyncStatus() {
    const status = await checkSyncStatus();
    setSyncStatus(status);
  }

  const performSync = useCallback(async () => {
    if (!user || !isOnline || syncing) return;

    try {
      setSyncing(true);
      await syncQueueToFirestore(user.uid);
      await updateSyncStatus();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }, [user, isOnline, syncing]);

  return {
    syncing,
    syncStatus,
    isOnline,
    isLoggedIn: !!user,
    performSync,
  };
}

