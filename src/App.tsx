import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  loadAppState,
  saveAppState,
  exportStateToFile,
  importStateFromFile,
  DEFAULT_CONFIG,
} from './services/storage';
import { fetchBankHolidays, getFiscalYearBankHolidays } from './services/bankHolidays';
import { calculateAllowanceSummary, getFiscalYearKey } from './utils/calculator';
import { AppState, DayRecord, BankHoliday, UserConfig, AllowanceAdjustment, ExtraAllowance, PaintTool, ThemeId } from './types';
import { generateICalFile, getEventsFromDayRecords } from './utils/ical';
import { FiscalYearCalendar } from './components/calendar/FiscalYearCalendar';
import { DayEditModal } from './components/calendar/DayEditModal';
import { AllowanceDashboard } from './components/dashboard/AllowanceDashboard';
import { LeaveList } from './components/dashboard/LeaveList';
import { SettingsModal } from './components/settings/SettingsModal';
import { AllowanceOverridesModal } from './components/settings/AllowanceOverridesModal';
import { MiniToolbar } from './components/navigation/MiniToolbar';
import { StatisticsModal } from './components/statistics/StatisticsModal';
import { SuggestionsModal } from './components/suggestions/SuggestionsModal';
import { Calendar, Settings, PlusCircle, Download, RotateCcw, BarChart2, Lightbulb } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  const [isLoadingBH, setIsLoadingBH] = useState(true);

  // Paint Tool state ('select' | 'vacation' | 'bank_holiday' | 'non_working' | 'working' | 'sickness' | 'eraser')
  const [paintTool, setPaintTool] = useState<PaintTool>('select');

  // Extra vacation bucket the Vacation brush charges to ('' = normal allowance)
  const [activeExtraId, setActiveExtraId] = useState<string>('');

  // Modals state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Scroll detection for mini floating toolbar
  const [showMiniToolbar, setShowMiniToolbar] = useState(false);
  const calendarSectionRef = useRef<HTMLDivElement>(null);

  // Mouse drag tracking
  const isMouseDownRef = useRef(false);

  // Current fiscal year key
  const fyKey = useMemo(() => getFiscalYearKey(appState.selectedYear), [appState.selectedYear]);

  // Current fiscal year data
  const currentFYData = useMemo(() => {
    return (
      appState.years[fyKey] || {
        fiscalYear: fyKey,
        dayRecords: {},
        adjustments: [],
      }
    );
  }, [appState.years, fyKey]);

  // Apply selected theme
  useEffect(() => {
    document.documentElement.dataset.theme = appState.config.theme;
  }, [appState.config.theme]);

  // Auto-save state changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Handle scroll detection for calendar mini toolbar
  useEffect(() => {
    const handleScroll = () => {
      if (!calendarSectionRef.current) return;
      const rect = calendarSectionRef.current.getBoundingClientRect();
      // Show when calendar starts occupying top viewport (dashboard is scrolled past)
      setShowMiniToolbar(rect.top <= 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to global mouse up events to end dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleDayMouseDown = (dateStr: string) => {
    if (paintTool === 'select') return;
    isMouseDownRef.current = true;
    handlePaintDay(dateStr);
  };

  const handleDayMouseEnter = (dateStr: string) => {
    if (isMouseDownRef.current && paintTool !== 'select') {
      handlePaintDay(dateStr);
    }
  };

  const handlePaintDay = (dateStr: string) => {
    if (paintTool === 'select') return;
    if (paintTool === 'eraser') {
      handleDeleteDayRecord(dateStr);
      return;
    }

    // Paint tool active: apply status with default hours
    const hours = paintTool === 'non_working' ? 0 : appState.config.dailyDefaultHours;
    handleSaveDayRecord({
      date: dateStr,
      type: paintTool,
      hours,
      ...(paintTool === 'vacation' && activeExtraId ? { extraAllowanceId: activeExtraId } : {}),
    });
  };

  // Fetch UK Bank Holidays for selected region
  useEffect(() => {
    let isMounted = true;
    setIsLoadingBH(true);
    fetchBankHolidays(appState.config.region)
      .then((holidays) => {
        if (isMounted) {
          setBankHolidays(holidays);
          setIsLoadingBH(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching bank holidays:', err);
        if (isMounted) setIsLoadingBH(false);
      });

    return () => {
      isMounted = false;
    };
  }, [appState.config.region]);

  // Filter bank holidays for current fiscal year
  const fyBankHolidays = useMemo(() => {
    return getFiscalYearBankHolidays(bankHolidays, appState.selectedYear);
  }, [bankHolidays, appState.selectedYear]);

  // Map for quick lookup
  const bankHolidaysMap = useMemo(() => {
    const map: Record<string, BankHoliday> = {};
    for (const h of fyBankHolidays) {
      map[h.date] = h;
    }
    return map;
  }, [fyBankHolidays]);

  // Summary Metrics
  const summary = useMemo(() => {
    return calculateAllowanceSummary(appState.config, currentFYData, fyKey);
  }, [appState.config, currentFYData, fyKey]);

  // Year Change
  const handleYearChange = (newYear: number) => {
    const newFYKey = getFiscalYearKey(newYear);
    setAppState((prev) => {
      const nextYears = { ...prev.years };
      if (!nextYears[newFYKey]) {
        nextYears[newFYKey] = {
          fiscalYear: newFYKey,
          dayRecords: {},
          adjustments: [],
        };
      }
      return {
        ...prev,
        selectedYear: newYear,
        years: nextYears,
      };
    });
  };

  // Toggle Paint Tool
  const handleSelectPaintTool = (tool: PaintTool) => {
    setPaintTool((prev) => (prev === tool ? 'select' : tool));
  };

  // Save Day Record
  const handleSaveDayRecord = (record: DayRecord) => {
    setAppState((prev) => {
      const currentYearObj = prev.years[fyKey] || {
        fiscalYear: fyKey,
        dayRecords: {},
        adjustments: [],
      };

      return {
        ...prev,
        years: {
          ...prev.years,
          [fyKey]: {
            ...currentYearObj,
            dayRecords: {
              ...currentYearObj.dayRecords,
              [record.date]: record,
            },
          },
        },
      };
    });
  };

  // Delete Day Record (Reset day to default schedule)
  const handleDeleteDayRecord = (dateStr: string) => {
    setAppState((prev) => {
      const currentYearObj = prev.years[fyKey];
      if (!currentYearObj) return prev;

      const nextDayRecords = { ...currentYearObj.dayRecords };
      delete nextDayRecords[dateStr];

      return {
        ...prev,
        years: {
          ...prev.years,
          [fyKey]: {
            ...currentYearObj,
            dayRecords: nextDayRecords,
          },
        },
      };
    });
  };

  // Click on date in calendar (behaves according to active paint tool)
  const handleSelectDate = (dateStr: string) => {
    if (paintTool === 'select') {
      setSelectedDate(dateStr);
      setIsDayModalOpen(true);
    }
  };

  // Book all days of a suggested break as vacation
  const handleApplySuggestion = (dates: string[]) => {
    for (const date of dates) {
      handleSaveDayRecord({
        date,
        type: 'vacation',
        hours: appState.config.dailyDefaultHours,
      });
    }
  };

  // Right-click on date to instantly reset
  const handleRightClickDate = (dateStr: string) => {
    handleDeleteDayRecord(dateStr);
  };

  // Double click to open full details modal anytime
  const handleDoubleClickDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsDayModalOpen(true);
  };

  // Save Config
  const handleSaveConfig = (newConfig: UserConfig) => {
    setAppState((prev) => ({
      ...prev,
      config: newConfig,
    }));
  };

  // Change theme (applies immediately)
  const handleThemeChange = (theme: ThemeId) => {
    setAppState((prev) => ({
      ...prev,
      config: { ...prev.config, theme },
    }));
  };

  // Add Allowance Adjustment
  const handleAddAdjustment = (adj: Omit<AllowanceAdjustment, 'id' | 'createdAt'>) => {
    const newAdj: AllowanceAdjustment = {
      ...adj,
      id: 'adj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };

    setAppState((prev) => {
      const currentYearObj = prev.years[fyKey] || {
        fiscalYear: fyKey,
        dayRecords: {},
        adjustments: [],
      };

      return {
        ...prev,
        years: {
          ...prev.years,
          [fyKey]: {
            ...currentYearObj,
            adjustments: [...(currentYearObj.adjustments || []), newAdj],
          },
        },
      };
    });
  };

  // Delete Allowance Adjustment
  const handleDeleteAdjustment = (id: string) => {
    setAppState((prev) => {
      const currentYearObj = prev.years[fyKey];
      if (!currentYearObj) return prev;

      return {
        ...prev,
        years: {
          ...prev.years,
          [fyKey]: {
            ...currentYearObj,
            adjustments: currentYearObj.adjustments.filter((a) => a.id !== id),
          },
        },
      };
    });
  };

  // Add Extra Vacation Bucket
  const handleAddExtraAllowance = (extra: Omit<ExtraAllowance, 'id' | 'createdAt'>) => {
    const newExtra: ExtraAllowance = {
      ...extra,
      id: 'extra_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };

    setAppState((prev) => {
      const currentYearObj = prev.years[fyKey] || {
        fiscalYear: fyKey,
        dayRecords: {},
        adjustments: [],
      };

      return {
        ...prev,
        years: {
          ...prev.years,
          [fyKey]: {
            ...currentYearObj,
            extraAllowances: [...(currentYearObj.extraAllowances || []), newExtra],
          },
        },
      };
    });
  };

  // Delete Extra Vacation Bucket (tagged days fall back to the normal allowance)
  const handleDeleteExtraAllowance = (id: string) => {
    setActiveExtraId((prev) => (prev === id ? '' : prev));
    setAppState((prev) => {
      const currentYearObj = prev.years[fyKey];
      if (!currentYearObj) return prev;

      const nextDayRecords: Record<string, DayRecord> = {};
      for (const [date, record] of Object.entries(currentYearObj.dayRecords)) {
        if (record.extraAllowanceId === id) {
          const { extraAllowanceId: _removed, ...rest } = record;
          nextDayRecords[date] = rest;
        } else {
          nextDayRecords[date] = record;
        }
      }

      return {
        ...prev,
        years: {
          ...prev.years,
          [fyKey]: {
            ...currentYearObj,
            dayRecords: nextDayRecords,
            extraAllowances: (currentYearObj.extraAllowances || []).filter((e) => e.id !== id),
          },
        },
      };
    });
  };

  // Export File Backup
  const handleExportBackup = () => {
    exportStateToFile(appState);
  };

  // Export Calendar (.ics)
  const handleExportICS = () => {
    const events = getEventsFromDayRecords(currentFYData.dayRecords, fyBankHolidays);
    const icsContent = generateICalFile(events);
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vacation_planner_${fyKey.replace('/', '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import File Backup
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = importStateFromFile(content);
        setAppState(imported);
        alert('Schedule backup imported successfully!');
      } catch {
        alert('Failed to import file. Please check that it is a valid JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  // Reset current FY
  const handleResetFiscalYear = () => {
    setAppState((prev) => ({
      ...prev,
      years: {
        ...prev.years,
        [fyKey]: {
          fiscalYear: fyKey,
          dayRecords: {},
          adjustments: [],
        },
      },
    }));
  };

  // Reset entire app
  const handleResetAll = useCallback(() => {
    if (confirm('Are you sure you want to reset all data and settings to default?')) {
      localStorage.removeItem('vacation_planner_v1');
      setAppState({
        config: DEFAULT_CONFIG,
        selectedYear: 2026,
        years: {
          '2026/27': {
            fiscalYear: '2026/27',
            dayRecords: {},
            adjustments: [],
          },
        },
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Floating Mini Toolbar when scrolled down to calendars */}
      <MiniToolbar
        extraAllowances={currentFYData.extraAllowances || []}
        activeExtraId={activeExtraId}
        onSelectExtraId={setActiveExtraId}
        summary={summary}
        activePaintTool={paintTool}
        onSelectPaintTool={handleSelectPaintTool}
        onOpenAdjustments={() => setIsAdjustmentsOpen(true)}
        onScrollToTop={handleScrollToTop}
        isVisible={showMiniToolbar}
      />

      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight flex items-center gap-2">
                <span>Vacation & Compressed Planner</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                UK Pro-Rata & Fiscal Year (Apr 6 – Apr 5)
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSuggestionsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-all"
              title="Suggest the best times to take time off"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Suggest</span>
            </button>

            <button
              onClick={() => setIsStatisticsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 transition-all"
              title="View leave statistics and projections"
            >
              <BarChart2 className="w-4 h-4 text-violet-600" />
              <span className="hidden sm:inline">Statistics</span>
            </button>

            <button
              onClick={() => setIsAdjustmentsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 transition-all"
              title="Add carryover or bonus leave"
            >
              <PlusCircle className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline">Adjustments</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all"
              title="Download local JSON backup"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            <button
              onClick={handleExportICS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all"
              title="Export holidays to .ics calendar file"
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Export ICS</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-strong hover:bg-strong-hover shadow-xs transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Allowance & Pro-Rata Dashboard */}
        <AllowanceDashboard
          summary={summary}
          config={appState.config}
          onOpenAdjustments={() => setIsAdjustmentsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          dayRecords={currentFYData.dayRecords}
          selectedYear={appState.selectedYear}
        />

        {/* Audit / Leave Log Component */}
        <LeaveList
          extraAllowances={currentFYData.extraAllowances || []}
          dayRecords={currentFYData.dayRecords}
          onEditDate={handleDoubleClickDate}
          onDeleteRecord={handleDeleteDayRecord}
        />

        {/* 13-Month Fiscal Year Calendar (3 Months Wide) */}
        <div ref={calendarSectionRef}>
          <FiscalYearCalendar
            extraAllowances={currentFYData.extraAllowances || []}
            activeExtraId={activeExtraId}
            onSelectExtraId={setActiveExtraId}
            selectedYear={appState.selectedYear}
            onYearChange={handleYearChange}
            dayRecords={currentFYData.dayRecords}
            bankHolidays={fyBankHolidays}
            config={appState.config}
            selectedDate={selectedDate || undefined}
            activePaintTool={paintTool}
            onSelectPaintTool={handleSelectPaintTool}
            onSelectDate={handleSelectDate}
            onRightClickDate={handleRightClickDate}
            onDoubleClickDate={handleDoubleClickDate}
            onMouseDownDate={handleDayMouseDown}
            onMouseEnterDate={handleDayMouseEnter}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-surface py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Vacation Planner • Compressed Hours & Pro-Rata Entitlement Tracker</span>
            {isLoadingBH && <span className="ml-2 text-brand-600">• Loading bank holidays...</span>}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetAll}
              className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Data</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Day Details Modal */}
      <DayEditModal
        extraAllowances={currentFYData.extraAllowances || []}
        dateStr={selectedDate}
        currentRecord={selectedDate ? currentFYData.dayRecords[selectedDate] : undefined}
        bankHoliday={selectedDate ? bankHolidaysMap[selectedDate] : undefined}
        config={appState.config}
        isOpen={isDayModalOpen}
        onClose={() => {
          setIsDayModalOpen(false);
          setSelectedDate(null);
        }}
        onSaveRecord={handleSaveDayRecord}
        onDeleteRecord={handleDeleteDayRecord}
      />

      {/* Settings Modal */}
      <SettingsModal
        config={appState.config}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveConfig={handleSaveConfig}
        onThemeChange={handleThemeChange}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onResetFiscalYear={handleResetFiscalYear}
      />

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
        summary={summary}
        fyData={currentFYData}
        config={appState.config}
        selectedYear={appState.selectedYear}
      />

      {/* Suggestions Modal */}
      <SuggestionsModal
        isOpen={isSuggestionsOpen}
        onClose={() => setIsSuggestionsOpen(false)}
        config={appState.config}
        selectedYear={appState.selectedYear}
        dayRecords={currentFYData.dayRecords}
        bankHolidays={fyBankHolidays}
        remainingVacationHours={summary.vacationRemainingHours}
        onApplySuggestion={handleApplySuggestion}
      />

      {/* Allowance Overrides Modal */}
      <AllowanceOverridesModal
        fiscalYearKey={fyKey}
        adjustments={currentFYData.adjustments || []}
        extraAllowances={currentFYData.extraAllowances || []}
        config={appState.config}
        isOpen={isAdjustmentsOpen}
        onClose={() => setIsAdjustmentsOpen(false)}
        onAddAdjustment={handleAddAdjustment}
        onDeleteAdjustment={handleDeleteAdjustment}
        onAddExtraAllowance={handleAddExtraAllowance}
        onDeleteExtraAllowance={handleDeleteExtraAllowance}
      />
    </div>
  );
}
