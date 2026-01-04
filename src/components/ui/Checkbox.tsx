import React from "react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          "w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500 focus:ring-2",
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

