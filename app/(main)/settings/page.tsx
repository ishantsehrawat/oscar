"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { exportData, importData } from "@/lib/storage/indexeddb";
import { Download, Upload, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user, syncProgressOnLogin } = useAuth();
  const [exportDataText, setExportDataText] = useState("");
  const [importDataText, setImportDataText] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const data = await exportData();
      setExportDataText(data);
      
      // Also create downloadable file
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `oscar-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data");
    }
  };

  const handleImport = async () => {
    try {
      await importData(importDataText);
      alert("Data imported successfully. Please refresh the page.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to import data:", error);
      alert("Failed to import data. Please check the format.");
    }
  };

  const handleSync = async () => {
    if (!user) {
      setSyncMessage("Please sign in to sync data");
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage(null);
      await syncProgressOnLogin();
      setSyncMessage("Data synced successfully!");
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncMessage("Failed to sync data. Please try again.");
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your data and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Export your progress and data as a JSON file. This is useful for backing up
            your data or transferring it to another device.
          </p>
          <Button variant="primary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          {exportDataText && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Exported Data (JSON)
              </label>
              <textarea
                readOnly
                value={exportDataText}
                className="w-full h-32 p-3 border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Import previously exported data. This will merge with your existing data.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paste JSON Data
            </label>
            <textarea
              value={importDataText}
              onChange={(e) => setImportDataText(e.target.value)}
              placeholder="Paste your exported JSON data here..."
              className="w-full h-32 p-3 border border-slate-300 rounded-lg font-mono text-xs"
            />
          </div>
          <Button variant="primary" onClick={handleImport} disabled={!importDataText}>
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </CardContent>
      </Card>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Cloud Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Sync your progress, daily goals, and calculator settings with the cloud.
              This will fetch data from the cloud, merge with local data, and upload
              any changes if needed.
            </p>
            <Button
              variant="primary"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
            {syncMessage && (
              <p
                className={`text-sm ${
                  syncMessage.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {syncMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

