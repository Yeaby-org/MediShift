import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { generateSchedule } from './lib/scheduler';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import { cn } from './lib/utils';
import { Stethoscope } from 'lucide-react';

const INITIAL_STAFF = [
  { id: uuidv4(), name: 'Dr. Smith', level: 'R3', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [] },
  { id: uuidv4(), name: 'Dr. John', level: 'R2', maxWeekdays: 4, maxWeekends: 3, availability: 'Full Month', offDays: [] },
  { id: uuidv4(), name: 'Dr. House', level: 'R1', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [] },
  { id: uuidv4(), name: 'Dr. Jackie', level: 'PGY3', maxWeekdays: 4, maxWeekends: 3, availability: 'Full Month', offDays: [] },
  { id: uuidv4(), name: 'Dr. Strange', level: 'PGY2', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [] }
];

function App() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF);
  const [dailyRequirements, setDailyRequirements] = useState({ total: 2, minR: 0, minPGY: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonthDate, setCurrentMonthDate] = useState(startOfMonth(new Date()));
  const [manualOverrides, setManualOverrides] = useState({}); // { 'YYYY-MM-DD': ['staffId1', 'staffId2'] }
  const [dailyReqOverrides, setDailyReqOverrides] = useState({}); // { 'YYYY-MM-DD': { total, minR, minPGY } }
  
  const [baseSchedule, setBaseSchedule] = useState({});
  const [shortages, setShortages] = useState([]);
  
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'analytics'
  
  // Explicitly generate schedule
  const handleGenerateSchedule = () => {
    const { schedule: newSchedule, shortages: newShortages } = generateSchedule(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth(),
      staffList,
      dailyRequirements,
      dailyReqOverrides
    );
    setBaseSchedule(newSchedule);
    setShortages(newShortages);
    setManualOverrides({}); // Reset overrides on new generation
  };

  const handleClearSchedule = () => {
    setBaseSchedule({});
    setShortages([]);
    setManualOverrides({});
  };

  // Generate initial schedule on mount
  React.useEffect(() => {
    handleGenerateSchedule();
  }, [currentMonthDate]); // auto gen when month changes so map doesn't break
  
  // Merge overrides
  const schedule = useMemo(() => {
    const merged = { ...baseSchedule };
    Object.keys(manualOverrides).forEach(date => {
      merged[date] = manualOverrides[date];
    });
    return merged;
  }, [baseSchedule, manualOverrides]);

  // Derived filtered personal schedule
  const searchedStaff = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return staffList.find(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, staffList]);

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
    setManualOverrides(prev => ({
      ...prev,
      [dateStr]: staffIds
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
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans selection:bg-indigo-100">
      {/* Sidebar Panel */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-10 flex-shrink-0">
        <div className="p-6 pb-4 border-b border-slate-100 bg-white flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20">
             <Stethoscope className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">MediShift</h1>
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
            schedule={schedule}
            currentMonthDate={currentMonthDate}
            onGenerate={handleGenerateSchedule}
            onClear={handleClearSchedule}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
        <header className="h-[88px] border-b border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col justify-center px-8 z-10 shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentMonthDate(prev => subMonths(prev, 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
              >
                Previous
              </button>
              <h2 className="text-xl font-black text-slate-800 min-w-[150px] text-center tracking-tight">
                {format(currentMonthDate, 'MMMM yyyy')}
              </h2>
              <button 
                onClick={() => setCurrentMonthDate(prev => addMonths(prev, 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
              >
                Next
              </button>
            </div>
            
            <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner border border-slate-200 relative">
              <div className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-out z-0 pointer-events-none" style={{ transform: activeTab === 'calendar' ? 'translateX(4px)' : 'translateX(100%)' }} />
              <button 
                onClick={() => setActiveTab('calendar')}
                className={cn("relative z-10 px-6 py-1.5 text-sm font-bold rounded-lg transition-colors", activeTab === 'calendar' ? "text-indigo-700" : "text-slate-500 hover:text-slate-700")}
              >
                Calendar
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={cn("relative z-10 px-6 py-1.5 text-sm font-bold rounded-lg transition-colors ml-1", activeTab === 'analytics' ? "text-indigo-700" : "text-slate-500 hover:text-slate-700")}
              >
                Analytics
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'calendar' ? (
             <div className="absolute inset-0 p-6 overflow-y-auto">
               <CalendarView 
                 currentMonthDate={currentMonthDate}
                 schedule={schedule}
                 shortages={shortages}
                 staffList={staffList}
                 searchedStaff={searchedStaff}
                 overrideDayStaff={overrideDayStaff}
                 dailyRequirements={dailyRequirements}
                 dailyReqOverrides={dailyReqOverrides}
                 updateDayReqOverride={updateDayReqOverride}
                 removeDayReqOverride={removeDayReqOverride}
               />
             </div>
          ) : (
             <div className="absolute inset-0 p-6 overflow-y-auto">
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
            ? { name: '', level: 'PGY1', maxWeekdays: 5, maxWeekends: 2, availability: 'Full Month', offDays: [] } 
            : staffList.find(s => s.id === editingStaffId)}
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
