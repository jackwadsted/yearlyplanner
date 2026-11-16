import React, { useState } from 'react';
import { UserConfig, UKRegion } from '../../types';
import {
  X,
  Settings,
  Clock,
  Calendar,
  Download,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  config: UserConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (config: UserConfig) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetFiscalYear: () => void;
}

const WEEKDAYS = [
  { dayNum: 1, label: 'Mon', full: 'Monday' },
  { dayNum: 2, label: 'Tue', full: 'Tuesday' },
  { dayNum: 3, label: 'Wed', full: 'Wednesday' },
  { dayNum: 4, label: 'Thu', full: 'Thursday' },
  { dayNum: 5, label: 'Fri', full: 'Friday' },
  { dayNum: 6, label: 'Sat', full: 'Saturday' },
  { dayNum: 0, label: 'Sun', full: 'Sunday' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isOpen,
  onClose,
  onSaveConfig,
  onExportBackup,
  onImportBackup,
  onResetFiscalYear,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(config.name);
  const [weeklyHours, setWeeklyHours] = useState(config.weeklyHours);
  const [fullTimeWeeklyHours, setFullTimeWeeklyHours] = useState(config.fullTimeWeeklyHours);
  const [fullTimeVacationDays, setFullTimeVacationDays] = useState(config.fullTimeVacationDays);
  const [fullTimeBankHolidays, setFullTimeBankHolidays] = useState(config.fullTimeBankHolidays);
  const [workingDays, setWorkingDays] = useState<number[]>(config.workingDays);
  const [dailyDefaultHours, setDailyDefaultHours] = useState(config.dailyDefaultHours);
  const [region, setRegion] = useState<UKRegion>(config.region);
  const [activeTab, setActiveTab] = useState<'profile' | 'data'>('profile');

  // Handle working day toggle
  const toggleWorkingDay = (dayNum: number) => {
    let updated: number[];
    if (workingDays.includes(dayNum)) {
      if (workingDays.length <= 1) return; // Prevent 0 working days
      updated = workingDays.filter((d) => d !== dayNum);
    } else {
      updated = [...workingDays, dayNum].sort((a, b) => a - b);
    }
    setWorkingDays(updated);

    // Auto-update daily hours if standard
    if (updated.length > 0) {
      const autoHours = Math.round((weeklyHours / updated.length) * 100) / 100;
      setDailyDefaultHours(autoHours);
    }
  };

  const handleWeeklyHoursChange = (val: number) => {
    setWeeklyHours(val);
    if (workingDays.length > 0) {
      const autoHours = Math.round((val / workingDays.length) * 100) / 100;
      setDailyDefaultHours(autoHours);
    }
  };

  const applyPreset = (preset: {
    weeklyHours: number;
    fullTimeWeeklyHours: number;
    workingDays: number[];
    dailyDefaultHours: number;
  }) => {
    setWeeklyHours(preset.weeklyHours);
    setFullTimeWeeklyHours(preset.fullTimeWeeklyHours);
    setWorkingDays(preset.workingDays);
    setDailyDefaultHours(preset.dailyDefaultHours);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      name: name.trim() || 'My Schedule',
      weeklyHours: Number(weeklyHours) || 33,
      fullTimeWeeklyHours: Number(fullTimeWeeklyHours) || 37.5,
      fullTimeVacationDays: Number(fullTimeVacationDays) || 26,
      fullTimeBankHolidays: Number(fullTimeBankHolidays) || 8,
      workingDays,
      dailyDefaultHours: Number(dailyDefaultHours) || 8.25,
      region,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      onClose();
    }
  };

  // Preview pro-rata calculations
  const previewVacationHours = Math.round(((fullTimeVacationDays * weeklyHours) / 5) * 100) / 100;
  const previewBankHolidayHours = Math.round(((fullTimeBankHolidays * weeklyHours) / 5) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Planner Settings & Schedule</h2>
              <p className="text-xs text-slate-500">Configure weekly hours, working days, and allowances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Working Schedule & Entitlements
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Data Backup & File Storage
          </button>
        </div>

        {/* Tab 1: Profile & Schedule */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Quick Setup Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      weeklyHours: 33,
                      fullTimeWeeklyHours: 37.5,
                      workingDays: [1, 2, 3, 4],
                      dailyDefaultHours: 8.25,
                    })
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/50 text-left transition-all"
                >
                  <div className="text-xs font-semibold text-slate-800">33h (Mon-Thu)</div>
                  <div className="text-[10px] text-slate-500">8.25h/day, Fri Off</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      weeklyHours: 33,
                      fullTimeWeeklyHours: 37.5,
                      workingDays: [2, 3, 4, 5],
                      dailyDefaultHours: 8.25,
                    })
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/50 text-left transition-all"
                >
                  <div className="text-xs font-semibold text-slate-800">33h (Tue-Fri)</div>
                  <div className="text-[10px] text-slate-500">8.25h/day, Mon Off</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      weeklyHours: 36,
                      fullTimeWeeklyHours: 40,
                      workingDays: [1, 2, 3, 4],
                      dailyDefaultHours: 9.0,
                    })
                  }
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/50 text-left transition-all"
                >
                  <div className="text-xs font-semibold text-slate-800">36h / 40h Base</div>
                  <div className="text-[10px] text-slate-500">4 days @ 9.0h/day</div>
                </button>
              </div>
            </div>

            {/* Profile / Schedule Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Schedule / Profile Title
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Compressed Schedule"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Contract & Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Contract Weekly Hours
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="60"
                    value={weeklyHours}
                    onChange={(e) => handleWeeklyHoursChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-20 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute right-8 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">hrs/wk</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full-Time Base Contract Hours
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="60"
                    value={fullTimeWeeklyHours}
                    onChange={(e) => setFullTimeWeeklyHours(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-20 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute right-8 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">hrs/wk</span>
                </div>
              </div>
            </div>

            {/* Standard Working Days Checkbox Strip */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Standard Working Days ({workingDays.length} days active)
              </label>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {WEEKDAYS.map((w) => {
                  const isActive = workingDays.includes(w.dayNum);
                  return (
                    <button
                      key={w.dayNum}
                      type="button"
                      onClick={() => toggleWorkingDay(w.dayNum)}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs ring-1 ring-teal-500'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                      title={`${w.full}: ${isActive ? 'Working Day' : 'Day Off'}`}
                    >
                      <div>{w.label}</div>
                      <div className="text-[9px] opacity-80 mt-0.5">{isActive ? 'WORK' : 'OFF'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Hours & Shift Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Standard Shift Daily Hours</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="24"
                    value={dailyDefaultHours}
                    onChange={(e) => setDailyDefaultHours(parseFloat(e.target.value) || 0)}
                    className="w-full pl-3 pr-20 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="absolute right-8 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">hrs/day</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>UK Bank Holiday Region</span>
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as UKRegion)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="england-and-wales">England & Wales</option>
                  <option value="scotland">Scotland</option>
                  <option value="northern-ireland">Northern Ireland</option>
                </select>
              </div>
            </div>

            {/* Full Time Entitlement Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full-Time Vacation Days Entitlement
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={fullTimeVacationDays}
                  onChange={(e) => setFullTimeVacationDays(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full-Time Bank Holiday Days
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={fullTimeBankHolidays}
                  onChange={(e) => setFullTimeBankHolidays(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/80 text-xs text-teal-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-teal-800">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Calculated Pro-Rata Entitlements</span>
              </div>
              <div className="font-mono text-[11px] text-teal-900/90 pt-1">
                • Vacation: {fullTimeVacationDays} days × {weeklyHours}h / 5 = <strong className="text-teal-950 font-bold">{previewVacationHours} hours</strong> ({Math.round((previewVacationHours / dailyDefaultHours) * 10) / 10} days)
              </div>
              <div className="font-mono text-[11px] text-teal-900/90">
                • Bank Holidays: {fullTimeBankHolidays} days × {weeklyHours}h / 5 = <strong className="text-teal-950 font-bold">{previewBankHolidayHours} hours</strong> ({Math.round((previewBankHolidayHours / dailyDefaultHours) * 10) / 10} days)
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Data Backup & Management */}
        {activeTab === 'data' && (
          <div className="p-6 space-y-5 overflow-y-auto text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Save & Backup to Local File</h3>
              <p className="text-slate-600 leading-relaxed">
                Download your full schedule, logged days, and adjustments as a JSON backup file. You can restore this file on any browser or computer.
              </p>
              <button
                onClick={onExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup File (.json)</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Restore from Backup File</h3>
              <p className="text-slate-600 leading-relaxed">
                Select a previously saved backup file to restore your schedule.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>Select JSON File to Restore</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
              <h3 className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                <span>Reset Current Fiscal Year Data</span>
              </h3>
              <p className="text-rose-600 leading-relaxed">
                Clear all logged days and adjustments for the currently selected fiscal year.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all logged days for this fiscal year?')) {
                    onResetFiscalYear();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
              >
                Reset Year Records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
