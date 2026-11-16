export interface CalendarDay {
  dateStr: string; // 'YYYY-MM-DD'
  dayNumber: number;
  month: number; // 0-11
  year: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  isInCurrentMonth: boolean;
  isInFiscalYear: boolean;
}

export interface MonthInfo {
  year: number;
  month: number; // 0-11
  name: string;
  days: CalendarDay[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatISODate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateInFiscalYear(dateStr: string, startYear: number): boolean {
  const fyStart = `${startYear}-04-06`;
  const fyEnd = `${startYear + 1}-04-05`;
  return dateStr >= fyStart && dateStr <= fyEnd;
}

export function getFiscalYearMonths(startYear: number): MonthInfo[] {
  const months: MonthInfo[] = [];

  // 13 months: April of startYear to April of startYear + 1
  for (let i = 0; i < 13; i++) {
    const currentMonth = (3 + i) % 12; // 3 is April
    const currentYear = startYear + Math.floor((3 + i) / 12);
    
    // Days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // First day of month (0 = Sun, 1 = Mon, etc.)
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust to Monday start: 0(Sun) -> 6, 1(Mon) -> 0, 2(Tue) -> 1, ..., 6(Sat) -> 5
    const mondayOffset = (firstDayOfWeek + 6) % 7;

    const calendarDays: CalendarDay[] = [];

    // Previous month padding days
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    for (let p = mondayOffset - 1; p >= 0; p--) {
      const dayNum = prevMonthDays - p;
      const dateStr = formatISODate(prevYear, prevMonth, dayNum);
      const dObj = new Date(prevYear, prevMonth, dayNum);
      calendarDays.push({
        dateStr,
        dayNumber: dayNum,
        month: prevMonth,
        year: prevYear,
        dayOfWeek: dObj.getDay(),
        isInCurrentMonth: false,
        isInFiscalYear: isDateInFiscalYear(dateStr, startYear),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatISODate(currentYear, currentMonth, d);
      const dObj = new Date(currentYear, currentMonth, d);
      calendarDays.push({
        dateStr,
        dayNumber: d,
        month: currentMonth,
        year: currentYear,
        dayOfWeek: dObj.getDay(),
        isInCurrentMonth: true,
        isInFiscalYear: isDateInFiscalYear(dateStr, startYear),
      });
    }

    // Trailing days to fill 5 or 6 rows (multiples of 7)
    const remainingDays = (7 - (calendarDays.length % 7)) % 7;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let n = 1; n <= remainingDays; n++) {
      const dateStr = formatISODate(nextYear, nextMonth, n);
      const dObj = new Date(nextYear, nextMonth, n);
      calendarDays.push({
        dateStr,
        dayNumber: n,
        month: nextMonth,
        year: nextYear,
        dayOfWeek: dObj.getDay(),
        isInCurrentMonth: false,
        isInFiscalYear: isDateInFiscalYear(dateStr, startYear),
      });
    }

    months.push({
      year: currentYear,
      month: currentMonth,
      name: `${MONTH_NAMES[currentMonth]} ${currentYear}`,
      days: calendarDays,
    });
  }

  return months;
}

export function formatFriendlyDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
