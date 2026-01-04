import { format, isSunday, startOfWeek, differenceInDays } from "date-fns";

export function formatDate(date: Date | null): string {
  if (!date) return "Never";
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(date: Date | null): string {
  if (!date) return "Never";
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function isTodaySunday(): boolean {
  return isSunday(new Date());
}

export function getDaysSince(date: Date | null): number {
  if (!date) return Infinity;
  return differenceInDays(new Date(), date);
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}

