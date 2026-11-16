import React from 'react';
import { AllowanceSummary, UserConfig } from '../../types';
import { Palmtree, Landmark, Clock, CalendarDays, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

interface AllowanceDashboardProps {
  summary: AllowanceSummary;
  config: UserConfig;
  onOpenAdjustments: () => void;
  onOpenSettings: () => void;
}

export const AllowanceDashboard: React.FC<AllowanceDashboardProps> = ({
  summary,
  config,
  onOpenAdjustments,
  onOpenSettings,
}) => {
  const vacationPercentUsed = summary.vacationTotalAllowanceHours > 0
    ? Math.min(100, Math.round((summary.vacationTakenHours / summary.vacationTotalAllowanceHours) * 100))
    : 0;

  const bankHolidayPercentUsed = summary.bankHolidayTotalAllowanceHours > 0
    ? Math.min(100, Math.round((summary.bankHolidayTakenHours / summary.bankHolidayTotalAllowanceHours) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner / Pro-Rata Formula Indicator */}
      <div className="theme-fixed bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-brand-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-200 text-[11px] font-mono font-semibold border border-brand-400/30">
              FY {summary.fiscalYear}
            </span>
            <span className="text-xs text-brand-200/80">
              Compressed Pattern: {config.weeklyHours}h / week ({config.workingDays.length} days @ {config.dailyDefaultHours}h)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{config.name || 'Vacation & Leave Tracker'}</span>
          </h1>
          <p className="text-xs text-brand-100/70 mt-1 max-w-xl">
            Pro-rata calculation: <span className="font-mono text-brand-200">{config.fullTimeVacationDays} days × {config.weeklyHours}h / 5 = {summary.vacationBaseHours}h</span> vacation entitlement.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAdjustments}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-100 text-xs font-semibold border border-brand-400/30 transition-all"
            title="Add bonus hours, carryover or manual adjustments"
          >
            <PlusCircle className="w-4 h-4 text-brand-300" />
            <span>Adjust Balance</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all"
          >
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Vacation Allowance */}
        <div className="bg-surface rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between hover:border-brand-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-50 border border-brand-200/70 text-brand-600">
                  <Palmtree className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Vacation Allowance</h2>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Total: {summary.vacationTotalAllowanceHours}h ({summary.vacationTotalDaysEquivalent} days)
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                {vacationPercentUsed}% used
              </span>
            </div>

            {/* Big Numbers */}
            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {summary.vacationRemainingHours}
                </span>
                <span className="text-xs font-medium text-slate-500 ml-1">hrs left</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-brand-700 font-mono">
                  {summary.vacationRemainingDaysEquivalent}
                </span>
                <span className="text-xs text-slate-500 ml-1">days left</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
              <div
                className="bg-brand-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${vacationPercentUsed}%` }}
              />
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Base Pro-Rata Entitlement:</span>
              <span className="font-semibold">{summary.vacationBaseHours}h</span>
            </div>
            {summary.vacationAdjustmentHours !== 0 && (
              <div className="flex justify-between text-brand-700">
                <span>Adjustments / Carry-over:</span>
                <span className="font-semibold">
                  {summary.vacationAdjustmentHours > 0 ? `+${summary.vacationAdjustmentHours}` : summary.vacationAdjustmentHours}h
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Vacation Taken / Booked:</span>
              <span className="font-semibold text-rose-600">-{summary.vacationTakenHours}h ({summary.vacationTakenDaysEquivalent}d)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bank Holiday Balance */}
        <div className="bg-surface rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between hover:border-accent-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent-50 border border-accent-200/70 text-accent-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Bank Holiday Balance</h2>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Total: {summary.bankHolidayTotalAllowanceHours}h ({summary.bankHolidayTotalDaysEquivalent} days)
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200/60">
                {bankHolidayPercentUsed}% used
              </span>
            </div>

            {/* Big Numbers */}
            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {summary.bankHolidayRemainingHours}
                </span>
                <span className="text-xs font-medium text-slate-500 ml-1">hrs left</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-accent-700 font-mono">
                  {summary.bankHolidayRemainingDaysEquivalent}
                </span>
                <span className="text-xs text-slate-500 ml-1">days left</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
              <div
                className="bg-accent-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${bankHolidayPercentUsed}%` }}
              />
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Base Pro-Rata Allowance:</span>
              <span className="font-semibold">{summary.bankHolidayBaseHours}h</span>
            </div>
            {summary.bankHolidayAdjustmentHours !== 0 && (
              <div className="flex justify-between text-accent-700">
                <span>Adjustments:</span>
                <span className="font-semibold">
                  {summary.bankHolidayAdjustmentHours > 0 ? `+${summary.bankHolidayAdjustmentHours}` : summary.bankHolidayAdjustmentHours}h
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Holidays Taken:</span>
              <span className="font-semibold text-rose-600">-{summary.bankHolidayTakenHours}h ({summary.bankHolidayTakenDaysEquivalent}d)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Working Pattern & Quick Status */}
        <div className="bg-surface rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">Schedule Pattern</h2>
                <div className="text-[11px] text-slate-500">
                  {config.region.replace(/-/g, ' ').toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 my-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Standard Daily Shift:</span>
                </span>
                <span className="font-mono font-bold text-slate-800">{config.dailyDefaultHours} hours</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <span className="text-slate-600">Contract Weekly Hours:</span>
                <span className="font-mono font-bold text-slate-800">{config.weeklyHours}h (Base: {config.fullTimeWeeklyHours}h)</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <span className="text-slate-600">Working Days / Week:</span>
                <span className="font-bold text-slate-800">{config.workingDays.length} days</span>
              </div>
            </div>
          </div>

          {summary.totalSicknessDays > 0 ? (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 font-mono bg-amber-50/60 p-2 rounded-lg">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Sickness Logged:</span>
              </span>
              <span className="font-bold">{summary.totalSicknessHours}h ({summary.totalSicknessDays}d)</span>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span>All allowances synced</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
