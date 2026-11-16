import { calculateVacationEntitlementHours, calculateBankHolidayEntitlementHours, calculateAllowanceSummary } from './src/utils/calculator.ts';
import { isDateInFiscalYear } from './src/utils/dateUtils.ts';
import { UserConfig, FiscalYearData } from './src/types/index.ts';

function runValidationTests() {
  console.log('--- Running Calculation & Pro-Rata Validation Tests ---');

  // Test 1: User 33h / 37.5h base
  const user1Config: UserConfig = {
    name: 'User 33h',
    weeklyHours: 33,
    fullTimeWeeklyHours: 37.5,
    fullTimeVacationDays: 26,
    fullTimeBankHolidays: 8,
    workingDays: [1, 2, 3, 4],
    dailyDefaultHours: 8.25,
    region: 'england-and-wales',
    theme: 'default',
  };

  const u1VacHours = calculateVacationEntitlementHours(user1Config);
  const u1BhHours = calculateBankHolidayEntitlementHours(user1Config);
  console.log(`Test 1: 33h User -> Vacation Hours: ${u1VacHours} (Expected: 171.6), BH Hours: ${u1BhHours} (Expected: 52.8)`);
  if (u1VacHours !== 171.6) throw new Error(`Test 1 Failed: Expected 171.6 but got ${u1VacHours}`);
  if (u1BhHours !== 52.8) throw new Error(`Test 1 Failed: Expected 52.8 but got ${u1BhHours}`);

  // Test 2: Colleague 36h / 40h base
  const user2Config: UserConfig = {
    name: 'Colleague 36h',
    weeklyHours: 36,
    fullTimeWeeklyHours: 40,
    fullTimeVacationDays: 26,
    fullTimeBankHolidays: 8,
    workingDays: [1, 2, 3, 4],
    dailyDefaultHours: 9.0,
    region: 'england-and-wales',
    theme: 'default',
  };

  const u2VacHours = calculateVacationEntitlementHours(user2Config);
  const u2BhHours = calculateBankHolidayEntitlementHours(user2Config);
  console.log(`Test 2: 36h Colleague -> Vacation Hours: ${u2VacHours} (Expected: 187.2), BH Hours: ${u2BhHours} (Expected: 57.6)`);
  if (u2VacHours !== 187.2) throw new Error(`Test 2 Failed: Expected 187.2 but got ${u2VacHours}`);
  if (u2BhHours !== 57.6) throw new Error(`Test 2 Failed: Expected 57.6 but got ${u2BhHours}`);

  // Test 3: Allowance Adjustments & Deductions
  const fyData: FiscalYearData = {
    fiscalYear: '2026/27',
    dayRecords: {
      '2026-06-01': { date: '2026-06-01', type: 'vacation', hours: 8.25 },
      '2026-06-02': { date: '2026-06-02', type: 'vacation', hours: 8.25 },
      '2026-05-04': { date: '2026-05-04', type: 'bank_holiday', hours: 8.25 },
    },
    adjustments: [
      {
        id: 'adj_1',
        fiscalYear: '2026/27',
        description: 'Carryover from 25/26',
        hours: 16.5,
        type: 'vacation',
        createdAt: '2026-04-06T00:00:00Z',
      },
    ],
  };

  const summary = calculateAllowanceSummary(user1Config, fyData, '2026/27');
  console.log(`Test 3: Total Vacation Allowance: ${summary.vacationTotalAllowanceHours} (Expected: 188.1)`);
  console.log(`Test 3: Vacation Taken: ${summary.vacationTakenHours} (Expected: 16.5)`);
  console.log(`Test 3: Vacation Remaining: ${summary.vacationRemainingHours} (Expected: 171.6)`);
  console.log(`Test 3: BH Allowance: ${summary.bankHolidayTotalAllowanceHours} (Expected: 52.8)`);
  console.log(`Test 3: BH Taken: ${summary.bankHolidayTakenHours} (Expected: 8.25)`);
  console.log(`Test 3: BH Remaining: ${summary.bankHolidayRemainingHours} (Expected: 44.55)`);

  if (summary.vacationTotalAllowanceHours !== 188.1) throw new Error('Test 3 Failed: Total allowance');
  if (summary.vacationRemainingHours !== 171.6) throw new Error('Test 3 Failed: Vacation remaining');
  if (summary.bankHolidayRemainingHours !== 44.55) throw new Error('Test 3 Failed: BH remaining');

  // Test 4: Fiscal Year Date Boundaries (April 6 - April 5)
  if (!isDateInFiscalYear('2026-04-06', 2026)) throw new Error('Test 4 Failed: 2026-04-06 should be in FY 2026/27');
  if (!isDateInFiscalYear('2027-04-05', 2026)) throw new Error('Test 4 Failed: 2027-04-05 should be in FY 2026/27');
  if (isDateInFiscalYear('2026-04-05', 2026)) throw new Error('Test 4 Failed: 2026-04-05 should NOT be in FY 2026/27');
  if (isDateInFiscalYear('2027-04-06', 2026)) throw new Error('Test 4 Failed: 2027-04-06 should NOT be in FY 2026/27');
  console.log('Test 4: Fiscal Year Date Boundaries verified successfully (April 6 to April 5).');

  console.log('✅ ALL VALIDATION TESTS PASSED PERFECTLY!');
}

runValidationTests();
