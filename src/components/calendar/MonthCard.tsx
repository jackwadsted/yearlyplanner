import React from 'react';
import { MonthInfo } from '../../utils/dateUtils';
import { DayRecord, UserConfig, BankHoliday, PaintTool, ExtraAllowance } from '../../types';
import { DayCell } from './DayCell';

interface MonthCardProps {
  monthInfo: MonthInfo;
  dayRecords: Record<string, DayRecord>;
  extraAllowances: ExtraAllowance[];
  bankHolidaysMap: Record<string, BankHoliday>;
  config: UserConfig;
  selectedDate?: string;
  activePaintTool?: PaintTool;
  onSelectDate: (dateStr: string) => void;
  onRightClickDate?: (dateStr: string) => void;
  onDoubleClickDate?: (dateStr: string) => void;
  onMouseDownDate?: (dateStr: string) => void;
  onMouseEnterDate?: (dateStr: string) => void;
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MonthCard: React.FC<MonthCardProps> = ({
  monthInfo,
  dayRecords,
  extraAllowances,
  bankHolidaysMap,
  config,
  selectedDate,
  activePaintTool,
  onSelectDate,
  onRightClickDate,
  onDoubleClickDate,
  onMouseDownDate,
  onMouseEnterDate,
}) => {
  const { name, days } = monthInfo;

  // Calculate monthly metrics
  let monthlyVacationHours = 0;
  let monthlyBankHolidayHours = 0;

  for (const day of days) {
    if (day.isInCurrentMonth && day.isInFiscalYear) {
      const rec = dayRecords[day.dateStr];
      if (rec?.type === 'vacation') {
        monthlyVacationHours += rec.hours;
      } else if (rec?.type === 'bank_holiday') {
        monthlyBankHolidayHours += rec.hours;
      }
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-slate-200/80 shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* Month Card Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
          <span>{name}</span>
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          {monthlyVacationHours > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 font-medium border border-brand-200/60" title="Vacation hours in this month">
              {monthlyVacationHours}h vac
            </span>
          )}
          {monthlyBankHolidayHours > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-accent-50 text-accent-700 font-medium border border-accent-200/60" title="Bank Holiday hours in this month">
              {monthlyBankHolidayHours}h BH
            </span>
          )}
        </div>
      </div>

      {/* Weekday Labels (Mon - Sun) */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {WEEKDAY_NAMES.map((w, idx) => {
          const isWeekend = idx >= 5;
          const dayNum = (idx + 1) % 7;
          const isConfigWorking = config.workingDays.includes(dayNum);
          return (
            <div
              key={w}
              className={`text-[10px] font-semibold tracking-wider uppercase py-0.5 ${
                isConfigWorking
                  ? 'text-slate-600'
                  : isWeekend
                  ? 'text-slate-400'
                  : 'text-amber-700/80'
              }`}
              title={isConfigWorking ? 'Working day' : 'Scheduled day off'}
            >
              {w}
            </div>
          );
        })}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <DayCell
            key={day.dateStr + (day.isInCurrentMonth ? '-curr' : '-pad')}
            day={day}
            record={dayRecords[day.dateStr]}
            extraAllowances={extraAllowances}
            bankHoliday={bankHolidaysMap[day.dateStr]}
            config={config}
            isSelected={selectedDate === day.dateStr}
            activePaintTool={activePaintTool}
            onSelect={onSelectDate}
            onRightClick={onRightClickDate}
            onDoubleClick={onDoubleClickDate}
            onMouseDown={onMouseDownDate}
            onMouseEnter={onMouseEnterDate}
          />
        ))}
      </div>
    </div>
  );
};
