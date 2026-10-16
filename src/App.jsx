import React, { useState, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { generateCandidates, findPinConflicts } from './lib/scheduler';
import CandidateBar from './components/CandidateBar';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import { cn } from './lib/utils';
import { Stethoscope, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from './lib/i18n';

const INITIAL_STAFF = [
  { id: uuidv4(), name: 'Dr. Smith', level: 'R3', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [], fixedDays: [] },
  { id: uuidv4(), name: 'Dr. John', level: 'R2', maxWeekdays: 4, maxWeekends: 3, availability: 'Full Month', offDays: [], fixedDays: [] },
  { id: uuidv4(), name: 'Dr. House', level: 'R1', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [], fixedDays: [] },
  { id: uuidv4(), name: 'Dr. Jackie', level: 'PGY3', maxWeekdays: 4, maxWeekends: 3, availability: 'Full Month', offDays: [], fixedDays: [] },
  { id: uuidv4(), name: 'Dr. Strange', level: 'PGY2', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [], fixedDays: [] }
];

function App() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [dailyRequirements, setDailyRequirements] = useState({ total: 2, minR: 0, minSeniorR: 0, minPGY: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonthDate, setCurrentMonthDate] = useState(startOfMonth(addMonths(new Date(), 1)));
  const [dailyReqOverrides, setDailyReqOverrides] = useState({}); // { 'YYYY-MM-DD': { total, minR, minPGY } }

  // Only months listed here get scheduled; the seed makes a month's candidates reproducible
  const [monthSeeds, setMonthSeeds] = useState(() => ({ [format(currentMonthDate, 'yyyy-MM')]: 1 })); // { 'yyyy-MM': seed }
  const [focusedStaffId, setFocusedStaffId] = useState(null);

  const [editingStaffId, setEditingStaffId] = useState(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'analytics'
  const { t, lang, setLang } = useTranslation();

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthKey = format(currentMonthDate, 'yyyy-MM');
  const seed = monthSeeds[monthKey];

  // Auto-generate candidate schedules for this month whenever staff, pins, or rules change
  const candidates = useMemo(() => {
    if (seed === undefined) return [];
    return generateCandidates(year, month, staffList, dailyRequirements, dailyReqOverrides, { runs: 50, keep: 10, seed });
  }, [year, month, staffList, dailyRequirements, dailyReqOverrides, seed]);

  const pinConflicts = useMemo(
    () => findPinConflicts(year, month, staffList, dailyReqOverrides),
    [year, month, staffList, dailyReqOverrides]
  );

  // Selected plan + manual overrides belong to one candidate set; they reset when candidates regenerate
  const [view, setView] = useState({ forCandidates: null, idx: 0, manualOverrides: {} }); // manualOverrides: { 'YYYY-MM-DD': ['staffId1', 'staffId2'] }
  const currentView = view.forCandidates === candidates ? view : { idx: 0, manualOverrides: {} };
  const selected = candidates[currentView.idx];
  const manualOverrides = currentView.manualOverrides;
  const shortages = selected ? selected.shortages : [];

  const selectCandidate = useCallback((idx) => {
    setView({ forCandidates: candidates, idx, manualOverrides: {} });
  }, [candidates]);

  // Regenerate / clear only affect the month being viewed
  const handleRegenerate = () => {
    setMonthSeeds(prev => ({ ...prev, [monthKey]: Date.now() }));
  };

  const handleClearSchedule = () => {
    setMonthSeeds(prev => {
      const next = { ...prev };
      delete next[monthKey];
      return next;
    });
  };

  // Merge overrides
  const schedule = useMemo(() => {
    const merged = { ...(selected ? selected.schedule : {}) };
    Object.keys(manualOverrides).forEach(date => {
      merged[date] = manualOverrides[date];
    });
    return merged;
  }, [selected, manualOverrides]);

  // Derived filtered personal schedule
  // Clicking a staff in the directory focuses them; otherwise fall back to the search box
  const searchedStaff = useMemo(() => {
    if (focusedStaffId) return staffList.find(s => s.id === focusedStaffId) || null;
    if (!searchQuery.trim()) return null;
    return staffList.find(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [focusedStaffId, searchQuery, staffList]);

  const handleStaffSave = (staffData) => {
    if (editingStaffId === 'new') {
       // Create new
       setStaffList(prev => [...prev, { ...staffData, id: uuidv4() }]);
    } else {
       // Update existing
       setStaffList(prev => prev.map(staff => staff.id === staffData.id ? { ...staff, ...staffData } : staff));
    }
    setEditingStaffId(null);
  };

  const removeStaff = (staffId) => {
    setStaffList(prev => prev.filter(s => s.id !== staffId));
  };

  const overrideDayStaff = (dateStr, staffIds) => {
    setView({
      forCandidates: candidates,
      idx: currentView.idx,
      manualOverrides: { ...manualOverrides, [dateStr]: staffIds }
    });
  };

  // Pin / unpin a staff on a date (pinned staff is always kept when regenerating)
  const togglePin = (dateStr, staffId) => {
    setStaffList(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const fixedDays = staff.fixedDays || [];
      return {
        ...staff,
        fixedDays: fixedDays.includes(dateStr) ? fixedDays.filter(d => d !== dateStr) : [...fixedDays, dateStr],
        offDays: staff.offDays.filter(d => d !== dateStr)
      };
    }));
  };

  const updateDayReqOverride = (dateStr, reqs) => {
    setDailyReqOverrides(prev => ({
      ...prev,
      [dateStr]: reqs
    }));
  };

  const removeDayReqOverride = (dateStr) => {
    setDailyReqOverrides(prev => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-apple-bg text-apple-ink overflow-hidden font-sans selection:bg-apple-blue/20">
      {/* Sidebar Panel */}
      <div className="w-80 bg-apple-sidebar border-r border-apple-line/60 flex flex-col relative z-10 flex-shrink-0">
        <div className="px-6 h-16 flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-apple-ink rounded-[9px] flex items-center justify-center">
             <Stethoscope className="text-white w-[18px] h-[18px]" strokeWidth={2.25} />
          </div>
          <h1 className="text-[19px] font-semibold tracking-tight text-apple-ink">MediShift</h1>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <Sidebar 
            staffList={staffList}
            onAddStaff={() => setEditingStaffId('new')}
            onEditStaff={(id) => setEditingStaffId(id)}
            removeStaff={removeStaff}
            dailyRequirements={dailyRequirements}
            setDailyRequirements={setDailyRequirements}
            onOpenRuleModal={() => setIsRuleModalOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchedStaff={searchedStaff}
            focusedStaffId={focusedStaffId}
            onFocusStaff={(id) => setFocusedStaffId(prev => prev === id ? null : id)}
            schedule={schedule}
            onGenerate={handleRegenerate}
            onClear={handleClearSchedule}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b border-apple-line/60 bg-white/75 backdrop-blur-xl backdrop-saturate-150 flex items-center justify-between px-8 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonthDate(prev => subMonths(prev, 1))}
              className="btn-icon"
              title={t('app.previous')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold tracking-tight text-apple-ink min-w-[170px] text-center tabular-nums">
              {lang === 'zh' ? format(currentMonthDate, 'yyyy 年 M 月') : format(currentMonthDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonthDate(prev => addMonths(prev, 1))}
              className="btn-icon"
              title={t('app.next')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="segmented">
              {[
                { key: 'calendar', label: t('app.calendar') },
                { key: 'analytics', label: t('app.analytics') },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn("segmented-item min-w-[96px]", activeTab === tab.key && "segmented-item-active")}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium text-apple-ink-2 hover:text-apple-ink hover:bg-apple-fill transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'en' ? '中文' : 'EN'}
            </button>
          </div>
        </header>

        <CandidateBar
          candidates={candidates}
          selectedIdx={currentView.idx}
          onSelect={selectCandidate}
          onRegenerate={handleRegenerate}
          keyboardEnabled={!editingStaffId && !isRuleModalOpen}
        />

        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'calendar' ? (
             <div className="absolute inset-0 px-8 py-6 overflow-y-auto">
               <CalendarView 
                 currentMonthDate={currentMonthDate}
                 schedule={schedule}
                 shortages={shortages}
                 staffList={staffList}
                 searchedStaff={searchedStaff}
                 overrideDayStaff={overrideDayStaff}
                 togglePin={togglePin}
                 pinConflicts={pinConflicts}
                 dailyRequirements={dailyRequirements}
                 dailyReqOverrides={dailyReqOverrides}
                 updateDayReqOverride={updateDayReqOverride}
                 removeDayReqOverride={removeDayReqOverride}
               />
             </div>
          ) : (
             <div className="absolute inset-0 px-8 py-6 overflow-y-auto">
               <StaffAnalyticsView 
                 schedule={schedule}
                 staffList={staffList}
                 currentMonthDate={currentMonthDate}
                 dailyReqOverrides={dailyReqOverrides}
               />
             </div>
          )}
        </main>
      </div>

      {editingStaffId && (
        <StaffModal 
          staff={editingStaffId === 'new' 
            ? { name: '', level: 'PGY1', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [], fixedDays: [] } 
            : staffList.find(s => s.id === editingStaffId)}
          currentMonthDate={currentMonthDate}
          onClose={() => setEditingStaffId(null)}
          onSave={handleStaffSave}
          isNew={editingStaffId === 'new'}
        />
      )}

      {isRuleModalOpen && (
        <RuleModal 
           currentMonthDate={currentMonthDate}
           dailyRequirements={dailyRequirements}
           dailyReqOverrides={dailyReqOverrides}
           updateDayReqOverride={updateDayReqOverride}
           removeDayReqOverride={removeDayReqOverride}
           onClose={() => setIsRuleModalOpen(false)}
        />
      )}
    </div>
  );
}

import StaffModal from './components/StaffModal';
import RuleModal from './components/RuleModal';
import StaffAnalyticsView from './components/StaffAnalyticsView';

export default App;
