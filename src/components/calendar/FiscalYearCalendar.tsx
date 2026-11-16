import React, { useMemo } from 'react';
import { getFiscalYearMonths } from '../../utils/dateUtils';
import { getFiscalYearKey } from '../../utils/calculator';
import { DayRecord, UserConfig, BankHoliday, PaintTool } from '../../types';
import { MonthCard } from './MonthCard';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Palmtree,
  Landmark,
  Coffee,
  Briefcase,
  Activity,
  Eraser,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';

interface FiscalYearCalendarProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  dayRecords: Record<string, DayRecord>;
  bankHolidays: BankHoliday[];
  config: UserConfig;
  selectedDate?: string;
  activePaintTool: PaintTool;
  onSelectPaintTool: (tool: PaintTool) => void;
  onSelectDate: (dateStr: string) => void;
  onRightClickDate: (dateStr: string) => void;
  onDoubleClickDate: (dateStr: string) => void;
}

export const FiscalYearCalendar: React.FC<FiscalYearCalendarProps> = ({
  selectedYear,
  onYearChange,
  dayRecords,
  bankHolidays,
  config,
  selectedDate,
  activePaintTool,
  onSelectPaintTool,
  onSelectDate,
  onRightClickDate,
  onDoubleClickDate,
}) => {
  const months = useMemo(() => getFiscalYearMonths(selectedYear), [selectedYear]);

  const bankHolidaysMap = useMemo(() => {
    const map: Record<string, BankHoliday> = {};
    for (const h of bankHolidays) {
      map[h.date] = h;
    }
    return map;
  }, [bankHolidays]);

  const fyKey = getFiscalYearKey(selectedYear);

  const tools: {
    tool: PaintTool;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
    idleClass: string;
  }[] = [
    {
      tool: 'select',
      label: 'Inspect / Edit',
      icon: <MousePointerClick className="w-3.5 h-3.5" />,
      activeClass: 'bg-strong text-white border-strong shadow-sm ring-2 ring-slate-400/40',
      idleClass: 'bg-surface text-slate-700 border-slate-200 hover:bg-slate-50',
    },
    {
      tool: 'vacation',
      label: 'Vacation',
      icon: <Palmtree className="w-3.5 h-3.5" />,
      activeClass: 'bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-400/50',
      idleClass: 'bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100/70',
    },
    {
      tool: 'bank_holiday',
      label: 'Bank Holiday',
      icon: <Landmark className="w-3.5 h-3.5" />,
      activeClass: 'bg-accent-600 text-white border-accent-600 shadow-sm ring-2 ring-accent-400/50',
      idleClass: 'bg-accent-50 text-accent-800 border-accent-200 hover:bg-accent-100/70',
    },
    {
      tool: 'non_working',
      label: 'Day Off',
      icon: <Coffee className="w-3.5 h-3.5" />,
      activeClass: 'bg-strong-soft text-white border-strong-soft shadow-sm ring-2 ring-slate-400/40',
      idleClass: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
    },
    {
      tool: 'working',
      label: 'Working',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      activeClass: 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40',
      idleClass: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
    },
    {
      tool: 'sickness',
      label: 'Sickness',
      icon: <Activity className="w-3.5 h-3.5" />,
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40',
      idleClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    },
    {
      tool: 'eraser',
      label: 'Clear / Reset',
      icon: <Eraser className="w-3.5 h-3.5 text-rose-600" />,
      activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-400/40',
      idleClass: 'bg-surface text-rose-700 border-rose-200 hover:bg-rose-50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Calendar Top Control Bar */}
      <div className="bg-surface rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Year Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => onYearChange(selectedYear - 1)}
              className="p-1.5 rounded-lg hover:bg-surface hover:shadow-2xs text-slate-600 hover:text-slate-900 transition-all"
              title="Previous Fiscal Year"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-3 font-semibold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-brand-600" />
              <span>FY {fyKey}</span>
            </div>
            <button
              onClick={() => onYearChange(selectedYear + 1)}
              className="p-1.5 rounded-lg hover:bg-surface hover:shadow-2xs text-slate-600 hover:text-slate-900 transition-all"
              title="Next Fiscal Year"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            6 April {selectedYear} – 5 April {selectedYear + 1}
          </div>
        </div>

        {/* Interactive Paint Toolbar / Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {tools.map((t) => {
              const isActive = activePaintTool === t.tool;
              return (
                <button
                  key={t.tool}
                  type="button"
                  onClick={() => onSelectPaintTool(t.tool)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-semibold text-xs transition-all select-none cursor-pointer ${
                    isActive ? t.activeClass : t.idleClass
                  }`}
                  title={
                    t.tool === 'select'
                      ? 'Inspect / Edit Mode (click to open details modal)'
                      : t.tool === 'eraser'
                      ? 'Eraser: click any day to clear back to default schedule'
                      : `Paint Brush: click any day to mark as ${t.label}`
                  }
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Helper notice */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span>
            {activePaintTool === 'select'
              ? 'Click any day to edit details/custom hours. Right-click any day to instantly reset.'
              : `Active Brush: "${activePaintTool.replace('_', ' ').toUpperCase()}". Click days to paint. Right-click to clear.`}
          </span>
        </div>
        <div className="hidden sm:block text-[11px] text-slate-400">
          Double-click any day to open full custom details
        </div>
      </div>

      {/* 3-Month Wide Fiscal Grid (Clean & Spacious) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {months.map((m) => (
          <MonthCard
            key={m.name}
            monthInfo={m}
            dayRecords={dayRecords}
            bankHolidaysMap={bankHolidaysMap}
            config={config}
            selectedDate={selectedDate}
            activePaintTool={activePaintTool}
            onSelectDate={onSelectDate}
            onRightClickDate={onRightClickDate}
            onDoubleClickDate={onDoubleClickDate}
          />
        ))}
      </div>
    </div>
  );
};
