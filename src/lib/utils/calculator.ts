import { format, addDays, isWeekend, differenceInDays, parseISO, startOfDay } from "date-fns";
import { DailyProgress } from "@/types/dailyProgress";

export interface CalculatorInputs {
  totalQuestions: number;
  questionsPerWeekday: number;
  extraQuestionsToday: number;
  extraQuestionsWeekend: number;
  startDate: Date;
}

export interface CalculatorResult {
  totalDays: number;
  endDate: Date;
  endDateFormatted: string;
}

export interface ProgressComparison {
  plannedEndDate: Date;
  plannedEndDateFormatted: string;
  plannedDays: number;
  actualEndDate: Date | null;
  actualEndDateFormatted: string;
  actualDays: number | null;
  daysAhead: number | null; // Positive = ahead, Negative = behind
  questionsCompleted: number;
  questionsRemaining: number;
  daysLeftToPlanned: number;
  daysLeftToActual: number | null;
}

/**
 * Calculates the completion date for Striver's SDE Sheet based on solving pace.
 * 
 * Logic:
 * - Day-by-day calculation
 * - Weekdays: normal daily pace
 * - Weekends: daily pace + weekend extra
 * - "Extra questions today" applies only on the first day
 * - Stops when remaining questions ≤ 0
 */
export function calculateCompletionDate(inputs: CalculatorInputs): CalculatorResult {
  const {
    totalQuestions,
    questionsPerWeekday,
    extraQuestionsToday,
    extraQuestionsWeekend,
    startDate,
  } = inputs;

  // Validate inputs
  if (totalQuestions <= 0 || questionsPerWeekday <= 0) {
    return {
      totalDays: 0,
      endDate: startDate,
      endDateFormatted: format(startDate, "d MMM yyyy"),
    };
  }

  let remainingQuestions = totalQuestions;
  let currentDate = new Date(startDate);
  let daysElapsed = 0;
  let extraApplied = false;

  // Calculate day by day
  while (remainingQuestions > 0) {
    let questionsSolvedToday = 0;

    // Determine questions solved today
    if (isWeekend(currentDate)) {
      // Weekend: normal pace + weekend extra
      questionsSolvedToday = questionsPerWeekday + extraQuestionsWeekend;
    } else {
      // Weekday: normal pace
      questionsSolvedToday = questionsPerWeekday;
    }

    // Apply one-time extra questions on the first day only
    if (!extraApplied && extraQuestionsToday > 0) {
      questionsSolvedToday += extraQuestionsToday;
      extraApplied = true;
    }

    // Subtract questions solved today
    remainingQuestions -= questionsSolvedToday;
    daysElapsed++;

    // If we've completed all questions, break
    if (remainingQuestions <= 0) {
      break;
    }

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  const endDate = currentDate;
  const endDateFormatted = format(endDate, "d MMM yyyy");

  return {
    totalDays: daysElapsed,
    endDate,
    endDateFormatted,
  };
}

/**
 * Calculates completion date based on actual daily progress.
 * Uses the same day-by-day simulation as planned calculation, but:
 * - Starts from tomorrow (or day after last progress)
 * - Uses remaining questions (total - completed)
 * - Uses the same weekday/weekend goal structure
 */
export function calculateCompletionDateFromProgress(
  totalQuestions: number,
  startDate: Date,
  dailyProgress: DailyProgress[],
  questionsPerWeekday: number,
  extraQuestionsWeekend: number
): CalculatorResult | null {
  if (dailyProgress.length === 0) {
    return null;
  }

  // Sort progress by date
  const sortedProgress = [...dailyProgress].sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate total questions completed so far
  const questionsCompleted = sortedProgress.reduce((sum, entry) => sum + entry.count, 0);
  
  if (questionsCompleted >= totalQuestions) {
    // Already completed - find the date when completion happened
    let cumulative = 0;
    for (const entry of sortedProgress) {
      cumulative += entry.count;
      if (cumulative >= totalQuestions) {
        const completionDate = parseISO(entry.date);
        const daysFromStart = differenceInDays(completionDate, startDate) + 1;
        return {
          totalDays: daysFromStart,
          endDate: completionDate,
          endDateFormatted: format(completionDate, "d MMM yyyy"),
        };
      }
    }
  }

  // Validate inputs
  if (questionsPerWeekday <= 0) {
    return null;
  }

  // Get the last progress date or today, whichever is later
  const lastProgressDate = parseISO(sortedProgress[sortedProgress.length - 1].date);
  const today = startOfDay(new Date());
  const lastProgressDay = startOfDay(lastProgressDate);
  
  // Start from tomorrow (day after the later of: today or last progress date)
  const projectionStartDate = addDays(
    lastProgressDay > today ? lastProgressDay : today,
    1
  );
  
  // Remaining questions to complete
  const remainingQuestions = totalQuestions - questionsCompleted;
  
  // Simulate day-by-day using the same logic as planned calculation
  let currentDate = new Date(projectionStartDate);
  let daysElapsed = 0;
  let remaining = remainingQuestions;

  while (remaining > 0) {
    let questionsSolvedToday = 0;

    // Determine questions solved today (same logic as planned)
    if (isWeekend(currentDate)) {
      // Weekend: normal pace + weekend extra
      questionsSolvedToday = questionsPerWeekday + extraQuestionsWeekend;
    } else {
      // Weekday: normal pace
      questionsSolvedToday = questionsPerWeekday;
    }

    // Subtract questions solved today
    remaining -= questionsSolvedToday;
    daysElapsed++;

    // If we've completed all questions, break
    if (remaining <= 0) {
      break;
    }

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  const projectedEndDate = currentDate;
  // Calculate total days from original start date to projected end date (inclusive)
  const daysFromStart = differenceInDays(projectedEndDate, startDate) + 1;

  return {
    totalDays: daysFromStart,
    endDate: projectedEndDate,
    endDateFormatted: format(projectedEndDate, "d MMM yyyy"),
  };
}

/**
 * Compares planned completion date with actual progress to show ahead/behind status.
 */
export function compareProgress(
  plannedResult: CalculatorResult,
  totalQuestions: number,
  startDate: Date,
  dailyProgress: DailyProgress[],
  questionsPerWeekday: number,
  extraQuestionsWeekend: number
): ProgressComparison {
  const questionsCompleted = dailyProgress.reduce((sum, entry) => sum + entry.count, 0);
  const questionsRemaining = Math.max(0, totalQuestions - questionsCompleted);
  
  const actualResult = calculateCompletionDateFromProgress(
    totalQuestions,
    startDate,
    dailyProgress,
    questionsPerWeekday,
    extraQuestionsWeekend
  );

  const today = new Date();
  const daysLeftToPlanned = Math.max(0, differenceInDays(plannedResult.endDate, today));
  const daysLeftToActual = actualResult
    ? Math.max(0, differenceInDays(actualResult.endDate, today))
    : null;

  let daysAhead: number | null = null;
  if (actualResult) {
    daysAhead = differenceInDays(plannedResult.endDate, actualResult.endDate);
  }

  return {
    plannedEndDate: plannedResult.endDate,
    plannedEndDateFormatted: plannedResult.endDateFormatted,
    plannedDays: plannedResult.totalDays,
    actualEndDate: actualResult?.endDate || null,
    actualEndDateFormatted: actualResult?.endDateFormatted || "Not enough data",
    actualDays: actualResult?.totalDays || null,
    daysAhead,
    questionsCompleted,
    questionsRemaining,
    daysLeftToPlanned,
    daysLeftToActual,
  };
}

