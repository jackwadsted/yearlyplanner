import React, { useState, useEffect } from 'react';
import { DayRecord, DayType, UserConfig, BankHoliday } from '../../types';
import { formatFriendlyDate } from '../../utils/dateUtils';
import {
  X,
  Palmtree,
  Landmark,
  Briefcase,
  Coffee,
  Activity,
  Trash2,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DayEditModalProps {
  dateStr: string | null;
  currentRecord?: DayRecord;
  bankHoliday?: BankHoliday;
  config: UserConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveRecord: (record: DayRecord) => void;
  onDeleteRecord: (dateStr: string) => void;
}

export const DayEditModal: React.FC<DayEditModalProps> = ({
  dateStr,
  currentRecord,
  bankHoliday,
  config,
  isOpen,
  onClose,
  onSaveRecord,
  onDeleteRecord,
}) => {
  if (!isOpen || !dateStr) return null;

  const dateObj = new Date(dateStr);
  const dayOfWeek = dateObj.getDay();
  const isDefaultWorkingDay = config.workingDays.includes(dayOfWeek);

  const initialType: DayType = currentRecord?.type || (bankHoliday ? 'bank_holiday' : isDefaultWorkingDay ? 'working' : 'non_working');
  const initialHours = currentRecord ? currentRecord.hours : (isDefaultWorkingDay ? config.dailyDefaultHours : 0);

  const [type, setType] = useState<DayType>(initialType);
  const [hours, setHours] = useState<number>(initialHours);
  const [note, setNote] = useState<string>(currentRecord?.note || '');
  const [isCustomHours, setIsCustomHours] = useState<boolean>(Boolean(currentRecord?.isCustomHours));

  // Sync state if date or record changes
  useEffect(() => {
    if (currentRecord) {
      setType(currentRecord.type);
      setHours(currentRecord.hours);
      setNote(currentRecord.note || '');
      setIsCustomHours(Boolean(currentRecord.isCustomHours));
    } else {
      const defaultType = bankHoliday ? 'bank_holiday' : isDefaultWorkingDay ? 'working' : 'non_working';
      setType(defaultType);
      const defaultH = defaultType === 'non_working' ? 0 : config.dailyDefaultHours;
      setHours(defaultH);
      setNote('');
      setIsCustomHours(false);
    }
  }, [dateStr, currentRecord, bankHoliday, isDefaultWorkingDay, config.dailyDefaultHours]);

  const handleTypeSelect = (selectedType: DayType) => {
    setType(selectedType);
    if (!isCustomHours) {
      if (selectedType === 'non_working') {
        setHours(0);
      } else {
        setHours(config.dailyDefaultHours);
      }
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveRecord({
      date: dateStr,
      type,
      hours: Number(hours) || 0,
      isCustomHours: isCustomHours || hours !== config.dailyDefaultHours,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    onDeleteRecord(dateStr);
    onClose();
  };

  const handleQuickPresetHours = (h: number) => {
    setHours(h);
    setIsCustomHours(h !== config.dailyDefaultHours);
  };

  const statusOptions: { type: DayType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    {
      type: 'vacation',
      label: 'Vacation',
      icon: <Palmtree className="w-4 h-4 text-brand-600" />,
      color: 'border-brand-400 bg-brand-50 text-brand-900',
      desc: 'Deducts from vacation allowance',
    },
    {
      type: 'bank_holiday',
      label: 'Bank Holiday',
      icon: <Landmark className="w-4 h-4 text-accent-600" />,
      color: 'border-accent-400 bg-accent-50 text-accent-900',
      desc: 'Deducts from bank holiday allowance',
    },
    {
      type: 'working',
      label: 'Regular Working',
      icon: <Briefcase className="w-4 h-4 text-blue-600" />,
      color: 'border-blue-400 bg-blue-50 text-blue-900',
      desc: 'Counted as normal working hours',
    },
    {
      type: 'non_working',
      label: 'Compressed Day Off',
      icon: <Coffee className="w-4 h-4 text-slate-600" />,
      color: 'border-slate-400 bg-slate-100 text-slate-800',
      desc: 'Standard non-working day (0 hrs)',
    },
    {
      type: 'sickness',
      label: 'Sickness / Absence',
      icon: <Activity className="w-4 h-4 text-amber-600" />,
      color: 'border-amber-400 bg-amber-50 text-amber-900',
      desc: 'Tracked separately',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {formatFriendlyDate(dateStr)}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Scheduled default: {isDefaultWorkingDay ? `${config.dailyDefaultHours}h Work` : 'Day Off (0h)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
          {/* Bank Holiday Banner if recognized */}
          {bankHoliday && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-accent-50 border border-accent-200 text-accent-900 text-xs">
              <Sparkles className="w-4 h-4 text-accent-600 shrink-0" />
              <div>
                <span className="font-semibold">UK Public Bank Holiday:</span> {bankHoliday.title}
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {statusOptions.map((opt) => {
                const active = type === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleTypeSelect(opt.type)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      active
                        ? `${opt.color} ring-2 ring-offset-1 ring-brand-500 font-medium shadow-xs`
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">{opt.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours Input & Quick Presets */}
          {type !== 'non_working' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>Hours Allocated for this Day</span>
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickPresetHours(config.dailyDefaultHours)}
                    className="px-2 py-0.5 rounded bg-surface border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-300 transition-colors font-mono text-[11px]"
                  >
                    Full ({config.dailyDefaultHours}h)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetHours(Math.round((config.dailyDefaultHours / 2) * 100) / 100)}
                    className="px-2 py-0.5 rounded bg-surface border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-300 transition-colors font-mono text-[11px]"
                  >
                    Half ({Math.round((config.dailyDefaultHours / 2) * 100) / 100}h)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => {
                    setHours(parseFloat(e.target.value) || 0);
                    setIsCustomHours(true);
                  }}
                  className="w-32 px-3 py-2 bg-surface border border-slate-300 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <span className="text-xs text-slate-500">
                  hours {hours !== config.dailyDefaultHours ? '(custom override)' : '(standard full day)'}
                </span>
              </div>
            </div>
          )}

          {/* Optional Note Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Notes / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Summer Break, Family Event, Overtime Off..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-surface border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {currentRecord ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset to Default</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:brightness-90 rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Save Entry</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
