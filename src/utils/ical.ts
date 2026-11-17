import { DayRecord, BankHoliday } from '../types';

export interface ICalEvent {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD' (inclusive)
  summary: string;
  description: string;
}

// Generates the standard iCalendar (RFC 5545) content from events
export function generateICalFile(events: ICalEvent[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vacation Planner//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const pad = (num: number) => String(num).padStart(2, '0');
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  events.forEach((event, idx) => {
    // DTEND is exclusive for all-day events.
    // If the inclusive end date is YYYY-MM-DD, add 1 day to make the DTEND exclusive.
    const end = new Date(event.endDate);
    end.setDate(end.getDate() + 1);
    
    const dtStartStr = event.startDate.replace(/-/g, '');
    const dtEndStr = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`;

    const uid = `vp-${dtStamp}-${idx}@vacationplanner.local`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStartStr}`);
    lines.push(`DTEND;VALUE=DATE:${dtEndStr}`);
    lines.push(`SUMMARY:${event.summary}`);
    if (event.description) {
      // Escape newlines as specified in RFC 5545
      lines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
    }
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

// Process dayRecords and bankHolidays into grouped calendar events
export function getEventsFromDayRecords(
  dayRecords: Record<string, DayRecord>,
  bankHolidays: BankHoliday[]
): ICalEvent[] {
  const items: { date: string; type: string; title: string; hours?: number; note?: string }[] = [];

  // 1. Gather logged day records
  Object.values(dayRecords).forEach((rec) => {
    if (rec.type === 'vacation') {
      items.push({
        date: rec.date,
        type: 'vacation',
        title: 'Vacation',
        hours: rec.hours,
        note: rec.note,
      });
    } else if (rec.type === 'sickness') {
      items.push({
        date: rec.date,
        type: 'sickness',
        title: 'Sickness',
        hours: rec.hours,
        note: rec.note,
      });
    }
  });

  // 2. Gather bank holidays
  bankHolidays.forEach((bh) => {
    // Only include if they aren't overridden in dayRecords with a different type
    const record = dayRecords[bh.date];
    if (!record || record.type === 'bank_holiday') {
      items.push({
        date: bh.date,
        type: 'bank_holiday',
        title: `Bank Holiday: ${bh.title}`,
        note: bh.notes,
      });
    }
  });

  if (items.length === 0) return [];

  // Sort chronologically
  items.sort((a, b) => a.date.localeCompare(b.date));

  // Group consecutive items of the same type
  const events: ICalEvent[] = [];
  let currentGroup: typeof items = [items[0]];

  const isConsecutive = (d1: string, d2: string): boolean => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  for (let i = 1; i < items.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = items[i];

    if (curr.type === prev.type && isConsecutive(prev.date, curr.date)) {
      currentGroup.push(curr);
    } else {
      events.push(createEventFromGroup(currentGroup));
      currentGroup = [curr];
    }
  }

  if (currentGroup.length > 0) {
    events.push(createEventFromGroup(currentGroup));
  }

  return events;
}

function createEventFromGroup(
  group: { date: string; type: string; title: string; hours?: number; note?: string }[]
): ICalEvent {
  const first = group[0];
  const last = group[group.length - 1];

  let summary = '';
  const descriptionParts: string[] = [];

  if (first.type === 'vacation') {
    const totalHours = group.reduce((sum, item) => sum + (item.hours ?? 0), 0);
    const totalDays = group.length;
    summary = `Vacation (${totalHours} hrs)`;
    descriptionParts.push(`Annual leave booking. Total days off: ${totalDays} (${totalHours} hrs used).`);
  } else if (first.type === 'sickness') {
    const totalHours = group.reduce((sum, item) => sum + (item.hours ?? 0), 0);
    const totalDays = group.length;
    summary = `Sickness (${totalHours} hrs)`;
    descriptionParts.push(`Sickness leave. Total days: ${totalDays} (${totalHours} hrs).`);
  } else {
    // Bank Holidays
    if (group.length === 1) {
      summary = first.title;
    } else {
      const titles = group.map((item) => item.title.replace('Bank Holiday: ', ''));
      summary = `Bank Holidays: ${titles.join(', ')}`;
    }
    descriptionParts.push(`Public bank holiday.`);
  }

  // Collect individual notes
  const notes = group
    .filter((item) => item.note && item.note.trim() !== '')
    .map((item) => `${item.date}: ${item.note}`);
  
  if (notes.length > 0) {
    descriptionParts.push('', 'Notes:', ...notes);
  }

  return {
    startDate: first.date,
    endDate: last.date,
    summary,
    description: descriptionParts.join('\n'),
  };
}
