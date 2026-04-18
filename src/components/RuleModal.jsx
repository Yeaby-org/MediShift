import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, CheckCheck, Trash2 } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWeekend } from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function RuleModal({ 
  currentMonthDate, 
  dailyRequirements, 
  dailyReqOverrides, 
  updateDayReqOverride, 
  removeDayReqOverride, 
  onClose 
}) {
  const { t } = useTranslation();
  const [selectedDates, setSelectedDates] = useState(new Set());
  
  // Form State
  const [ruleForm, setRuleForm] = useState({
    total: dailyRequirements.total,
    minR: dailyRequirements.minR,
    minSeniorR: dailyRequirements.minSeniorR || 0,
    minPGY: dailyRequirements.minPGY,
    isHoliday: false
  });

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(monthStart);
  
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const toggleDate = (dateStr) => {
    const newSet = new Set(selectedDates);
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }
    setSelectedDates(newSet);
  };

  const handleSelectWeekends = () => {
    const newSet = new Set(selectedDates);
    daysInMonth.forEach(day => {
      if (isWeekend(day)) {
        newSet.add(format(day, 'yyyy-MM-dd'));
      }
    });
    setSelectedDates(newSet);
  };

  const handleApply = () => {
    if (selectedDates.size === 0) return;
    
    selectedDates.forEach(dateStr => {
      updateDayReqOverride(dateStr, { ...ruleForm });
    });
    
    setSelectedDates(new Set());
  };

  // Sort overrides for display
  const overrideEntries = Object.entries(dailyReqOverrides).sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
              {t('ruleModal.title')}
            </h3>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
        </div>
        
        {/* Body (Two Columns) */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* LEFT COL: Multi-select Calendar */}
          <div className="md:w-1/2 flex flex-col border-r border-slate-200 bg-slate-50/50">
             <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                   <h4 className="font-bold text-slate-800 tracking-tight">{t('ruleModal.selectDays')}</h4>
                   <p className="text-xs text-slate-500 font-medium">{t('ruleModal.selectDaysDesc')}</p>
                </div>
                <button 
                  onClick={handleSelectWeekends}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                >
                  {t('ruleModal.pickWeekends')}
                </button>
             </div>
             <div className="p-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-7 gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>
                  ))}
                  
                  {/* Padding offsets */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}

                  {/* Days */}
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDates.has(dateStr);
                    const hasRule = !!dailyReqOverrides[dateStr];

                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleDate(dateStr)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all text-sm font-bold shadow-sm",
                          isSelected 
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-600/30 scale-105 z-10" 
                            : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50",
                          hasRule && !isSelected && "ring-1 ring-amber-400 ring-offset-1 border-amber-200 bg-amber-50"
                        )}
                      >
                         {format(day, 'd')}
                         {hasRule && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" title="Already holds a custom rule" />}
                         {isSelected && <CheckCheck className="w-3.5 h-3.5 text-indigo-200 absolute bottom-1" />}
                      </button>
                    )
                  })}
                </div>
             </div>
          </div>

          {/* RIGHT COL: Settings & Overview */}
          <div className="md:w-1/2 flex flex-col">
             {/* Form Area */}
             <div className="p-5 border-b border-slate-200 bg-white shadow-sm z-10">
                <h4 className="font-bold text-slate-800 tracking-tight mb-4 flex items-center justify-between">
                   <span>{t('ruleModal.applyRules')}</span>
                   <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                     {selectedDates.size} {t('ruleModal.daysSelected')}
                   </span>
                </h4>
                
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <label className="block">
                     <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 text-center">{t('ruleModal.totalNeeds')}</span>
                     <input 
                       type="number" min="0" 
                       value={ruleForm.total}
                       onChange={e => setRuleForm(prev => ({ ...prev, total: parseInt(e.target.value) || 0 }))}
                       className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-2 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center font-bold"
                     />
                  </label>
                  <label className="block">
                     <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5 text-center">{t('ruleModal.minSeniorR')}</span>
                     <input 
                       type="number" min="0" 
                       value={ruleForm.minSeniorR}
                       onChange={e => setRuleForm(prev => ({ ...prev, minSeniorR: parseInt(e.target.value) || 0 }))}
                       className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-2 py-2 text-indigo-900 border-indigo-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center font-bold"
                     />
                  </label>
                  <label className="block">
                     <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1.5 text-center">{t('ruleModal.minR')}</span>
                     <input 
                       type="number" min="0" 
                       value={ruleForm.minR}
                       onChange={e => setRuleForm(prev => ({ ...prev, minR: parseInt(e.target.value) || 0 }))}
                       className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-2 py-2 text-indigo-900 border-indigo-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center font-bold"
                     />
                  </label>
                  <label className="block">
                     <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5 text-center">{t('ruleModal.minPGY')}</span>
                     <input 
                       type="number" min="0" 
                       value={ruleForm.minPGY}
                       onChange={e => setRuleForm(prev => ({ ...prev, minPGY: parseInt(e.target.value) || 0 }))}
                       className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-2 py-2 text-emerald-900 border-emerald-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center font-bold"
                     />
                  </label>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={ruleForm.isHoliday}
                      onChange={e => setRuleForm(prev => ({...prev, isHoliday: e.target.checked}))}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-700">{t('ruleModal.treatHoliday')}</span>
                  </label>
                </div>
                
                <button 
                  onClick={handleApply}
                  disabled={selectedDates.size === 0}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                >
                  {t('ruleModal.applyBtn')} {selectedDates.size} Days
                </button>
             </div>

             {/* Overview Matrix */}
             <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
               <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{t('ruleModal.activeRules')}</h4>
               
               {overrideEntries.length === 0 ? (
                 <div className="text-center py-8 text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                   {t('ruleModal.noRules')}
                 </div>
               ) : (
                 <ul className="space-y-2">
                   {overrideEntries.map(([dateStr, reqs]) => (
                     <li key={dateStr} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                             {format(new Date(dateStr), 'MMM d, yyyy (EEE)')}
                             {reqs.isHoliday && <span className="text-[9px] uppercase font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">Holiday</span>}
                          </p>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Total: <span className="text-slate-800">{reqs.total}</span> | 
                            Snr R: <span className="text-indigo-600">{reqs.minSeniorR || 0}</span> | 
                            Any R: <span className="text-indigo-500">{reqs.minR}</span> | 
                            PGY: <span className="text-emerald-600">{reqs.minPGY}</span>
                          </p>
                        </div>
                        <button 
                          onClick={() => removeDayReqOverride(dateStr)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          title="Remove custom rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
