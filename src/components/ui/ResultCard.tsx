import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Calendar, Clock } from "lucide-react";

interface ResultCardProps {
  totalDays: number;
  endDateFormatted: string;
}

export function ResultCard({ totalDays, endDateFormatted }: ResultCardProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300">
      <CardHeader>
        <CardTitle className="text-xl">Completion Forecast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Total Days Required</p>
            <p className="text-2xl font-bold text-slate-900">{totalDays}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <Calendar className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Completion Date</p>
            <p className="text-2xl font-bold text-slate-900">{endDateFormatted}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

