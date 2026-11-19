import React, { useState } from 'react';
import { DayRecord, DayType, ExtraAllowance } from '../../types';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { bucketInitial } from '../../utils/extraAllowance';
import { Palmtree, Landmark, Activity, Briefcase, Trash2, Edit3, ChevronDown, ChevronUp, Calendar, Info } from 'lucide-react';

interface LeaveListProps {
  extraAllowances: ExtraAllowance[];
  dayRecords: Record<string, DayRecord>;
  onEditDate: (dateStr: string) => void;
  onDeleteRecord: (dateStr: string) => void;
}

export const LeaveList: React.FC<LeaveListProps> = ({
  extraAllowances,
  dayRecords,
  onEditDate,
  onDeleteRecord,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Filter and sort entries chronologically
  const allLeaveRecords = Object.values(dayRecords)
    .filter((r) => r.type === 'vacation' || r.type === 'bank_holiday' || r.type === 'sickness')
    .sort((a, b) => a.date.localeCompare(b.date));

  // A vacation record belongs to a bucket only if that bucket still exists
  const getExtraLabel = (r: DayRecord) =>
    r.type === 'vacation' ? extraAllowances.find((x) => x.id === r.extraAllowanceId)?.label : undefined;

  // Filters: 'all' | DayType | 'vacation_normal' | bucket id
  const filterOptions: { key: string; label: string }[] = [
    { key: 'all', label: 'all' },
    { key: 'vacation', label: 'vacation' },
    ...(extraAllowances.length > 0 ? [{ key: 'vacation_normal', label: 'normal vacation' }] : []),
    ...extraAllowances.map((x) => ({ key: x.id, label: x.label })),
    { key: 'bank_holiday', label: 'bank holiday' },
    { key: 'sickness', label: 'sickness' },
  ];

  const activeFilter = filterOptions.some((o) => o.key === filterType) ? filterType : 'all';

  const filteredRecords = allLeaveRecords.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'vacation_normal') return r.type === 'vacation' && !getExtraLabel(r);
    if (extraAllowances.some((x) => x.id === activeFilter)) return r.extraAllowanceId === activeFilter && r.type === 'vacation';
    return r.type === activeFilter;
  });

  const getTypeBadge = (type: DayType, extraLabel?: string) => {
    switch (type) {
      case 'vacation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            {extraLabel ? (
              <span className="w-3 h-3 rounded-sm bg-brand-600 text-white text-[8px] font-bold leading-none flex items-center justify-center">
                {bucketInitial(extraLabel)}
              </span>
            ) : (
              <Palmtree className="w-3 h-3" />
            )}
            <span>{extraLabel ? `Vacation · ${extraLabel}` : 'Vacation'}</span>
          </span>
        );
      case 'bank_holiday':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-50 text-accent-700 border border-accent-200">
            <Landmark className="w-3 h-3" />
            <span>Bank Holiday</span>
          </span>
        );
      case 'sickness':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Activity className="w-3 h-3" />
            <span>Sickness</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            <Briefcase className="w-3 h-3" />
            <span>Work</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-800">
            Logged Leave & Absences
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-medium">
            {allLeaveRecords.length} {allLeaveRecords.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs text-slate-500 hidden sm:inline">
            {isExpanded ? 'Hide breakdown' : 'View breakdown'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-5 space-y-3">
          {allLeaveRecords.length === 0 ? (
            <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>No vacation or absence days logged for this fiscal year yet.</span>
              <span className="text-slate-400 text-[11px]">Click any date on the calendar above or use the brush toolbar to mark leave.</span>
            </div>
          ) : (
            <>
              {/* Filter Bar */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Filter:</span>
                {filterOptions.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => setFilterType(o.key)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      activeFilter === o.key
                        ? 'bg-strong text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 font-mono">Hours</th>
                      <th className="py-2 px-3">Notes</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400 text-xs">
                          No matching entries logged.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => (
                        <tr key={r.date} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {formatFriendlyDate(r.date)}
                          </td>
                          <td className="py-2.5 px-3">{getTypeBadge(r.type, getExtraLabel(r))}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                            {r.hours}h
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                            {r.note || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1">
                            <button
                              onClick={() => onEditDate(r.date)}
                              className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Edit entry"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRecord(r.date)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
