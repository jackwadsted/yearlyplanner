import React, { useMemo } from 'react';
import { X, BarChart2, TrendingDown, CalendarDays, Target } from 'lucide-react';
import { AllowanceSummary, FiscalYearData, UserConfig } from '../../types';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: AllowanceSummary;
  fyData: FiscalYearData;
  config: UserConfig;
  selectedYear: number;
}

const SHORT_MONTH = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

/** Returns the 13 fiscal months as { label, year, month } objects for FY starting April 6 */
function getFYMonths(startYear: number) {
  return Array.from({ length: 13 }, (_, i) => {
    const month = (3 + i) % 12; // April = 3
    const year = startYear + Math.floor((3 + i) / 12);
    return { label: SHORT_MONTH[i], year, month };
  });
}

/** Check if a date string (YYYY-MM-DD) falls within a given year/month */
function dateInMonth(dateStr: string, year: number, month: number): boolean {
  const [y, m] = dateStr.split('-').map(Number);
  return y === year && m - 1 === month;
}

/** Clamp within FY bounds: Apr 6 of startYear to Apr 5 of startYear+1 */
function isInFiscalYear(dateStr: string, startYear: number): boolean {
  return dateStr >= `${startYear}-04-06` && dateStr <= `${startYear + 1}-04-05`;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  summary,
  fyData,
  config,
  selectedYear,
}) => {
  if (!isOpen) return null;

  const dailyHours = config.dailyDefaultHours;
  const records = useMemo(() => Object.values(fyData.dayRecords), [fyData.dayRecords]);
  const fyMonths = useMemo(() => getFYMonths(selectedYear), [selectedYear]);

  // ── Burn-down data ──────────────────────────────────────────────────────────
  // For each fiscal month, cumulative vacation hours taken so far
  const burndown = useMemo(() => {
    const totalAllowance = summary.vacationTotalAllowanceHours;
    // 13 month-end data points
    return fyMonths.map(({ year, month }, i) => {
      // Last day of this fiscal month that is still within FY
      const monthEnd = new Date(year, month + 1, 0); // last calendar day of month
      const monthEndStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
      const capDate = monthEndStr > `${selectedYear + 1}-04-05` ? `${selectedYear + 1}-04-05` : monthEndStr;

      const cumTaken = records
        .filter((r) => r.type === 'vacation' && r.date <= capDate && isInFiscalYear(r.date, selectedYear))
        .reduce((s, r) => s + r.hours, 0);

      // Ideal linear burn: by end of month i+1 out of 13 we should have used (i+1)/13 of allowance
      const idealTaken = Math.round(((i + 1) / 13) * totalAllowance * 10) / 10;
      return {
        label: fyMonths[i].label,
        taken: Math.round(cumTaken * 10) / 10,
        ideal: idealTaken,
        remaining: Math.round((totalAllowance - cumTaken) * 10) / 10,
      };
    });
  }, [records, fyMonths, summary.vacationTotalAllowanceHours, selectedYear]);

  // ── Monthly Leave Heat ──────────────────────────────────────────────────────
  const leaveHeat = useMemo(() => {
    return fyMonths.map(({ label, year, month }) => {
      const monthRecords = records.filter((r) => dateInMonth(r.date, year, month) && isInFiscalYear(r.date, selectedYear));
      return {
        label,
        vacation: Math.round(monthRecords.filter((r) => r.type === 'vacation').reduce((s, r) => s + r.hours, 0) * 10) / 10,
        bankHoliday: Math.round(monthRecords.filter((r) => r.type === 'bank_holiday').reduce((s, r) => s + r.hours, 0) * 10) / 10,
        sickness: Math.round(monthRecords.filter((r) => r.type === 'sickness').reduce((s, r) => s + r.hours, 0) * 10) / 10,
        nonWorking: Math.round(monthRecords.filter((r) => r.type === 'non_working').reduce((s, r) => s + r.hours, 0) * 10) / 10,
      };
    });
  }, [records, fyMonths, selectedYear]);

  // ── Projected Year-End ─────────────────────────────────────────────────────
  const projection = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const fyStart = `${selectedYear}-04-06`;
    const fyEnd = `${selectedYear + 1}-04-05`;

    const totalFYDays = Math.ceil(
      (new Date(fyEnd).getTime() - new Date(fyStart).getTime()) / 86400000
    ) + 1;
    const elapsedDays = Math.max(
      0,
      Math.min(
        Math.ceil((new Date(today).getTime() - new Date(fyStart).getTime()) / 86400000),
        totalFYDays
      )
    );
    const fractionElapsed = elapsedDays / totalFYDays;
    const totalAllowance = summary.vacationTotalAllowanceHours;

    if (fractionElapsed <= 0) {
      return { status: 'not_started' as const, projectedRemaining: totalAllowance, surplusByEndH: 0, percentThrough: 0 };
    }

    // Only count vacation days that have already passed — future planned days
    // must not inflate the burn rate.
    const vacationTakenToDate = records
      .filter((r) => r.type === 'vacation' && r.date <= today && isInFiscalYear(r.date, selectedYear))
      .reduce((s, r) => s + r.hours, 0);

    // Burn rate hours/day based only on days elapsed so far
    const burnRatePerDay = elapsedDays > 0 ? vacationTakenToDate / elapsedDays : 0;
    const daysLeft = totalFYDays - elapsedDays;
    const projectedTotalByYearEnd = vacationTakenToDate + burnRatePerDay * daysLeft;
    const projectedRemaining = Math.round((totalAllowance - projectedTotalByYearEnd) * 10) / 10;

    return {
      status: 'active' as const,
      projectedRemaining,
      surplusByEndH: projectedRemaining,
      percentThrough: Math.round(fractionElapsed * 100),
      burnRatePerDay: Math.round(burnRatePerDay * 100) / 100,
      elapsedDays,
      daysLeft,
      vacationTakenToDate: Math.round(vacationTakenToDate * 10) / 10,
    };
  }, [records, summary.vacationTotalAllowanceHours, selectedYear]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalLeaveLogged = Math.round(
    (summary.vacationTakenHours + summary.bankHolidayTakenHours + summary.totalSicknessHours) * 10
  ) / 10;

  // ── Burn-down SVG chart (pure, no library) ──────────────────────────────────
  const BurndownChart = () => {
    const W = 580; const H = 140;
    const PAD = { top: 10, right: 12, bottom: 28, left: 36 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const maxVal = summary.vacationTotalAllowanceHours;
    const pts = burndown;

    const xOf = (i: number) => PAD.left + (i / (pts.length - 1)) * chartW;
    const yOf = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

    const takenPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p.taken)}`).join(' ');
    const idealPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p.ideal)}`).join(' ');

    // Today marker: find which bucket we're in
    const today = new Date().toISOString().split('T')[0];
    let todayX: number | null = null;
    for (let i = 0; i < fyMonths.length; i++) {
      const { year, month } = fyMonths[i];
      if (dateInMonth(today, year, month)) {
        todayX = xOf(i);
        break;
      }
    }

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="Vacation burn-down chart">
        {/* Y gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const val = Math.round(frac * maxVal);
          const y = yOf(val);
          return (
            <g key={frac}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#9ca3af">{val}h</text>
            </g>
          );
        })}

        {/* Today line */}
        {todayX !== null && (
          <line x1={todayX} y1={PAD.top} x2={todayX} y2={H - PAD.bottom} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
        )}

        {/* Ideal line */}
        <path d={idealPath} fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="5 3" />

        {/* Taken area fill */}
        <path
          d={`${takenPath} L${xOf(pts.length - 1)},${yOf(0)} L${xOf(0)},${yOf(0)} Z`}
          fill="#5eead4"
          fillOpacity="0.18"
        />
        {/* Taken line */}
        <path d={takenPath} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round" />

        {/* X axis labels */}
        {pts.map((p, i) => (
          <text key={i} x={xOf(i)} y={H - PAD.bottom + 10} textAnchor="middle" fontSize="8" fill="#9ca3af">
            {p.label}
          </text>
        ))}
      </svg>
    );
  };

  // ── Leave Heat chart (horizontal stacked mini bars) ────────────────────────
  const maxMonthHours = Math.max(1, ...leaveHeat.map((m) => m.vacation + m.bankHoliday + m.sickness));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 text-slate-800">
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-200/60 text-violet-600">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Statistics — FY {summary.fiscalYear}</h2>
              <p className="text-[11px] text-slate-500">Leave usage, burn-down and projections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close statistics"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* ── Top summary cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                label: 'Vacation taken',
                value: `${summary.vacationTakenHours}h`,
                sub: `${summary.vacationTakenDaysEquivalent}d of ${summary.vacationTotalDaysEquivalent}d`,
                color: 'bg-teal-50 border-teal-200/70 text-teal-700',
                val: 'text-teal-900',
              },
              {
                label: 'Vacation remaining',
                value: `${summary.vacationRemainingHours}h`,
                sub: `${summary.vacationRemainingDaysEquivalent}d left`,
                color: 'bg-teal-50 border-teal-200/70 text-teal-700',
                val: 'text-teal-900',
              },
              {
                label: 'Bank holidays',
                value: `${summary.bankHolidayTakenHours}h`,
                sub: `${summary.bankHolidayTakenDaysEquivalent}d of ${summary.bankHolidayTotalDaysEquivalent}d`,
                color: 'bg-indigo-50 border-indigo-200/70 text-indigo-700',
                val: 'text-indigo-900',
              },
              {
                label: 'Sickness',
                value: `${summary.totalSicknessHours}h`,
                sub: `${summary.totalSicknessDays} day${summary.totalSicknessDays !== 1 ? 's' : ''} logged`,
                color: 'bg-amber-50 border-amber-200/70 text-amber-700',
                val: 'text-amber-900',
              },
            ].map((card) => (
              <div key={card.label} className={`rounded-xl border px-3 py-2.5 ${card.color}`}>
                <div className={`font-bold font-mono text-lg leading-tight ${card.val}`}>{card.value}</div>
                <div className="text-[10px] font-medium mt-0.5">{card.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Projected Year-End ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-violet-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Projected Year-End</h3>
            </div>

            {projection.status === 'not_started' ? (
              <p className="text-xs text-slate-500">Fiscal year hasn't started yet — no projection available.</p>
            ) : (
              <div className="space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>{projection.percentThrough}% through the fiscal year</span>
                    <span>{projection.elapsedDays}d elapsed · {projection.daysLeft}d remaining</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${projection.percentThrough}%` }}
                    />
                  </div>
                </div>

                {/* Projection result */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className={`flex-1 rounded-xl border px-3 py-2.5 text-xs ${
                    projection.surplusByEndH >= 0
                      ? 'bg-emerald-50 border-emerald-200/70 text-emerald-800'
                      : 'bg-rose-50 border-rose-200/70 text-rose-800'
                  }`}>
                    <div className="font-bold font-mono text-base">
                      {projection.surplusByEndH >= 0
                        ? `+${projection.surplusByEndH}h surplus`
                        : `${projection.surplusByEndH}h shortfall`}
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-80">
                      {projection.surplusByEndH >= 0
                        ? `At current rate you'll finish with ${Math.round(projection.surplusByEndH / dailyHours * 10) / 10}d vacation unused`
                        : `At current rate you'll exceed your allowance by ${Math.abs(Math.round(projection.surplusByEndH / dailyHours * 10) / 10)}d`}
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700">
                    <div className="font-bold font-mono text-base text-slate-900">
                      {projection.burnRatePerDay}h<span className="text-slate-400 font-normal text-[11px]">/day</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Current vacation burn rate · {Math.round(projection.burnRatePerDay / dailyHours * 100) / 100}d/day
                    </div>
                  </div>
                </div>

                {/* Taken vs ideal bar — past days only */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Used to date <span className="text-slate-400">(past days only)</span></span>
                    <span>
                      {projection.vacationTakenToDate}h used · {Math.round((projection.vacationTakenToDate / summary.vacationTotalAllowanceHours) * 100)}% used
                      {' '}vs {projection.percentThrough}% of year elapsed
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden relative">
                    <div
                      className="bg-teal-500 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((projection.vacationTakenToDate / summary.vacationTotalAllowanceHours) * 100))}%` }}
                    />
                    {/* ideal marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-indigo-400"
                      style={{ left: `${projection.percentThrough}%` }}
                      title="Expected usage if linear"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span className="text-teal-600">▪ Actual (past)</span>
                    <span className="text-indigo-400">▪ Expected (linear)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Projection uses your past burn rate only — future planned leave doesn't affect it.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── Vacation Burn-down ──────────────────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-teal-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Vacation Burn-down</h3>
              <span className="ml-auto text-[10px] text-slate-400 flex gap-3">
                <span className="text-teal-600">▪ Actual</span>
                <span className="text-indigo-300">▪ Ideal linear</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2">Cumulative vacation hours taken month-by-month vs ideal linear burn rate</p>
            <BurndownChart />
          </section>

          {/* ── Monthly Leave Heat ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-orange-500 shrink-0" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Monthly Leave Heat</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-slate-400 font-medium pb-1.5 w-8">Mo.</th>
                    <th className="text-left text-slate-400 font-medium pb-1.5 pl-1">Distribution</th>
                    <th className="text-right text-teal-600 font-semibold pb-1.5 pr-1">Vac</th>
                    <th className="text-right text-indigo-600 font-semibold pb-1.5 pr-1">BH</th>
                    <th className="text-right text-amber-600 font-semibold pb-1.5">Sick</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHeat.map((row) => {
                    const total = row.vacation + row.bankHoliday + row.sickness;
                    const vacW = total > 0 ? (row.vacation / maxMonthHours) * 100 : 0;
                    const bhW = total > 0 ? (row.bankHoliday / maxMonthHours) * 100 : 0;
                    const sickW = total > 0 ? (row.sickness / maxMonthHours) * 100 : 0;
                    return (
                      <tr key={row.label} className="border-t border-slate-100">
                        <td className="py-1 pr-1 font-mono text-slate-500 text-[10px] align-middle">{row.label}</td>
                        <td className="py-1 pl-1 align-middle w-full">
                          <div className="flex h-3.5 rounded overflow-hidden bg-slate-100 gap-px">
                            {vacW > 0 && (
                              <div
                                className="bg-teal-400 h-full"
                                style={{ width: `${vacW}%` }}
                                title={`Vacation: ${row.vacation}h`}
                              />
                            )}
                            {bhW > 0 && (
                              <div
                                className="bg-indigo-400 h-full"
                                style={{ width: `${bhW}%` }}
                                title={`Bank Holiday: ${row.bankHoliday}h`}
                              />
                            )}
                            {sickW > 0 && (
                              <div
                                className="bg-amber-400 h-full"
                                style={{ width: `${sickW}%` }}
                                title={`Sickness: ${row.sickness}h`}
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-1 pr-1 text-right font-mono text-teal-700 align-middle">
                          {row.vacation > 0 ? `${row.vacation}h` : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-1 pr-1 text-right font-mono text-indigo-700 align-middle">
                          {row.bankHoliday > 0 ? `${row.bankHoliday}h` : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-1 text-right font-mono text-amber-700 align-middle">
                          {row.sickness > 0 ? `${row.sickness}h` : <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td className="pt-1.5 text-slate-500 font-semibold" colSpan={2}>Total logged</td>
                    <td className="pt-1.5 text-right font-mono font-bold text-teal-700">{summary.vacationTakenHours}h</td>
                    <td className="pt-1.5 text-right font-mono font-bold text-indigo-700 pr-1">{summary.bankHolidayTakenHours}h</td>
                    <td className="pt-1.5 text-right font-mono font-bold text-amber-700">{summary.totalSicknessHours}h</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {totalLeaveLogged === 0 && (
              <p className="text-center text-xs text-slate-400 py-3 mt-1">No leave logged yet for this fiscal year.</p>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
