import React from 'react';
import { CalendarDay } from '../../utils/dateUtils';
import { DayRecord, DayType, UserConfig, BankHoliday, PaintTool } from '../../types';
import { Palmtree, Landmark, Coffee, Activity } from 'lucide-react';

interface DayCellProps {
  day: CalendarDay;
  record?: DayRecord;
  bankHoliday?: BankHoliday;
  config: UserConfig;
  isSelected?: boolean;
  activePaintTool?: PaintTool;
  onSelect: (dateStr: string) => void;
  onRightClick?: (dateStr: string) => void;
  onDoubleClick?: (dateStr: string) => void;
  onMouseDown?: (dateStr: string) => void;
  onMouseEnter?: (dateStr: string) => void;
}

export const DayCell: React.FC<DayCellProps> = ({
  day,
  record,
  bankHoliday,
  config,
  isSelected,
  activePaintTool,
  onSelect,
  onRightClick,
  onDoubleClick,
  onMouseDown,
  onMouseEnter,
}) => {
  const { dateStr, dayNumber, isInCurrentMonth, isInFiscalYear, dayOfWeek } = day;

  // Determine effective status
  const isScheduledWorkingDay = config.workingDays.includes(dayOfWeek);
  
  let effectiveType: DayType = isScheduledWorkingDay ? 'working' : 'non_working';
  let hours = isScheduledWorkingDay ? config.dailyDefaultHours : 0;
  let isCustom = false;

  if (record) {
    effectiveType = record.type;
    hours = record.hours;
    isCustom = Boolean(record.isCustomHours);
  }

  // Visual styling based on effective type
  const isVacation = effectiveType === 'vacation';
  const isBankHoliday = effectiveType === 'bank_holiday';
  const isNonWorking = effectiveType === 'non_working';
  const isSickness = effectiveType === 'sickness';
  const isExplicitWorking = effectiveType === 'working' && Boolean(record);

  // If outside current month
  if (!isInCurrentMonth) {
    return (
      <div className="h-14 sm:h-16 p-1 border border-slate-100 bg-slate-50/40 opacity-30 select-none text-xs text-slate-400 flex flex-col justify-between">
        <span className="font-mono">{dayNumber}</span>
      </div>
    );
  }

  let bgClass = 'bg-surface hover:bg-slate-50 border-slate-200';
  let textClass = 'text-slate-700';
  let badgeClass = '';

  if (!isInFiscalYear) {
    bgClass = 'bg-slate-50/70 border-slate-200/60 opacity-60';
    textClass = 'text-slate-400';
  } else if (isVacation) {
    bgClass = 'bg-brand-50 border-brand-300 ring-1 ring-brand-200/50 hover:bg-brand-100/70';
    textClass = 'text-brand-900 font-medium';
    badgeClass = 'bg-brand-600 text-white';
  } else if (isBankHoliday) {
    bgClass = 'bg-accent-50 border-accent-300 ring-1 ring-accent-200/50 hover:bg-accent-100/70';
    textClass = 'text-accent-900 font-medium';
    badgeClass = 'bg-accent-600 text-white';
  } else if (isSickness) {
    bgClass = 'bg-amber-50 border-amber-300 ring-1 ring-amber-200/50 hover:bg-amber-100/70';
    textClass = 'text-amber-900 font-medium';
    badgeClass = 'bg-amber-600 text-white';
  } else if (isNonWorking) {
    bgClass = 'bg-slate-100/80 border-slate-200/90 hover:bg-slate-200/60';
    textClass = 'text-slate-500';
  } else if (isExplicitWorking) {
    bgClass = 'bg-blue-50/60 border-blue-200 hover:bg-blue-100/60';
    textClass = 'text-blue-900';
  }

  if (isSelected) {
    bgClass += ' ring-2 ring-brand-500 z-10';
  }

  // Today marker
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = dateStr === todayStr;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInFiscalYear && onRightClick) {
      onRightClick(dateStr);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    if (isInFiscalYear && onMouseDown) {
      onMouseDown(dateStr);
    }
  };

  const handleMouseEnter = () => {
    if (isInFiscalYear && onMouseEnter) {
      onMouseEnter(dateStr);
    }
  };

  const getTooltip = () => {
    let base = bankHoliday
      ? `UK Bank Holiday: ${bankHoliday.title}`
      : isVacation
      ? `Vacation: ${hours}h`
      : isBankHoliday
      ? `Bank Holiday: ${hours}h`
      : isNonWorking
      ? 'Non-working Day (0h)'
      : `Working Day: ${hours}h`;

    if (activePaintTool && activePaintTool !== 'select') {
      base += `\n• Click to paint as ${activePaintTool.replace('_', ' ')}\n• Right-click to clear`;
    } else {
      base += '\n• Click to edit\n• Right-click to reset';
    }
    return base;
  };

  return (
    <div
      onClick={() => isInFiscalYear && onSelect(dateStr)}
      onContextMenu={handleContextMenu}
      onDoubleClick={() => isInFiscalYear && onDoubleClick && onDoubleClick(dateStr)}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      className={`relative h-14 sm:h-16 p-1 sm:p-1.5 border rounded-md transition-all cursor-pointer flex flex-col justify-between select-none ${bgClass} ${
        !isInFiscalYear ? 'cursor-not-allowed' : ''
      }`}
      title={getTooltip()}
    >
      {/* Top Header: Day Number & Indicators */}
      <div className="flex items-center justify-between gap-0.5">
        <span
          className={`text-xs font-mono font-medium rounded-full w-5 h-5 flex items-center justify-center ${
            isToday
              ? 'bg-brand-600 text-white font-bold'
              : textClass
          }`}
        >
          {dayNumber}
        </span>

        {/* Status icons or Bank Holiday dot */}
        <div className="flex items-center gap-1">
          {bankHoliday && !isBankHoliday && (
            <span
              className="w-2 h-2 rounded-full bg-accent-500 ring-2 ring-surface"
              title={`UK Bank Holiday: ${bankHoliday.title}`}
            />
          )}

          {isVacation && <Palmtree className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
          {isBankHoliday && <Landmark className="w-3.5 h-3.5 text-accent-600 shrink-0" />}
          {isSickness && <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          {isNonWorking && dayOfWeek !== 0 && dayOfWeek !== 6 && (
            <span title="Compressed Day Off">
              <Coffee className="w-3 h-3 text-slate-400 shrink-0" />
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Hours or Label */}
      <div className="flex items-center justify-between text-[10px] leading-tight">
        {isInFiscalYear && (isVacation || isBankHoliday || isSickness || (isExplicitWorking && isCustom)) ? (
          <span className={`px-1 py-0.5 rounded font-mono font-semibold text-[9px] ${badgeClass || 'bg-slate-200 text-slate-700'}`}>
            {hours}h
          </span>
        ) : (
          <span className="text-[9px] text-slate-400 font-mono">
            {isNonWorking ? (dayOfWeek === 0 || dayOfWeek === 6 ? '' : 'OFF') : ''}
          </span>
        )}

        {/* Bank Holiday Name truncation if applicable */}
        {bankHoliday && (
          <span className="text-[9px] text-accent-700 font-medium truncate max-w-[55px]" title={bankHoliday.title}>
            {bankHoliday.title.replace('Bank Holiday', 'BH').replace('bank holiday', 'BH')}
          </span>
        )}
      </div>
    </div>
  );
};
