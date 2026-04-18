import React, { useState } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isToday 
} from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function CalendarView({
  currentMonthDate,
  schedule,
  shortages,
  staffList,
  searchedStaff,
  overrideDayStaff,
  dailyRequirements,
  dailyReqOverrides,
  updateDayReqOverride,
  removeDayReqOverride
}) {
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "yyyy-MM-dd";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (dayStr) => {
    setSelectedDay(dayStr);
  };

  const currentDayStaffIds = selectedDay ? (schedule[selectedDay] || []) : [];
  
  // Local state for editing the day's overrides inside the modal
  const [reqEditMode, setReqEditMode] = useState(false);
  // default to either the override, or the global baseline
  const activeReq = selectedDay ? (dailyReqOverrides[selectedDay] || dailyRequirements) : dailyRequirements;

  const toggleStaffInDay = (staffId) => {
    if (!selectedDay) return;
    let newStaffIds = [...currentDayStaffIds];
    if (newStaffIds.includes(staffId)) {
      newStaffIds = newStaffIds.filter(id => id !== staffId);
    } else {
      newStaffIds.push(staffId);
    }
    overrideDayStaff(selectedDay, newStaffIds);
  };

  const handleOverrideSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    updateDayReqOverride(selectedDay, {
      total: parseInt(fd.get('total')) || 0,
      minSeniorR: parseInt(fd.get('minSeniorR')) || 0,
      minR: parseInt(fd.get('minR')) || 0,
      minPGY: parseInt(fd.get('minPGY')) || 0,
      isHoliday: fd.get('isHoliday') === 'on'
    });
    setReqEditMode(false);
  };

  return (
    <>
      <div className="min-h-full w-full flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative z-10">
        {/* Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 z-20 sticky top-0 shrink-0">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-black text-slate-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr cursor-pointer bg-slate-100 gap-[1px]">
          {days.map((day) => {
            const formattedDate = format(day, dateFormat);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);
            const hasOverride = !!dailyReqOverrides[formattedDate];
            
            const dayStaffIds = schedule[formattedDate] || [];
            const dayStaff = dayStaffIds.map(id => staffList.find(s => s.id === id)).filter(Boolean);
            const hasShortage = shortages.includes(formattedDate);
            
            const isSearchedDay = searchedStaff && dayStaffIds.includes(searchedStaff.id);
            const searchActive = !!searchedStaff;

            return (
              <div 
                key={day.toString()} 
                onClick={() => {
                  if (isCurrentMonth) {
                    handleDayClick(formattedDate);
                    setReqEditMode(false);
                  }
                }}
                className={cn(
                  "min-h-[110px] p-2 flex flex-col transition-all duration-300 relative bg-white overflow-hidden",
                  !isCurrentMonth ? "bg-slate-50/50 text-slate-400" : "hover:bg-slate-50",
                  isCurrentDay && "bg-indigo-50/50 hover:bg-indigo-50",
                  searchActive && isSearchedDay && "ring-2 ring-inset ring-indigo-500 bg-indigo-50 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]",
                  searchActive && !isSearchedDay && "opacity-30 grayscale"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full leading-none",
                    isCurrentDay ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-700",
                    !isCurrentDay && isCurrentMonth && dailyReqOverrides[formattedDate]?.isHoliday ? "text-rose-600" : ""
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {isCurrentMonth && (
                    <div className="flex flex-col items-end gap-1">
                      {hasShortage ? (
                         <div className="flex items-center text-rose-600 gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 text-[10px] uppercase font-black tracking-wider" title="Staff shortage">
                           <AlertCircle className="w-3 h-3" />
                           <span>Short</span>
                         </div>
                      ) : (
                         <div className="flex items-center text-emerald-500 gap-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Fully staffed">
                           <CheckCircle2 className="w-3.5 h-3.5" />
                         </div>
                      )}
                      <div className="flex gap-1 items-center mt-1">
                        {dailyReqOverrides[formattedDate]?.isHoliday && (
                           <div className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 px-1 rounded shadow-sm border border-rose-200" title="National Holiday">Hol</div>
                        )}
                        {hasOverride && (
                           <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm" title="Has custom requirements override" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Staff List for the day */}
                {isCurrentMonth && (
                  <div className="flex flex-col gap-1 mt-auto flex-1 h-0 overflow-y-auto no-scrollbar pointer-events-none pb-1">
                    {dayStaff.map(s => {
                      const isSearchedPerson = searchedStaff?.id === s.id;
                      const isR = s.level.startsWith('R');
                      return (
                        <div 
                          key={s.id} 
                          className={cn(
                            "px-2 py-1 rounded-md text-[11px] font-bold transition-all truncate border",
                            isSearchedPerson 
                              ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20" 
                              : isR 
                                ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          )}
                        >
                          {s.name}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                 {format(new Date(selectedDay), 'MMM d, yyyy')}
               </h3>
               <button 
                 onClick={() => setSelectedDay(null)}
                 className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              
              {/* Day Overview Section */}
              <div className="px-4 py-4 border-b border-slate-100 bg-indigo-50/30 flex items-center gap-4">
                 <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-indigo-100/50 flex-1 flex flex-col items-center justify-center">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">{t('cal.assigned')}</div>
                   <div className="text-xl font-black text-indigo-700 leading-none">{currentDayStaffIds.length} <span className="text-sm text-indigo-300">/ {activeReq.total}</span></div>
                 </div>
                 <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col items-center justify-center">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('cal.day')}</div>
                   <div className="text-sm font-bold text-slate-700">{format(new Date(selectedDay), 'EEEE')}</div>
                 </div>
                 <div className={cn(
                    "px-3 py-2 rounded-xl shadow-sm border flex-1 flex flex-col items-center justify-center",
                    currentDayStaffIds.length < activeReq.total ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
                 )}>
                   <div className={cn("text-[10px] font-black uppercase tracking-widest mb-0.5", currentDayStaffIds.length < activeReq.total ? "text-rose-500" : "text-emerald-500")}>{t('cal.status')}</div>
                   <div className={cn("text-xs font-bold whitespace-nowrap", currentDayStaffIds.length < activeReq.total ? "text-rose-700" : "text-emerald-700")}>
                     {currentDayStaffIds.length < activeReq.total ? t('cal.shortage') : t('cal.filled')}
                   </div>
                 </div>
              </div>

              {/* Day Requirements Override Section */}
              <div className="p-4 border-b border-slate-100 bg-white">
                 <div className="flex items-center justify-between mb-3">
                   <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                     <Settings2 className="w-3.5 h-3.5" />
                     {t('cal.dayReq')}
                   </h4>
                   {!reqEditMode && dailyReqOverrides[selectedDay] && (
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">{t('cal.overridden')}</span>
                       <button onClick={() => removeDayReqOverride(selectedDay)} className="text-slate-400 hover:text-rose-500" title="Remove override">
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   )}
                 </div>
                 
                 {reqEditMode ? (
                   <form onSubmit={handleOverrideSave} className="space-y-3">
                       <div className="grid grid-cols-4 gap-2">
                         <label className="block">
                           <span className="block text-[10px] font-bold text-slate-500 mb-1">{t('cal.total')}</span>
                           <input name="total" type="number" min="0" defaultValue={activeReq.total} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500" />
                         </label>
                         <label className="block">
                           <span className="block text-[10px] font-bold text-slate-500 mb-1">{t('cal.snrR')}</span>
                           <input name="minSeniorR" type="number" min="0" defaultValue={activeReq.minSeniorR || 0} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold text-indigo-900 focus:outline-none focus:border-indigo-500" />
                         </label>
                         <label className="block">
                           <span className="block text-[10px] font-bold text-slate-500 mb-1">{t('cal.anyR')}</span>
                           <input name="minR" type="number" min="0" defaultValue={activeReq.minR} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500" />
                         </label>
                         <label className="block">
                           <span className="block text-[10px] font-bold text-slate-500 mb-1">{t('cal.pgy')}</span>
                           <input name="minPGY" type="number" min="0" defaultValue={activeReq.minPGY} className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500" />
                         </label>
                       </div>
                       <div>
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input name="isHoliday" type="checkbox" defaultChecked={activeReq.isHoliday} className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300" />
                           <span className="text-[11px] font-bold text-slate-600">{t('cal.markHoliday')}</span>
                         </label>
                       </div>
                       <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setReqEditMode(false)} className="flex-1 py-1 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded">{t('cal.cancel')}</button>
                        <button type="submit" className="flex-1 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm">{t('cal.saveRules')}</button>
                      </div>
                   </form>
                 ) : (
                   <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm group cursor-pointer hover:border-slate-300 transition-colors" onClick={() => setReqEditMode(true)}>
                       <div className="flex gap-4">
                         <div className="text-center">
                           <div className="text-[10px] font-bold text-slate-400">{t('cal.total')}</div>
                           <div className="text-sm font-black text-slate-800">{activeReq.total}</div>
                         </div>
                         <div className="text-center">
                           <div className="text-[10px] font-bold text-slate-400">{t('cal.snrR')}</div>
                           <div className="text-sm font-black text-indigo-700">{activeReq.minSeniorR || 0}</div>
                         </div>
                         <div className="text-center">
                           <div className="text-[10px] font-bold text-slate-400">{t('cal.anyR')}</div>
                           <div className="text-sm font-black text-indigo-600">{activeReq.minR}</div>
                         </div>
                         <div className="text-center">
                           <div className="text-[10px] font-bold text-slate-400">{t('cal.pgy')}</div>
                           <div className="text-sm font-black text-emerald-600">{activeReq.minPGY}</div>
                         </div>
                         {activeReq.isHoliday && (
                           <div className="flex items-center ml-2">
                             <div className="text-[10px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">HOLIDAY</div>
                           </div>
                         )}
                       </div>
                      <Edit2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                   </div>
                 )}
              </div>

              {/* Staff Manual Assignment Section */}
              <div className="p-4 space-y-2">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                    <span>{t('cal.manualTarget')}</span>
                    <span className="text-indigo-600 font-bold">{currentDayStaffIds.length} {t('cal.selected')}</span>
                 </h4>
                 {staffList.map(staff => {
                   const isWorking = currentDayStaffIds.includes(staff.id);
                   const isR = staff.level.startsWith('R');
                   return (
                     <label key={staff.id} className={cn(
                       "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                       isWorking ? "bg-white border-indigo-200 shadow-sm" : "bg-slate-50 border-transparent hover:bg-slate-100"
                     )}>
                       <div>
                         <span className={cn("text-sm font-bold", isWorking ? "text-slate-900" : "text-slate-600")}>{staff.name}</span>
                         <span className={cn(
                           "text-[9px] uppercase font-black px-1.5 py-0.5 rounded ml-2 border",
                           isR ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                         )}>{staff.level}</span>
                       </div>
                       <div className="relative flex items-center h-5">
                         <input 
                           type="checkbox" 
                           checked={isWorking}
                           onChange={() => toggleStaffInDay(staff.id)}
                           className="peer sr-only"
                         />
                         <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:bg-indigo-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-4"></div>
                       </div>
                     </label>
                   );
                 })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
               <button 
                 onClick={() => setSelectedDay(null)}
                 className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
               >
                 {t('cal.done')}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
