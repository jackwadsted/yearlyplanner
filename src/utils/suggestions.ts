import { BankHoliday, DayRecord, UserConfig } from '../types';
import { formatISODate } from './dateUtils';

export interface VacationSuggestion {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  totalDaysOff: number; // consecutive calendar days off, including vacation
  vacationDates: string[]; // working days that need to be booked as vacation
  vacationHours: number;
  holidayNames: string[]; // bank holidays inside the window
  /** Total days off per vacation day used */
  ratio: number;
}

interface SuggestionOptions {
  selectedYear: number;
  config: UserConfig;
  dayRecords: Record<string, DayRecord>;
  bankHolidays: BankHoliday[];
  remainingVacationHours: number;
  today?: string; // 'YYYY-MM-DD'; days before this are never suggested
  maxVacationDays?: number;
  minTotalDays?: number;
  minRatio?: number;
}

interface DayInfo {
  dateStr: string;
  isOff: boolean;
  isBookedVacation: boolean; // already-booked vacation: neutral, never counted or suggested
  holidayName?: string;
}

const MAX_OPTIONS_PER_CLUSTER = 3;
const OFF_RECORD_TYPES = new Set(['bank_holiday', 'sickness', 'non_working']);

function buildFiscalYearDays(
  selectedYear: number,
  config: UserConfig,
  dayRecords: Record<string, DayRecord>,
  holidayMap: Record<string, BankHoliday>
): DayInfo[] {
  const days: DayInfo[] = [];
  const start = new Date(selectedYear, 3, 6);
  const end = new Date(selectedYear + 1, 3, 5);

  for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const dateStr = formatISODate(d.getFullYear(), d.getMonth(), d.getDate());
    const record = dayRecords[dateStr];
    const holiday = holidayMap[dateStr];

    const isBookedVacation = record?.type === 'vacation';

    let isOff: boolean;
    if (isBookedVacation) {
      isOff = false;
    } else if (record) {
      isOff = OFF_RECORD_TYPES.has(record.type);
    } else {
      isOff = Boolean(holiday) || !config.workingDays.includes(d.getDay());
    }

    days.push({ dateStr, isOff, isBookedVacation, holidayName: holiday?.title });
  }

  return days;
}

/**
 * Finds runs of consecutive days off that can be created by booking only a few
 * vacation days around bank holidays, non-working days and weekends.
 * Overlapping alternatives around the same holiday are limited to the best few.
 */
export function findVacationSuggestions(options: SuggestionOptions): VacationSuggestion[] {
  const {
    selectedYear,
    config,
    dayRecords,
    bankHolidays,
    remainingVacationHours,
    maxVacationDays = 5,
    minTotalDays = 4,
    minRatio = 2,
  } = options;

  const now = new Date();
  const today = options.today ?? formatISODate(now.getFullYear(), now.getMonth(), now.getDate());

  const holidayMap: Record<string, BankHoliday> = {};
  for (const h of bankHolidays) holidayMap[h.date] = h;

  const days = buildFiscalYearDays(selectedYear, config, dayRecords, holidayMap);
  const firstUsable = days.findIndex((d) => d.dateStr >= today);
  if (firstUsable === -1) return [];

  // Indices of working days that could be turned into vacation
  const workIdx: number[] = [];
  for (let i = firstUsable; i < days.length; i++) {
    if (!days[i].isOff && !days[i].isBookedVacation) workIdx.push(i);
  }

  const candidates: (VacationSuggestion & { startIdx: number; endIdx: number })[] = [];

  for (let k = 1; k <= maxVacationDays; k++) {
    const vacationHours = Math.round(k * config.dailyDefaultHours * 100) / 100;
    if (vacationHours > remainingVacationHours) break;

    for (let a = 0; a + k <= workIdx.length; a++) {
      let startIdx = workIdx[a];
      let endIdx = workIdx[a + k - 1];
      while (startIdx - 1 >= firstUsable && days[startIdx - 1].isOff) startIdx--;
      while (endIdx + 1 < days.length && days[endIdx + 1].isOff) endIdx++;

      // Skip breaks that would just extend vacation that is already booked
      if (days[startIdx - 1]?.isBookedVacation || days[endIdx + 1]?.isBookedVacation) continue;

      const window = days.slice(startIdx, endIdx + 1);
      // Booked vacation inside the span (between chosen days) isn't a genuine saving
      if (window.some((d) => d.isBookedVacation)) continue;

      const totalDaysOff = endIdx - startIdx + 1;
      const ratio = totalDaysOff / k;
      if (totalDaysOff < minTotalDays || ratio < minRatio) continue;

      if (!window.some((d) => d.holidayName)) continue;
      candidates.push({
        startDate: days[startIdx].dateStr,
        endDate: days[endIdx].dateStr,
        totalDaysOff,
        vacationDates: workIdx.slice(a, a + k).map((i) => days[i].dateStr),
        vacationHours,
        holidayNames: window.filter((d) => d.holidayName).map((d) => d.holidayName as string),
        ratio: Math.round(ratio * 10) / 10,
        startIdx,
        endIdx,
      });
    }
  }

  // Group overlapping windows (same holiday cluster) and keep the best few options per group
  candidates.sort((x, y) => x.startIdx - y.startIdx || x.endIdx - y.endIdx);
  const clusters: (typeof candidates)[] = [];
  let clusterEnd = -1;
  for (const c of candidates) {
    if (clusters.length === 0 || c.startIdx > clusterEnd) {
      clusters.push([c]);
      clusterEnd = c.endIdx;
    } else {
      clusters[clusters.length - 1].push(c);
      clusterEnd = Math.max(clusterEnd, c.endIdx);
    }
  }

  const selected: typeof candidates = [];
  for (const cluster of clusters) {
    cluster.sort((x, y) => y.ratio - x.ratio || y.totalDaysOff - x.totalDaysOff);
    const seen = new Set<string>();
    for (const c of cluster) {
      const key = `${c.startDate}|${c.endDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(c);
      if (seen.size >= MAX_OPTIONS_PER_CLUSTER) break;
    }
  }

  return selected
    .sort((x, y) => x.startIdx - y.startIdx || y.ratio - x.ratio)
    .map(({ startIdx: _s, endIdx: _e, ...suggestion }) => suggestion);
}
