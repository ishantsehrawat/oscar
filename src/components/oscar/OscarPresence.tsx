"use client";

import { useEffect, useState } from "react";
import { OscarMessage, generateOscarMessage } from "@/constants/oscarMessages";
import { Card, CardContent } from "@/components/ui/Card";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface OscarPresenceProps {
  messages: OscarMessage[];
  onDismiss: (id: string) => void;
}

export function OscarPresence({ messages, onDismiss }: OscarPresenceProps) {
  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {messages.map((message) => (
        <Card
          key={message.id}
          className="shadow-lg border-slate-200 animate-in slide-in-from-right"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-700 flex-1">{message.message}</p>
              <button
                onClick={() => onDismiss(message.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

