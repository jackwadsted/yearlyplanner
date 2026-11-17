import React, { useEffect, useMemo, useState } from 'react';
import { X, Lightbulb, Palmtree, Landmark, Check, Sparkles } from 'lucide-react';
import { BankHoliday, DayRecord, UserConfig } from '../../types';
import { findVacationSuggestions, VacationSuggestion } from '../../utils/suggestions';
import { formatFriendlyDate } from '../../utils/dateUtils';

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  selectedYear: number;
  dayRecords: Record<string, DayRecord>;
  bankHolidays: BankHoliday[];
  remainingVacationHours: number;
  onApplySuggestion: (dates: string[]) => void;
}

function pluralise(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({
  isOpen,
  onClose,
  config,
  selectedYear,
  dayRecords,
  bankHolidays,
  remainingVacationHours,
  onApplySuggestion,
}) => {
  const suggestions = useMemo<VacationSuggestion[]>(
    () =>
      isOpen
        ? findVacationSuggestions({
            selectedYear,
            config,
            dayRecords,
            bankHolidays,
            remainingVacationHours,
          })
        : [],
    [isOpen, selectedYear, config, dayRecords, bankHolidays, remainingVacationHours]
  );

  // Brief fake "thinking" state each time the dialog opens
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-surface rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Suggested Breaks</h2>
              <p className="text-[11px] text-slate-500">
                Long stretches off for the least vacation, using bank holidays and your days off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close suggestions"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
              <div className="relative">
                <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
                <Lightbulb className="absolute -right-3 -bottom-2 w-5 h-5 text-amber-600 animate-bounce" />
              </div>
              <p className="text-xs font-medium text-slate-600 animate-pulse">
                Finding your best breaks...
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-xs text-slate-500">
              No worthwhile breaks found for the rest of FY {selectedYear}/{String((selectedYear + 1) % 100).padStart(2, '0')}
              {' '}with your remaining vacation allowance.
            </p>
          ) : (
            suggestions.map((s) => (
              <div
                key={s.startDate}
                className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">
                    {pluralise(s.totalDaysOff, 'day')} off for just{' '}
                    <span className="text-brand-700">{pluralise(s.vacationDates.length, 'vacation day')}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {formatFriendlyDate(s.startDate)} – {formatFriendlyDate(s.endDate)}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60 font-mono">
                      <Palmtree className="w-3 h-3" />
                      Book: {s.vacationDates.map((d) => formatFriendlyDate(d).replace(/ \d{4}$/, '')).join(', ')} ({s.vacationHours}h)
                    </span>
                    {s.holidayNames.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent-50 text-accent-700 border border-accent-200/60">
                        <Landmark className="w-3 h-3" />
                        {s.holidayNames.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onApplySuggestion(s.vacationDates)}
                  className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Book it</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
