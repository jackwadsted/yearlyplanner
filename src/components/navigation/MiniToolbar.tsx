import React from 'react';
import { AllowanceSummary, PaintTool } from '../../types';
import {
  MousePointerClick,
  Palmtree,
  Landmark,
  Coffee,
  Briefcase,
  Activity,
  Eraser,
  ChevronUp,
  PlusCircle,
} from 'lucide-react';

interface MiniToolbarProps {
  summary: AllowanceSummary;
  activePaintTool: PaintTool;
  onSelectPaintTool: (tool: PaintTool) => void;
  onOpenAdjustments?: () => void;
  onScrollToTop?: () => void;
  isVisible: boolean;
}

export const MiniToolbar: React.FC<MiniToolbarProps> = ({
  summary,
  activePaintTool,
  onSelectPaintTool,
  onOpenAdjustments,
  onScrollToTop,
  isVisible,
}) => {
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
      icon: <MousePointerClick className="w-4 h-4" />,
      activeClass: 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-400/50 scale-105',
      idleClass: 'bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100 hover:text-slate-900',
    },
    {
      tool: 'vacation',
      label: 'Vacation',
      icon: <Palmtree className="w-4 h-4" />,
      activeClass: 'bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-400/50 scale-105',
      idleClass: 'bg-teal-50 text-teal-800 border-teal-200/90 hover:bg-teal-100/80',
    },
    {
      tool: 'bank_holiday',
      label: 'Bank Holiday',
      icon: <Landmark className="w-4 h-4" />,
      activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-400/50 scale-105',
      idleClass: 'bg-indigo-50 text-indigo-800 border-indigo-200/90 hover:bg-indigo-100/80',
    },
    {
      tool: 'non_working',
      label: 'Day Off',
      icon: <Coffee className="w-4 h-4" />,
      activeClass: 'bg-slate-700 text-white border-slate-700 shadow-xs ring-2 ring-slate-400/50 scale-105',
      idleClass: 'bg-slate-100 text-slate-700 border-slate-200/90 hover:bg-slate-200',
    },
    {
      tool: 'working',
      label: 'Working Day',
      icon: <Briefcase className="w-4 h-4" />,
      activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/50 scale-105',
      idleClass: 'bg-blue-50 text-blue-800 border-blue-200/90 hover:bg-blue-100',
    },
    {
      tool: 'sickness',
      label: 'Sickness',
      icon: <Activity className="w-4 h-4" />,
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/50 scale-105',
      idleClass: 'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100',
    },
    {
      tool: 'eraser',
      label: 'Clear / Reset',
      icon: <Eraser className="w-4 h-4 text-rose-600 group-hover:text-rose-700" />,
      activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-400/50 scale-105 [&>svg]:text-white',
      idleClass: 'bg-rose-50 text-rose-700 border-rose-200/90 hover:bg-rose-100/80',
    },
  ];

  const vacationPercentUsed = summary.vacationTotalAllowanceHours > 0
    ? Math.min(100, Math.round((summary.vacationTakenHours / summary.vacationTotalAllowanceHours) * 100))
    : 0;

  const bankHolidayPercentUsed = summary.bankHolidayTotalAllowanceHours > 0
    ? Math.min(100, Math.round((summary.bankHolidayTakenHours / summary.bankHolidayTotalAllowanceHours) * 100))
    : 0;

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl transition-all duration-300 ease-out transform ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-12 opacity-0 pointer-events-none'
      }`}
      role="toolbar"
      aria-label="Calendar Mini Navigation & Painting Toolbar"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Streamlined Allowances Summary */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 overflow-x-auto py-0.5 scrollbar-none">
          {/* Fiscal Year Label */}
          <span className="hidden xl:inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-semibold text-[11px] border border-slate-200">
            FY {summary.fiscalYear}
          </span>

          {/* Vacation Streamlined Allowance */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50/80 border border-teal-200/70 text-slate-800 text-xs"
            title={`Vacation: ${summary.vacationRemainingHours}h remaining of ${summary.vacationTotalAllowanceHours}h total (${vacationPercentUsed}% used)`}
          >
            <Palmtree className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <div className="flex items-baseline gap-1">
              <span className="font-bold font-mono text-teal-950 text-xs sm:text-sm">
                {summary.vacationRemainingHours}h
              </span>
              <span className="text-[11px] text-teal-700 font-medium hidden sm:inline">
                ({summary.vacationRemainingDaysEquivalent}d) left
              </span>
            </div>
            <div className="hidden md:block w-12 bg-teal-200/60 rounded-full h-1.5 overflow-hidden ml-1">
              <div
                className="bg-teal-600 h-1.5 rounded-full"
                style={{ width: `${vacationPercentUsed}%` }}
              />
            </div>
          </div>

          {/* Bank Holiday Streamlined Allowance */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50/80 border border-indigo-200/70 text-slate-800 text-xs"
            title={`Bank Holidays: ${summary.bankHolidayRemainingHours}h remaining of ${summary.bankHolidayTotalAllowanceHours}h total (${bankHolidayPercentUsed}% used)`}
          >
            <Landmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div className="flex items-baseline gap-1">
              <span className="font-bold font-mono text-indigo-950 text-xs sm:text-sm">
                {summary.bankHolidayRemainingHours}h
              </span>
              <span className="text-[11px] text-indigo-700 font-medium hidden sm:inline">
                ({summary.bankHolidayRemainingDaysEquivalent}d) left
              </span>
            </div>
            <div className="hidden md:block w-12 bg-indigo-200/60 rounded-full h-1.5 overflow-hidden ml-1">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${bankHolidayPercentUsed}%` }}
              />
            </div>
          </div>

          {/* Sickness if any */}
          {summary.totalSicknessHours > 0 && (
            <div
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-mono"
              title={`Sickness logged: ${summary.totalSicknessHours} hours`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold">{summary.totalSicknessHours}h</span>
            </div>
          )}

          {/* Quick Adjustments Link */}
          {onOpenAdjustments && (
            <button
              onClick={onOpenAdjustments}
              className="hidden lg:flex items-center gap-1 p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Add carryover or bonus leave"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Painting Buttons (Just Icons) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="h-5 w-px bg-slate-200 hidden sm:block mx-0.5" />

          <div className="flex items-center gap-1 sm:gap-1.5">
            {tools.map((t) => {
              const isActive = activePaintTool === t.tool;
              return (
                <button
                  key={t.tool}
                  type="button"
                  onClick={() => onSelectPaintTool(t.tool)}
                  className={`group p-2 sm:p-2 rounded-xl border text-xs font-semibold transition-all select-none cursor-pointer flex items-center justify-center ${
                    isActive ? t.activeClass : t.idleClass
                  }`}
                  title={
                    t.tool === 'select'
                      ? 'Inspect / Edit (click days for full dialog)'
                      : t.tool === 'eraser'
                      ? 'Eraser: click day to reset'
                      : `Paint Brush: ${t.label}`
                  }
                  aria-label={t.label}
                  aria-pressed={isActive}
                >
                  {t.icon}
                </button>
              );
            })}
          </div>

          {/* Scroll to Top Button */}
          {onScrollToTop && (
            <>
              <div className="h-5 w-px bg-slate-200 hidden sm:block mx-0.5" />
              <button
                type="button"
                onClick={onScrollToTop}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                title="Scroll back to top dashboard"
                aria-label="Scroll to top"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
