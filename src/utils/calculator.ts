import { UserConfig, FiscalYearData, AllowanceSummary, SummaryExtraAllowance } from '../types';

/**
 * Calculates vacation entitlement in hours using the formula:
 * Vacation Hours = F (full time vacation days) * W (weekly hours) / 5
 * e.g., 26 * 33 / 5 = 171.6 hours
 */
export function calculateVacationEntitlementHours(config: UserConfig): number {
  const { fullTimeVacationDays, weeklyHours } = config;
  const hours = (fullTimeVacationDays * weeklyHours) / 5;
  return Math.round(hours * 100) / 100;
}

/**
 * Calculates bank holiday entitlement in hours using the formula:
 * Bank Holiday Hours = B (full time bank holiday days) * W (weekly hours) / 5
 * e.g., 8 * 33 / 5 = 52.8 hours
 */
export function calculateBankHolidayEntitlementHours(config: UserConfig): number {
  const { fullTimeBankHolidays, weeklyHours } = config;
  const hours = (fullTimeBankHolidays * weeklyHours) / 5;
  return Math.round(hours * 100) / 100;
}

/**
 * Generates the FY string for a given start year.
 * e.g., 2026 -> "2026/27"
 */
export function getFiscalYearKey(startYear: number): string {
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endYearShort}`;
}

/**
 * Calculates full summary metrics for a given fiscal year and user configuration.
 */
export function calculateAllowanceSummary(
  config: UserConfig,
  fyData?: FiscalYearData,
  fiscalYearKey?: string
): AllowanceSummary {
  const dailyHours = config.dailyDefaultHours || (config.weeklyHours / (config.workingDays.length || 4));
  const fyKey = fiscalYearKey || (fyData ? fyData.fiscalYear : '2026/27');

  // Base pro-rata allowances
  const vacationBaseHours = calculateVacationEntitlementHours(config);
  const bankHolidayBaseHours = calculateBankHolidayEntitlementHours(config);

  // Adjustments (overrides)
  const adjustments = fyData?.adjustments || [];
  const vacationAdjustmentHours = adjustments
    .filter((a) => a.type === 'vacation')
    .reduce((sum, a) => sum + a.hours, 0);

  const bankHolidayAdjustmentHours = adjustments
    .filter((a) => a.type === 'bank_holiday')
    .reduce((sum, a) => sum + a.hours, 0);

  const vacationTotalAllowanceHours = Math.round((vacationBaseHours + vacationAdjustmentHours) * 100) / 100;
  const bankHolidayTotalAllowanceHours = Math.round((bankHolidayBaseHours + bankHolidayAdjustmentHours) * 100) / 100;

  // Day records
  const dayRecords = fyData ? Object.values(fyData.dayRecords) : [];

  // Extra vacation buckets: tagged vacation days count against their bucket only
  const extraAllowances = fyData?.extraAllowances || [];
  const extraTakenById: Record<string, number> = {};
  for (const bucket of extraAllowances) {
    extraTakenById[bucket.id] = 0;
  }

  let vacationTakenHours = 0;
  let bankHolidayTakenHours = 0;
  let totalWorkingHoursLogged = 0;
  let totalWorkingDaysLogged = 0;
  let totalSicknessHours = 0;
  let totalSicknessDays = 0;

  for (const record of dayRecords) {
    if (record.type === 'vacation') {
      if (record.extraAllowanceId && record.extraAllowanceId in extraTakenById) {
        extraTakenById[record.extraAllowanceId] += record.hours;
      } else {
        vacationTakenHours += record.hours;
      }
    } else if (record.type === 'bank_holiday') {
      bankHolidayTakenHours += record.hours;
    } else if (record.type === 'working') {
      totalWorkingHoursLogged += record.hours;
      totalWorkingDaysLogged += 1;
    } else if (record.type === 'sickness') {
      totalSicknessHours += record.hours;
      totalSicknessDays += 1;
    }
  }

  vacationTakenHours = Math.round(vacationTakenHours * 100) / 100;
  bankHolidayTakenHours = Math.round(bankHolidayTakenHours * 100) / 100;
  const vacationRemainingHours = Math.round((vacationTotalAllowanceHours - vacationTakenHours) * 100) / 100;
  const bankHolidayRemainingHours = Math.round((bankHolidayTotalAllowanceHours - bankHolidayTakenHours) * 100) / 100;

  const extraAllowanceSummaries: SummaryExtraAllowance[] = extraAllowances.map((bucket) => {
    const totalHours = Math.round(bucket.hours * 100) / 100;
    const takenHours = Math.round(extraTakenById[bucket.id] * 100) / 100;
    const remainingHours = Math.round((totalHours - takenHours) * 100) / 100;
    return {
      id: bucket.id,
      label: bucket.label,
      totalHours,
      takenHours,
      remainingHours,
      totalDaysEquivalent: Math.round((totalHours / dailyHours) * 10) / 10,
      takenDaysEquivalent: Math.round((takenHours / dailyHours) * 10) / 10,
      remainingDaysEquivalent: Math.round((remainingHours / dailyHours) * 10) / 10,
    };
  });

  return {
    fiscalYear: fyKey,

    vacationBaseHours,
    vacationAdjustmentHours: Math.round(vacationAdjustmentHours * 100) / 100,
    vacationTotalAllowanceHours,
    vacationTakenHours,
    vacationRemainingHours,
    vacationTotalDaysEquivalent: Math.round((vacationTotalAllowanceHours / dailyHours) * 10) / 10,
    vacationTakenDaysEquivalent: Math.round((vacationTakenHours / dailyHours) * 10) / 10,
    vacationRemainingDaysEquivalent: Math.round((vacationRemainingHours / dailyHours) * 10) / 10,

    extraAllowances: extraAllowanceSummaries,

    bankHolidayBaseHours,
    bankHolidayAdjustmentHours: Math.round(bankHolidayAdjustmentHours * 100) / 100,
    bankHolidayTotalAllowanceHours,
    bankHolidayTakenHours,
    bankHolidayRemainingHours,
    bankHolidayTotalDaysEquivalent: Math.round((bankHolidayTotalAllowanceHours / dailyHours) * 10) / 10,
    bankHolidayTakenDaysEquivalent: Math.round((bankHolidayTakenHours / dailyHours) * 10) / 10,
    bankHolidayRemainingDaysEquivalent: Math.round((bankHolidayRemainingHours / dailyHours) * 10) / 10,

    totalWorkingDaysLogged,
    totalWorkingHoursLogged: Math.round(totalWorkingHoursLogged * 100) / 100,
    totalSicknessHours: Math.round(totalSicknessHours * 100) / 100,
    totalSicknessDays,
  };
}
