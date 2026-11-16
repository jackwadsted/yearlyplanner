import { BankHoliday, UKRegion } from '../types';

// Fallback bank holiday data covering 2024-2028 for offline use and instant loading
const FALLBACK_BANK_HOLIDAYS: Record<UKRegion, BankHoliday[]> = {
  'england-and-wales': [
    // 2024
    { title: "New Year's Day", date: '2024-01-01', bunting: true },
    { title: 'Good Friday', date: '2024-03-29', bunting: false },
    { title: 'Easter Monday', date: '2024-04-01', bunting: false },
    { title: 'Early May bank holiday', date: '2024-05-06', bunting: true },
    { title: 'Spring bank holiday', date: '2024-05-27', bunting: true },
    { title: 'Summer bank holiday', date: '2024-08-26', bunting: true },
    { title: 'Christmas Day', date: '2024-12-25', bunting: true },
    { title: 'Boxing Day', date: '2024-12-26', bunting: true },
    // 2025
    { title: "New Year's Day", date: '2025-01-01', bunting: true },
    { title: 'Good Friday', date: '2025-04-18', bunting: false },
    { title: 'Easter Monday', date: '2025-04-21', bunting: false },
    { title: 'Early May bank holiday', date: '2025-05-05', bunting: true },
    { title: 'Spring bank holiday', date: '2025-05-26', bunting: true },
    { title: 'Summer bank holiday', date: '2025-08-25', bunting: true },
    { title: 'Christmas Day', date: '2025-12-25', bunting: true },
    { title: 'Boxing Day', date: '2025-12-26', bunting: true },
    // 2026
    { title: "New Year's Day", date: '2026-01-01', bunting: true },
    { title: 'Good Friday', date: '2026-04-03', bunting: false },
    { title: 'Easter Monday', date: '2026-04-06', bunting: false },
    { title: 'Early May bank holiday', date: '2026-05-04', bunting: true },
    { title: 'Spring bank holiday', date: '2026-05-25', bunting: true },
    { title: 'Summer bank holiday', date: '2026-08-31', bunting: true },
    { title: 'Christmas Day', date: '2026-12-25', bunting: true },
    { title: 'Boxing Day (substitute)', date: '2026-12-28', bunting: true },
    // 2027
    { title: "New Year's Day", date: '2027-01-01', bunting: true },
    { title: 'Good Friday', date: '2027-03-26', bunting: false },
    { title: 'Easter Monday', date: '2027-03-29', bunting: false },
    { title: 'Early May bank holiday', date: '2027-05-03', bunting: true },
    { title: 'Spring bank holiday', date: '2027-05-31', bunting: true },
    { title: 'Summer bank holiday', date: '2027-08-30', bunting: true },
    { title: 'Christmas Day (substitute)', date: '2027-12-27', bunting: true },
    { title: 'Boxing Day (substitute)', date: '2027-12-28', bunting: true },
    // 2028
    { title: "New Year's Day (substitute)", date: '2028-01-03', bunting: true },
    { title: 'Good Friday', date: '2028-04-14', bunting: false },
    { title: 'Easter Monday', date: '2028-04-17', bunting: false },
    { title: 'Early May bank holiday', date: '2028-05-01', bunting: true },
    { title: 'Spring bank holiday', date: '2028-05-29', bunting: true },
    { title: 'Summer bank holiday', date: '2028-08-28', bunting: true },
    { title: 'Christmas Day', date: '2028-12-25', bunting: true },
    { title: 'Boxing Day', date: '2028-12-26', bunting: true },
  ],
  'scotland': [
    { title: "New Year's Day", date: '2025-01-01', bunting: true },
    { title: '2nd January', date: '2025-01-02', bunting: true },
    { title: 'Good Friday', date: '2025-04-18', bunting: false },
    { title: 'Early May bank holiday', date: '2025-05-05', bunting: true },
    { title: 'Spring bank holiday', date: '2025-05-26', bunting: true },
    { title: 'Summer bank holiday', date: '2025-08-04', bunting: true },
    { title: "St Andrew's Day", date: '2025-12-01', bunting: true },
    { title: 'Christmas Day', date: '2025-12-25', bunting: true },
    { title: 'Boxing Day', date: '2025-12-26', bunting: true },
    { title: "New Year's Day", date: '2026-01-01', bunting: true },
    { title: '2nd January', date: '2026-01-02', bunting: true },
    { title: 'Good Friday', date: '2026-04-03', bunting: false },
    { title: 'Early May bank holiday', date: '2026-05-04', bunting: true },
    { title: 'Spring bank holiday', date: '2026-05-25', bunting: true },
    { title: 'Summer bank holiday', date: '2026-08-03', bunting: true },
    { title: "St Andrew's Day", date: '2026-11-30', bunting: true },
    { title: 'Christmas Day', date: '2026-12-25', bunting: true },
    { title: 'Boxing Day (substitute)', date: '2026-12-28', bunting: true },
  ],
  'northern-ireland': [
    { title: "New Year's Day", date: '2025-01-01', bunting: true },
    { title: "St Patrick's Day", date: '2025-03-17', bunting: true },
    { title: 'Good Friday', date: '2025-04-18', bunting: false },
    { title: 'Easter Monday', date: '2025-04-21', bunting: false },
    { title: 'Early May bank holiday', date: '2025-05-05', bunting: true },
    { title: 'Spring bank holiday', date: '2025-05-26', bunting: true },
    { title: 'Battle of the Boyne (Orangemen’s Day)', date: '2025-07-14', bunting: true },
    { title: 'Summer bank holiday', date: '2025-08-25', bunting: true },
    { title: 'Christmas Day', date: '2025-12-25', bunting: true },
    { title: 'Boxing Day', date: '2025-12-26', bunting: true },
    { title: "New Year's Day", date: '2026-01-01', bunting: true },
    { title: "St Patrick's Day", date: '2026-03-17', bunting: true },
    { title: 'Good Friday', date: '2026-04-03', bunting: false },
    { title: 'Easter Monday', date: '2026-04-06', bunting: false },
    { title: 'Early May bank holiday', date: '2026-05-04', bunting: true },
    { title: 'Spring bank holiday', date: '2026-05-25', bunting: true },
    { title: 'Battle of the Boyne (substitute)', date: '2026-07-13', bunting: true },
    { title: 'Summer bank holiday', date: '2026-08-31', bunting: true },
    { title: 'Christmas Day', date: '2026-12-25', bunting: true },
    { title: 'Boxing Day (substitute)', date: '2026-12-28', bunting: true },
  ],
};

interface GovUkBankHolidayEvent {
  title: string;
  date: string;
  notes: string;
  bunting: boolean;
}

interface GovUkBankHolidaysResponse {
  'england-and-wales'?: { events: GovUkBankHolidayEvent[] };
  scotland?: { events: GovUkBankHolidayEvent[] };
  'northern-ireland'?: { events: GovUkBankHolidayEvent[] };
}

export async function fetchBankHolidays(region: UKRegion): Promise<BankHoliday[]> {
  const fallback = FALLBACK_BANK_HOLIDAYS[region] || FALLBACK_BANK_HOLIDAYS['england-and-wales'];
  try {
    const res = await fetch('https://www.gov.uk/bank-holidays.json');
    if (!res.ok) {
      return fallback;
    }
    const data: GovUkBankHolidaysResponse = await res.json();
    const division = data[region];
    if (division && division.events) {
      return division.events.map((e) => ({
        title: e.title,
        date: e.date,
        notes: e.notes,
        bunting: e.bunting,
      }));
    }
    return fallback;
  } catch {
    // If offline or blocked by CORS, seamlessly return the comprehensive fallback
    return fallback;
  }
}

/**
 * Filters bank holidays for a given UK Fiscal Year (April 6 Year N to April 5 Year N+1)
 */
export function getFiscalYearBankHolidays(bankHolidays: BankHoliday[], startYear: number): BankHoliday[] {
  const fyStart = `${startYear}-04-06`;
  const fyEnd = `${startYear + 1}-04-05`;
  return bankHolidays.filter((h) => h.date >= fyStart && h.date <= fyEnd);
}
