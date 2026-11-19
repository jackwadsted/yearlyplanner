export type DayType =
  | 'working'
  | 'non_working'
  | 'vacation'
  | 'bank_holiday'
  | 'sickness'
  | 'custom';

export type PaintTool =
  | 'select'
  | 'vacation'
  | 'bank_holiday'
  | 'non_working'
  | 'working'
  | 'sickness'
  | 'eraser';

export type UKRegion = 'england-and-wales' | 'scotland' | 'northern-ireland';

export type ThemeId = 'default' | 'pink' | 'orange' | 'black' | 'blue' | 'red';

export interface DayRecord {
  date: string; // ISO format: 'YYYY-MM-DD'
  type: DayType;
  hours: number;
  isCustomHours?: boolean;
  note?: string;
  extraAllowanceId?: string; // only meaningful when type === 'vacation'; missing = normal allowance
}

export interface ExtraAllowance {
  id: string;
  fiscalYear: string; // e.g., '2026/27'
  label: string;
  hours: number;
  createdAt: string;
}

export interface AllowanceAdjustment {
  id: string;
  fiscalYear: string; // e.g., '2026/27'
  description: string;
  hours: number; // positive or negative
  type: 'vacation' | 'bank_holiday';
  createdAt: string;
}

export interface UserConfig {
  name: string;
  weeklyHours: number; // e.g., 33 or 36
  fullTimeWeeklyHours: number; // e.g., 37.5 or 40
  fullTimeVacationDays: number; // e.g., 26
  fullTimeBankHolidays: number; // e.g., 8
  workingDays: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  dailyDefaultHours: number; // e.g., 8.25
  region: UKRegion;
  theme: ThemeId;
}

export interface FiscalYearData {
  fiscalYear: string; // '2026/27'
  dayRecords: Record<string, DayRecord>; // key: 'YYYY-MM-DD'
  adjustments: AllowanceAdjustment[];
  extraAllowances?: ExtraAllowance[];
}

export interface AppState {
  config: UserConfig;
  selectedYear: number; // e.g., 2026 for FY 2026/27 (April 6, 2026 - April 5, 2027)
  years: Record<string, FiscalYearData>;
}

export interface BankHoliday {
  title: string;
  date: string; // 'YYYY-MM-DD'
  notes?: string;
  bunting?: boolean;
}

export interface SummaryExtraAllowance {
  id: string;
  label: string;
  totalHours: number;
  takenHours: number;
  remainingHours: number;
  totalDaysEquivalent: number;
  takenDaysEquivalent: number;
  remainingDaysEquivalent: number;
}

export interface AllowanceSummary {
  fiscalYear: string;
  
  // Vacation
  vacationBaseHours: number;
  vacationAdjustmentHours: number;
  vacationTotalAllowanceHours: number;
  vacationTakenHours: number;
  vacationRemainingHours: number;
  vacationTotalDaysEquivalent: number;
  vacationTakenDaysEquivalent: number;
  vacationRemainingDaysEquivalent: number;

  // Extra vacation buckets (tagged vacation days are excluded from the vacation figures above)
  extraAllowances: SummaryExtraAllowance[];

  // Bank Holidays
  bankHolidayBaseHours: number;
  bankHolidayAdjustmentHours: number;
  bankHolidayTotalAllowanceHours: number;
  bankHolidayTakenHours: number;
  bankHolidayRemainingHours: number;
  bankHolidayTotalDaysEquivalent: number;
  bankHolidayTakenDaysEquivalent: number;
  bankHolidayRemainingDaysEquivalent: number;

  // Total working hours & days logged
  totalWorkingDaysLogged: number;
  totalWorkingHoursLogged: number;
  totalSicknessHours: number;
  totalSicknessDays: number;
}
