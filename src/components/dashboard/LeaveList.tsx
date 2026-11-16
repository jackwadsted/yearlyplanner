import React, { useState } from 'react';
import { DayRecord, DayType } from '../../types';
import { formatFriendlyDate } from '../../utils/dateUtils';
import { Palmtree, Landmark, Activity, Briefcase, Trash2, Edit3, ChevronDown, ChevronUp, Calendar, Info } from 'lucide-react';

interface LeaveListProps {
  dayRecords: Record<string, DayRecord>;
  onEditDate: (dateStr: string) => void;
  onDeleteRecord: (dateStr: string) => void;
}

export const LeaveList: React.FC<LeaveListProps> = ({
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

  const filteredRecords = allLeaveRecords.filter((r) =>
    filterType === 'all' ? true : r.type === filterType
  );

  const getTypeBadge = (type: DayType) => {
    switch (type) {
      case 'vacation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Palmtree className="w-3 h-3" />
            <span>Vacation</span>
          </span>
        );
      case 'bank_holiday':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-teal-600" />
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
                {['all', 'vacation', 'bank_holiday', 'sickness'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      filterType === t
                        ? 'bg-slate-800 text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.replace('_', ' ')}
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
                          No {filterType.replace('_', ' ')} entries logged.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => (
                        <tr key={r.date} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {formatFriendlyDate(r.date)}
                          </td>
                          <td className="py-2.5 px-3">{getTypeBadge(r.type)}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                            {r.hours}h
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                            {r.note || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1">
                            <button
                              onClick={() => onEditDate(r.date)}
                              className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
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
