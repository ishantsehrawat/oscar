"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { cn } from "@/lib/utils/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className={cn("relative z-50 w-full max-w-md max-h-[90vh] overflow-y-auto", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

