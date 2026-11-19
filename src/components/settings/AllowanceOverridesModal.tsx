import React, { useState } from 'react';
import { AllowanceAdjustment, ExtraAllowance, UserConfig } from '../../types';
import { X, Plus, Trash2, PlusCircle, Palmtree, Landmark } from 'lucide-react';
import { bucketInitial } from '../../utils/extraAllowance';

interface AllowanceOverridesModalProps {
  fiscalYearKey: string;
  adjustments: AllowanceAdjustment[];
  extraAllowances: ExtraAllowance[];
  config: UserConfig;
  isOpen: boolean;
  onClose: () => void;
  onAddAdjustment: (adjustment: Omit<AllowanceAdjustment, 'id' | 'createdAt'>) => void;
  onDeleteAdjustment: (id: string) => void;
  onAddExtraAllowance: (extra: Omit<ExtraAllowance, 'id' | 'createdAt'>) => void;
  onDeleteExtraAllowance: (id: string) => void;
}

export const AllowanceOverridesModal: React.FC<AllowanceOverridesModalProps> = ({
  fiscalYearKey,
  adjustments,
  extraAllowances,
  config,
  isOpen,
  onClose,
  onAddAdjustment,
  onDeleteAdjustment,
  onAddExtraAllowance,
  onDeleteExtraAllowance,
}) => {
  if (!isOpen) return null;

  const [extraLabel, setExtraLabel] = useState('');
  const [extraUnitMode, setExtraUnitMode] = useState<'hours' | 'days'>('days');
  const [extraValue, setExtraValue] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'vacation' | 'bank_holiday'>('vacation');
  const [unitMode, setUnitMode] = useState<'hours' | 'days'>('hours');
  const [value, setValue] = useState<number>(config.dailyDefaultHours);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value) return;

    const calculatedHours = unitMode === 'days' ? Math.round(value * config.dailyDefaultHours * 100) / 100 : value;

    onAddAdjustment({
      fiscalYear: fiscalYearKey,
      description: description.trim(),
      hours: calculatedHours,
      type,
    });

    setDescription('');
    setValue(config.dailyDefaultHours);
  };

  const extraCalculatedHours =
    extraUnitMode === 'days' ? Math.round(extraValue * config.dailyDefaultHours * 100) / 100 : extraValue;

  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraLabel.trim() || extraCalculatedHours <= 0) return;

    onAddExtraAllowance({
      fiscalYear: fiscalYearKey,
      label: extraLabel.trim(),
      hours: extraCalculatedHours,
    });

    setExtraLabel('');
    setExtraValue(extraUnitMode === 'days' ? 1 : config.dailyDefaultHours);
  };

  const totalVacationAdjustments = adjustments
    .filter((a) => a.type === 'vacation')
    .reduce((sum, a) => sum + a.hours, 0);

  const totalBankHolidayAdjustments = adjustments
    .filter((a) => a.type === 'bank_holiday')
    .reduce((sum, a) => sum + a.hours, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-50 border border-brand-200/60 text-brand-600">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Allowance Overrides & Adjustments</h2>
              <p className="text-xs text-slate-500 font-mono">FY {fiscalYearKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Extra Vacation Buckets */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Palmtree className="w-4 h-4 text-brand-600" />
              <span>Extra Vacation Buckets</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Separate vacation allowances (e.g. bonus leave) tracked on their own. Tag vacation days to a bucket when painting or editing a day.
            </p>

            <form onSubmit={handleAddExtra} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Bucket Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bonus leave, Long-service days..."
                  value={extraLabel}
                  onChange={(e) => setExtraLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Size ({extraUnitMode === 'days' ? 'Days' : 'Hours'})
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={extraValue}
                    onChange={(e) => setExtraValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-surface border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setExtraUnitMode('hours');
                      setExtraValue(config.dailyDefaultHours);
                    }}
                    className={`px-3 py-1.5 rounded font-medium transition-colors ${
                      extraUnitMode === 'hours' ? 'bg-surface text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExtraUnitMode('days');
                      setExtraValue(1);
                    }}
                    className={`px-3 py-1.5 rounded font-medium transition-colors ${
                      extraUnitMode === 'days' ? 'bg-surface text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Days
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!extraLabel.trim() || extraCalculatedHours <= 0}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:brightness-90 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Add Bucket
                </button>
              </div>

              {extraUnitMode === 'days' && (
                <p className="text-[11px] text-slate-500 font-mono">
                  = {extraCalculatedHours} hours (at {config.dailyDefaultHours}h/day)
                </p>
              )}
            </form>

            {extraAllowances.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No extra vacation buckets for this fiscal year yet.
              </div>
            ) : (
              <div className="space-y-2">
                {extraAllowances.map((x) => (
                  <div
                    key={x.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-surface text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                        {bucketInitial(x.label)}
                      </span>
                      <div className="font-semibold text-slate-800">{x.label}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-brand-700">
                        {x.hours}h ({Math.round((x.hours / config.dailyDefaultHours) * 10) / 10}d)
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteExtraAllowance(x.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove bucket (its tagged days return to the normal allowance)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Form */}
          <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-600" />
              <span>Add Allowance Adjustment</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason / Description</label>
              <input
                type="text"
                placeholder="e.g. Carried forward from previous year, Bought 2 extra days..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 bg-surface border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Allowance Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'vacation' | 'bank_holiday')}
                  className="w-full px-3 py-2 bg-surface border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="vacation">Vacation Allowance</option>
                  <option value="bank_holiday">Bank Holiday Allowance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUnitMode('hours');
                      setValue(config.dailyDefaultHours);
                    }}
                    className={`py-1 rounded font-medium transition-colors ${
                      unitMode === 'hours' ? 'bg-surface text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitMode('days');
                      setValue(1);
                    }}
                    className={`py-1 rounded font-medium transition-colors ${
                      unitMode === 'days' ? 'bg-surface text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Days
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Value ({unitMode === 'days' ? 'Days' : 'Hours'})
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-surface border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="self-end pb-0.5">
                <button
                  type="submit"
                  disabled={!description.trim() || !value}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:brightness-90 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  Add Adjustment
                </button>
              </div>
            </div>

            {unitMode === 'days' && (
              <p className="text-[11px] text-slate-500 font-mono">
                = {Math.round(value * config.dailyDefaultHours * 100) / 100} hours (at {config.dailyDefaultHours}h/day)
              </p>
            )}
          </form>

          {/* Existing Adjustments List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Adjustments for FY {fiscalYearKey} ({adjustments.length})
              </label>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-brand-700 font-medium">Vac: {totalVacationAdjustments >= 0 ? `+${totalVacationAdjustments}` : totalVacationAdjustments}h</span>
                <span className="text-accent-700 font-medium">BH: {totalBankHolidayAdjustments >= 0 ? `+${totalBankHolidayAdjustments}` : totalBankHolidayAdjustments}h</span>
              </div>
            </div>

            {adjustments.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No adjustments added for this fiscal year yet.
              </div>
            ) : (
              <div className="space-y-2">
                {adjustments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-surface hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {a.type === 'vacation' ? (
                        <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-200/60">
                          <Palmtree className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-accent-50 text-accent-600 border border-accent-200/60">
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-800">{a.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono capitalize">
                          {a.type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-brand-700">
                        {a.hours > 0 ? `+${a.hours}` : a.hours}h
                      </span>
                      <button
                        onClick={() => onDeleteAdjustment(a.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove adjustment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-surface border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
