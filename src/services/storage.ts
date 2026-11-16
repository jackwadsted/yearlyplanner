import { AppState, UserConfig, FiscalYearData } from '../types';
import { getFiscalYearKey } from '../utils/calculator';

const STORAGE_KEY = 'vacation_planner_v1';

export const DEFAULT_CONFIG: UserConfig = {
  name: 'My Schedule',
  weeklyHours: 33,
  fullTimeWeeklyHours: 37.5,
  fullTimeVacationDays: 26,
  fullTimeBankHolidays: 8,
  workingDays: [1, 2, 3, 4], // Monday, Tuesday, Wednesday, Thursday (Friday, Saturday, Sunday off)
  dailyDefaultHours: 8.25,
  region: 'england-and-wales',
  theme: 'default',
};

/**
 * Returns current UK fiscal year start year.
 * UK Tax year starts on April 6.
 */
export function getCurrentFiscalYearStart(): number {
  const now = new Date();
  const year = now.getFullYear();
  const aprilSixth = new Date(year, 3, 6); // Note: month 3 is April
  return now >= aprilSixth ? year : year - 1;
}

export function createInitialState(): AppState {
  const currentFY = getCurrentFiscalYearStart();
  const fyKey = getFiscalYearKey(currentFY);

  const initialFYData: FiscalYearData = {
    fiscalYear: fyKey,
    dayRecords: {},
    adjustments: [],
  };

  return {
    config: DEFAULT_CONFIG,
    selectedYear: currentFY,
    years: {
      [fyKey]: initialFYData,
    },
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed.config || !parsed.years) {
      return createInitialState();
    }

    // Ensure selectedYear is valid
    const selectedYear = parsed.selectedYear || getCurrentFiscalYearStart();
    const fyKey = getFiscalYearKey(selectedYear);

    const mergedConfig: UserConfig = {
      ...DEFAULT_CONFIG,
      ...parsed.config,
    };

    const mergedYears = { ...parsed.years };
    if (!mergedYears[fyKey]) {
      mergedYears[fyKey] = {
        fiscalYear: fyKey,
        dayRecords: {},
        adjustments: [],
      };
    }

    return {
      config: mergedConfig,
      selectedYear,
      years: mergedYears,
    };
  } catch (err) {
    console.error('Failed to load saved state, using default:', err);
    return createInitialState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function exportStateToFile(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `vacation_planner_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importStateFromFile(fileContent: string): AppState {
  const parsed = JSON.parse(fileContent);
  if (!parsed.config || typeof parsed.config.weeklyHours !== 'number') {
    throw new Error('Invalid vacation planner backup file');
  }
  return {
    config: {
      ...DEFAULT_CONFIG,
      ...parsed.config,
    },
    selectedYear: parsed.selectedYear || getCurrentFiscalYearStart(),
    years: parsed.years || {},
  };
}
