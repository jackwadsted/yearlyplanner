import { DayRecord, UserConfig } from '../types';
import { formatISODate } from './dateUtils';

export interface BurnoutStatus {
  isBurnedOut: boolean;
  longestStretchWeeks: number;
  currentStretchWeeks: number;
  message: string;
  recommendation?: string;
}

export function analyzeBurnout(
  selectedYear: number,
  config: UserConfig,
  dayRecords: Record<string, DayRecord>
): BurnoutStatus {
  const start = new Date(selectedYear, 3, 6);
  const end = new Date(selectedYear + 1, 3, 5);

  const days: { dateStr: string; isWorkingDay: boolean; isVacation: boolean }[] = [];

  for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const dateStr = formatISODate(d.getFullYear(), d.getMonth(), d.getDate());
    const record = dayRecords[dateStr];
    
    const isVacation = record?.type === 'vacation';
    const isNonWorking = record?.type === 'non_working';
    const isSickness = record?.type === 'sickness';
    const isBankHoliday = record?.type === 'bank_holiday';

    const isScheduledWorking = config.workingDays.includes(d.getDay());
    const isWorkingDay = isScheduledWorking && !isVacation && !isNonWorking && !isSickness && !isBankHoliday;

    days.push({ dateStr, isWorkingDay, isVacation });
  }

  const vacationDates = days.filter((d) => d.isVacation).map((d) => new Date(d.dateStr));
  
  if (vacationDates.length === 0) {
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.round(totalDays / 7);
    return {
      isBurnedOut: weeks >= 10,
      longestStretchWeeks: weeks,
      currentStretchWeeks: weeks,
      message: "No vacation booked for this entire fiscal year!",
      recommendation: "Use the 'Suggest' tool in the header to find the best times to book some time off and maximize your leave ratio!"
    };
  }

  // Calculate gaps in calendar days between vacations
  let maxGapDays = 0;
  
  const firstVacation = vacationDates[0];
  const firstGap = Math.ceil((firstVacation.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (firstGap > maxGapDays) maxGapDays = firstGap;

  for (let i = 1; i < vacationDates.length; i++) {
    const gap = Math.ceil((vacationDates[i].getTime() - vacationDates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    if (gap > maxGapDays) maxGapDays = gap;
  }

  const lastVacation = vacationDates[vacationDates.length - 1];
  const lastGap = Math.ceil((end.getTime() - lastVacation.getTime()) / (1000 * 60 * 60 * 24));
  if (lastGap > maxGapDays) maxGapDays = lastGap;

  const longestStretchWeeks = Math.round(maxGapDays / 7);

  // Current gap relative to today
  const todayStr = formatISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const today = new Date(todayStr);
  const pastVacations = vacationDates.filter((d) => d <= today);

  let currentStretchDaysVal = 0;
  if (pastVacations.length === 0) {
    currentStretchDaysVal = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    const lastPastVacation = pastVacations[pastVacations.length - 1];
    currentStretchDaysVal = Math.ceil((today.getTime() - lastPastVacation.getTime()) / (1000 * 60 * 60 * 24));
  }

  const currentStretchWeeks = Math.max(0, Math.round(currentStretchDaysVal / 7));
  const isBurnedOut = longestStretchWeeks >= 10 || currentStretchWeeks >= 10;
  
  let message = "";
  let recommendation = "";

  if (isBurnedOut) {
    if (currentStretchWeeks >= 10) {
      message = `You have worked for ${currentStretchWeeks} weeks straight without taking any vacation.`;
      recommendation = "We strongly suggest booking a break soon to prevent burnout and recharge.";
    } else {
      message = `Your longest stretch without vacation this year is ${longestStretchWeeks} weeks.`;
      recommendation = "Consider spacing your annual leave more evenly to maintain a healthy balance.";
    }
  } else {
    message = `Your holiday booking pattern is healthy. Longest stretch is ${longestStretchWeeks} weeks.`;
    recommendation = "Great job spacing out your annual leave!";
  }

  return {
    isBurnedOut,
    longestStretchWeeks,
    currentStretchWeeks,
    message,
    recommendation,
  };
}
