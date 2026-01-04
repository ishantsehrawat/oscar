"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { BookOpen, BarChart3, FileText, Settings, Calculator } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSync } from "@/features/sync/hooks/useSync";
import { useSheet } from "@/contexts/SheetContext";
import { useEffect } from "react";
import { getAllSheets } from "@/lib/firebase/firestore";

export function Header() {
  const pathname = usePathname();
  const { syncStatus, isOnline, isLoggedIn } = useSync();
  const { selectedSheet, setSelectedSheet, availableSheets, setAvailableSheets } = useSheet();

  useEffect(() => {
    // Load available sheets
    getAllSheets()
      .then((sheets) => {
        const sheetNames = sheets.map((s) => s.name);
        setAvailableSheets(sheetNames);
      })
      .catch((error) => {
        console.error("Failed to load sheets:", error);
      });
  }, [setAvailableSheets]);

  const navItems = [
    { href: "/sheet", label: "Sheet", icon: BookOpen },
    { href: "/progress", label: "Progress", icon: BarChart3 },
    { href: "/test", label: "Test", icon: FileText },
    { href: "/calculator", label: "Calculator", icon: Calculator },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-slate-900">OSCAR</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-2",
                      isActive && "bg-slate-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                value={selectedSheet || "none"}
                onChange={(e) => setSelectedSheet(e.target.value === "none" ? null : e.target.value)}
                options={[
                  { value: "none", label: "All Questions" },
                  ...availableSheets.map((sheet) => ({
                    value: sheet,
                    label: sheet,
                  })),
                ]}
              />
            </div>
            {!isOnline && (
              <span className="text-xs text-slate-500">Offline</span>
            )}
            {syncStatus.hasPendingItems && isLoggedIn && (
              <span className="text-xs text-slate-500">
                {syncStatus.itemCount} pending
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

