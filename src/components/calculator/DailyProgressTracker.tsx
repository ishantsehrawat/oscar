"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { NumberInput } from "@/components/ui/NumberInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  saveDailyProgress,
  getDailyProgress,
  getAllDailyProgress,
  deleteDailyProgress,
} from "@/lib/storage/indexeddb";
import { DailyProgress } from "@/types/dailyProgress";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { Plus, Trash2, TrendingUp, Calendar } from "lucide-react";

export function DailyProgressTracker() {
  const [todayCount, setTodayCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [entries, setEntries] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editCount, setEditCount] = useState(0);

  // Load today's count and all entries
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allEntries = await getAllDailyProgress();
      // Sort by date descending (most recent first)
      allEntries.sort((a, b) => b.date.localeCompare(a.date));
      setEntries(allEntries);

      // Load today's count
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const todayEntry = await getDailyProgress(todayStr);
      if (todayEntry) {
        setTodayCount(todayEntry.count);
      } else {
        setTodayCount(0);
      }
    } catch (error) {
      console.error("Error loading daily progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToday = async () => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const now = new Date();

    const progress: DailyProgress = {
      date: todayStr,
      count: todayCount,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveDailyProgress(progress);
      await loadData();
    } catch (error) {
      console.error("Error saving daily progress:", error);
    }
  };

  const handleSaveForDate = async (date: string, count: number) => {
    const existing = entries.find((e) => e.date === date);
    const now = new Date();

    const progress: DailyProgress = {
      date,
      count,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await saveDailyProgress(progress);
      await loadData();
      setEditingDate(null);
    } catch (error) {
      console.error("Error saving daily progress:", error);
    }
  };

  const handleDelete = async (date: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteDailyProgress(date);
        await loadData();
      } catch (error) {
        console.error("Error deleting daily progress:", error);
      }
    }
  };

  const startEditing = (entry: DailyProgress) => {
    setEditingDate(entry.date);
    setEditCount(entry.count);
  };

  const cancelEditing = () => {
    setEditingDate(null);
    setEditCount(0);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  // Calculate statistics
  const totalQuestions = entries.reduce((sum, e) => sum + e.count, 0);
  const averagePerDay = entries.length > 0 ? totalQuestions / entries.length : 0;
  const recentEntries = entries.slice(0, 7); // Last 7 entries

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Daily Progress Tracker
        </h2>
        <p className="text-slate-600">
          Track your daily question count and monitor your progress
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Log Today's Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberInput
              label="Questions Solved Today"
              value={todayCount}
              onChange={setTodayCount}
              min={0}
              placeholder="0"
            />
            <Button onClick={handleSaveToday} className="w-full" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Save Today's Count
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Questions</span>
              <span className="text-2xl font-bold text-slate-900">{totalQuestions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Days Tracked</span>
              <span className="text-2xl font-bold text-slate-900">{entries.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Average Per Day</span>
              <span className="text-2xl font-bold text-slate-900">
                {averagePerDay.toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 text-center py-4">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              No entries yet. Start tracking your progress!
            </p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">
                      {formatDateDisplay(entry.date)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {format(parseISO(entry.date), "EEEE")}
                    </div>
                  </div>
                  {editingDate === entry.date ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editCount}
                        onChange={(e) => setEditCount(parseFloat(e.target.value) || 0)}
                        min={0}
                        className="w-20 px-2 py-1 border border-slate-300 rounded-md text-center text-lg font-semibold"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveForDate(entry.date, editCount)}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-slate-900">{entry.count}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(entry)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(entry.date)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {entries.length > 7 && (
                <p className="text-sm text-slate-500 text-center pt-2">
                  Showing 7 most recent entries. Total: {entries.length} entries
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

