"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import {
  BookOpen,
  BarChart3,
  FileText,
  Settings,
  Calculator,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSync } from "@/features/sync/hooks/useSync";
import { useSheet } from "@/contexts/SheetContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { syncStatus, isOnline, isLoggedIn } = useSync();
  const { selectedSheet, setSelectedSheet, availableSheets } = useSheet();
  const { user, loading: authLoading, login, logout } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      await login();
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage =
        error?.message || "Failed to sign in. Please try again.";
      setLoginError(errorMessage);
      // Clear error after 5 seconds
      setTimeout(() => setLoginError(null), 5000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSettings = () => {
    setUserMenuOpen(false);
    router.push("/settings");
  };

  const navItems = [
    { href: "/sheet", label: "Sheet", icon: BookOpen },
    { href: "/progress", label: "Progress", icon: BarChart3 },
    { href: "/test", label: "Test", icon: FileText },
    { href: "/calculator", label: "Calculator", icon: Calculator },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold text-slate-900">
                OSCAR
              </span>
            </Link>

            {/* Desktop Navigation */}
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
          </div>

          <div className="flex items-center gap-3">
            {/* Sheet Selector - Hidden on mobile */}
            <div className="hidden sm:block w-48">
              <Select
                value={selectedSheet || "none"}
                onChange={(e) =>
                  setSelectedSheet(
                    e.target.value === "none" ? null : e.target.value
                  )
                }
                options={[
                  { value: "none", label: "All Questions" },
                  ...Array.from(new Set(availableSheets)).map((sheet) => ({
                    value: sheet,
                    label: sheet,
                  })),
                ]}
              />
            </div>

            {/* Status indicators - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2">
              {!isOnline && (
                <span className="text-xs text-slate-500">Offline</span>
              )}
              {syncStatus.hasPendingItems && isLoggedIn && (
                <span className="text-xs text-slate-500">
                  {syncStatus.itemCount} pending
                </span>
              )}
            </div>

            {/* User Menu */}
            {!authLoading && (
              <div className="relative flex flex-col items-end gap-1">
                {loginError && (
                  <span className="text-xs text-red-600 max-w-xs text-right sm:absolute sm:bottom-full sm:mb-1 sm:whitespace-nowrap">
                    {loginError}
                  </span>
                )}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "User"}
                          className="w-8 h-8 rounded-full border-2 border-slate-200 hover:border-slate-300 transition-colors object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </button>
                    <Dropdown
                      open={userMenuOpen}
                      onClose={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-200">
                        <p className="text-sm font-medium text-slate-900">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <DropdownItem onClick={handleSettings}>
                        <Settings className="w-4 h-4" />
                        Settings
                      </DropdownItem>
                      <DropdownItem onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                        Logout
                      </DropdownItem>
                    </Dropdown>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isLoggingIn ? "Signing in..." : "Sign in with Google"}
                    </span>
                    <span className="sm:hidden">
                      {isLoggingIn ? "..." : "Sign in"}
                    </span>
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 py-2">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-slate-100 text-slate-900 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Mobile Sheet Selector */}
            <div className="mt-3 px-3">
              <Select
                value={selectedSheet || "none"}
                onChange={(e) => {
                  setSelectedSheet(
                    e.target.value === "none" ? null : e.target.value
                  );
                }}
                options={[
                  { value: "none", label: "All Questions" },
                  ...Array.from(new Set(availableSheets)).map((sheet) => ({
                    value: sheet,
                    label: sheet,
                  })),
                ]}
              />
            </div>
            {/* Mobile Status */}
            <div className="mt-3 px-3 flex items-center gap-2 text-xs text-slate-500">
              {!isOnline && <span>Offline</span>}
              {syncStatus.hasPendingItems && isLoggedIn && (
                <span>{syncStatus.itemCount} pending</span>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
