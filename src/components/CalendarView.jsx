import React, { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  parseISO
} from 'date-fns';
import { AlertTriangle, X, Trash2, ChevronRight, Pin } from 'lucide-react';
import { cn, levelDotClass } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function CalendarView({
  currentMonthDate,
  schedule,
  scheduleDiff = {},
  shortages,
  staffList,
  searchedStaff,
  overrideDayStaff,
  togglePin,
  pinConflicts,
  dailyRequirements,
  dailyReqOverrides,
  updateDayReqOverride,
  removeDayReqOverride
}) {
  const { t, lang } = useTranslation();
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

  const weekDays = lang === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (dayStr) => {
    setSelectedDay(dayStr);
  };

  const currentDayStaffIds = selectedDay ? (schedule[selectedDay] || []) : [];

  // Local state for editing the day's overrides inside the modal
  const [reqEditMode, setReqEditMode] = useState(false);
  // default to either the override, or the global baseline
  const activeReq = selectedDay ? (dailyReqOverrides[selectedDay] || dailyRequirements) : dailyRequirements;

  const isPinned = (staff, dateStr) => Boolean(staff.fixedDays?.includes(dateStr));
  const selectedDayConflicts = selectedDay ? (pinConflicts[selectedDay] || []) : [];

  const toggleStaffInDay = (staffId) => {
    if (!selectedDay) return;
    // Turning off a pinned staff means unpinning them
    const staff = staffList.find(s => s.id === staffId);
    if (staff && isPinned(staff, selectedDay)) {
      togglePin(selectedDay, staffId);
      return;
    }
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
      isHoliday: fd.get('isHoliday') === 'on',
      noDuty: fd.get('noDuty') === 'on'
    });
    setReqEditMode(false);
  };

  const requiredTotal = activeReq.noDuty ? 0 : activeReq.total;
  const isShort = currentDayStaffIds.length < requiredTotal;

  const reqFields = [
    { name: 'total', label: t('cal.total'), value: activeReq.total },
    { name: 'minSeniorR', label: t('cal.snrR'), value: activeReq.minSeniorR || 0 },
    { name: 'minR', label: t('cal.anyR'), value: activeReq.minR },
    { name: 'minPGY', label: t('cal.pgy'), value: activeReq.minPGY },
  ];

  return (
    <>
      <div className="card min-h-full w-full flex flex-col overflow-hidden relative z-10">
        {/* Week Header */}
        <div className="grid grid-cols-7 bg-white/90 backdrop-blur z-20 sticky top-0 shrink-0 border-b border-apple-fill">
          {weekDays.map((day, i) => (
            <div key={day} className={cn("py-3 text-center text-xs font-medium", i === 0 || i === 6 ? "text-apple-ink-3" : "text-apple-ink-2")}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-apple-fill gap-px">
          {days.map((day) => {
            const formattedDate = format(day, dateFormat);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);
            const hasOverride = !!dailyReqOverrides[formattedDate];
            const isHoliday = Boolean(dailyReqOverrides[formattedDate]?.isHoliday);
            const isNoDuty = Boolean(dailyReqOverrides[formattedDate]?.noDuty);
            const isOffDay = isWeekend(day) || isHoliday;

            const dayStaffIds = schedule[formattedDate] || [];
            // When a staff is focused/searched, only show that person's shifts
            const dayStaff = dayStaffIds
              .filter(id => !searchedStaff || id === searchedStaff.id)
              .map(id => staffList.find(s => s.id === id))
              .filter(Boolean);
            const hasShortage = shortages.includes(formattedDate);
            // Diff vs 方案 1: who was swapped in / out on this day
            const dayDiff = scheduleDiff[formattedDate];
            const addedIds = dayDiff?.added || [];
            const removedStaff = (dayDiff?.removed || [])
              .filter(id => !searchedStaff || id === searchedStaff.id)
              .map(id => staffList.find(s => s.id === id))
              .filter(Boolean);

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
                  "min-h-[112px] p-2 flex flex-col transition-all duration-200 relative overflow-hidden",
                  !isCurrentMonth ? "bg-[#fafafc] cursor-default" : "bg-white hover:bg-[#fafafc] cursor-pointer",
                  isCurrentMonth && isNoDuty && "bg-apple-bg",
                  searchActive && isSearchedDay && "bg-apple-blue-soft/60 hover:bg-apple-blue-soft",
                  searchActive && !isSearchedDay && removedStaff.length === 0 && isCurrentMonth && "opacity-40"
                )}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className={cn(
                    "text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full tabular-nums",
                    !isCurrentMonth && "text-apple-line",
                    isCurrentMonth && (isCurrentDay
                      ? "bg-apple-red text-white font-semibold"
                      : isHoliday ? "text-apple-red" : isOffDay ? "text-apple-ink-3" : "text-apple-ink")
                  )}>
                    {format(day, 'd')}
                  </span>

                  {isCurrentMonth && (
                    <div className="flex items-center gap-1 pt-1.5 pr-0.5">
                      {isHoliday && <span className="text-[10px] font-medium text-apple-red">{t('cal.holiday')}</span>}
                      {isNoDuty && <span className="text-[10px] font-medium text-apple-ink-3">{t('cal.noDuty')}</span>}
                      {hasOverride && <span className="w-1.5 h-1.5 rounded-full bg-apple-ink-3" title={t('cal.overridden')} />}
                      {pinConflicts[formattedDate] && <span className="w-1.5 h-1.5 rounded-full bg-apple-orange" title={t('pin.conflicts')} />}
                      {hasShortage && <span className="w-1.5 h-1.5 rounded-full bg-apple-red" title={t('cal.shortage')} />}
                    </div>
                  )}
                </div>

                {/* Staff List for the day */}
                {isCurrentMonth && (
                  <div className="flex flex-col gap-1 mt-auto flex-1 h-0 overflow-y-auto no-scrollbar pointer-events-none">
                    {dayStaff.map(s => {
                      const isSearchedPerson = searchedStaff?.id === s.id;
                      const isAdded = addedIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          title={isAdded ? t('cand.added') : undefined}
                          className={cn(
                            "px-2 py-[3px] rounded-md text-[12px] font-medium transition-all truncate flex items-center gap-1.5",
                            isSearchedPerson ? "bg-apple-blue text-white"
                              : isAdded ? "bg-apple-orange/15 text-[#c93400]"
                              : "bg-apple-bg text-apple-ink",
                            isSearchedPerson && isAdded && "ring-2 ring-apple-orange"
                          )}
                        >
                          {isPinned(s, formattedDate)
                            ? <Pin className={cn("w-2.5 h-2.5 shrink-0 fill-current", !isSearchedPerson && "text-apple-blue")} />
                            : <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isSearchedPerson ? "bg-white" : levelDotClass(s.level))} />}
                          <span className="truncate">{s.name}</span>
                        </div>
                      )
                    })}
                    {removedStaff.map(s => (
                      <div
                        key={`removed-${s.id}`}
                        title={t('cand.removed')}
                        className="px-2 py-[3px] rounded-md text-[12px] font-medium truncate text-apple-ink-3 line-through opacity-60"
                      >
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-panel max-w-[400px] bg-apple-bg" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
               <div>
                 <div className="text-[13px] font-medium text-apple-ink-2">{format(parseISO(selectedDay), 'EEEE')}</div>
                 <h3 className="text-[22px] font-semibold tracking-tight text-apple-ink">
                   {lang === 'zh' ? format(parseISO(selectedDay), 'M 月 d 日') : format(parseISO(selectedDay), 'MMM d, yyyy')}
                 </h3>
               </div>
               <button onClick={() => setSelectedDay(null)} className="btn-icon bg-apple-fill/70">
                 <X className="w-4 h-4" />
               </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-5">

              {/* Day Overview Section */}
              <div className="inset-group grid grid-cols-2 divide-y-0 divide-x">
                 <div className="px-4 py-3">
                   <div className="text-xs text-apple-ink-3">{t('cal.assigned')}</div>
                   <div className="text-2xl font-semibold tabular-nums text-apple-ink">
                     {currentDayStaffIds.length}<span className="text-base text-apple-ink-3 font-medium"> / {requiredTotal}</span>
                   </div>
                 </div>
                 <div className="px-4 py-3">
                   <div className="text-xs text-apple-ink-3">{t('cal.status')}</div>
                   <div className={cn("text-[15px] font-semibold mt-1.5 flex items-center gap-1.5", isShort ? "text-apple-red" : "text-apple-green")}>
                     <span className={cn("w-2 h-2 rounded-full", isShort ? "bg-apple-red" : "bg-apple-green")} />
                     {isShort ? t('cal.shortage') : t('cal.filled')}
                   </div>
                 </div>
              </div>

              {/* Pin Conflicts */}
              {selectedDayConflicts.length > 0 && (
                <div className="rounded-[12px] bg-apple-orange/10 px-4 py-3">
                  <h4 className="text-[13px] font-semibold text-[#c93400] flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t('pin.conflicts')}
                  </h4>
                  <ul className="space-y-0.5">
                    {selectedDayConflicts.map(({ staffId, type }) => (
                      <li key={staffId + type} className="text-[13px] text-[#c93400]/90">
                        {staffList.find(s => s.id === staffId)?.name}：{t(`pin.${type}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Day Requirements Override Section */}
              <div>
                 <div className="flex items-center justify-between px-4 mb-1.5">
                   <h4 className="text-xs font-medium text-apple-ink-2">{t('cal.dayReq')}</h4>
                   {!reqEditMode && dailyReqOverrides[selectedDay] && (
                     <button onClick={() => removeDayReqOverride(selectedDay)} className="text-xs text-apple-red flex items-center gap-1 hover:opacity-70" title="Remove override">
                       <Trash2 className="w-3 h-3" />
                       {t('cal.overridden')}
                     </button>
                   )}
                 </div>

                 {reqEditMode ? (
                   <form onSubmit={handleOverrideSave} className="inset-group p-4 space-y-3 divide-y-0">
                       <div className="grid grid-cols-4 gap-2">
                         {reqFields.map(f => (
                           <label key={f.name} className="block">
                             <span className="block text-[11px] text-apple-ink-3 mb-1 text-center">{f.label}</span>
                             <input name={f.name} type="number" min="0" defaultValue={f.value} className="input px-1 py-1.5 text-center font-medium tabular-nums" />
                           </label>
                         ))}
                       </div>
                       <label className="flex items-center gap-2 cursor-pointer pt-1">
                         <input name="isHoliday" type="checkbox" defaultChecked={activeReq.isHoliday} className="w-4 h-4 rounded accent-apple-blue" />
                         <span className="text-[13px] text-apple-ink">{t('cal.markHoliday')}</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer">
                         <input name="noDuty" type="checkbox" defaultChecked={activeReq.noDuty} className="w-4 h-4 rounded accent-apple-blue" />
                         <span className="text-[13px] text-apple-ink">{t('cal.markNoDuty')}</span>
                       </label>
                       <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setReqEditMode(false)} className="btn-secondary flex-1 py-1.5">{t('cal.cancel')}</button>
                        <button type="submit" className="btn-primary flex-1 py-1.5">{t('cal.saveRules')}</button>
                      </div>
                   </form>
                 ) : (
                   <button className="inset-group w-full flex items-center px-4 py-3 group text-left" onClick={() => setReqEditMode(true)}>
                       <div className="flex-1 flex gap-5">
                         {reqFields.map(f => (
                           <div key={f.name}>
                             <div className="text-[11px] text-apple-ink-3">{f.label}</div>
                             <div className="text-[17px] font-semibold tabular-nums text-apple-ink">{f.value}</div>
                           </div>
                         ))}
                         {activeReq.isHoliday && (
                           <div className="self-center text-xs font-medium text-apple-red">{t('cal.holiday')}</div>
                         )}
                         {activeReq.noDuty && (
                           <div className="self-center text-xs font-medium text-apple-ink-3">{t('cal.noDuty')}</div>
                         )}
                       </div>
                      <ChevronRight className="w-4 h-4 text-apple-line group-hover:text-apple-ink-3 transition-colors" />
                   </button>
                 )}
              </div>

              {/* Staff Manual Assignment Section */}
              <div>
                 <h4 className="text-xs font-medium text-apple-ink-2 px-4 mb-1.5 flex justify-between">
                    <span>{t('cal.manualTarget')}</span>
                    <span className="text-apple-ink-3 tabular-nums">{currentDayStaffIds.length} {t('cal.selected')}</span>
                 </h4>
                 <div className="inset-group">
                 {staffList.map(staff => {
                   const isWorking = currentDayStaffIds.includes(staff.id);
                   const pinned = isPinned(staff, selectedDay);
                   return (
                     <label key={staff.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-apple-bg/50 transition-colors">
                       <span className={cn("w-2 h-2 rounded-full shrink-0", levelDotClass(staff.level))} />
                       <div className="flex-1 min-w-0">
                         <span className="text-[15px] text-apple-ink">{staff.name}</span>
                         <span className="text-xs text-apple-ink-3 ml-2">{staff.level}</span>
                       </div>
                       <button
                         type="button"
                         onClick={(e) => { e.preventDefault(); togglePin(selectedDay, staff.id); }}
                         title={pinned ? t('pin.unpin') : t('pin.pin')}
                         className={cn(
                           "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                           pinned ? "text-white bg-apple-blue" : "text-apple-line hover:text-apple-blue hover:bg-apple-blue-soft"
                         )}
                       >
                         <Pin className={cn("w-3.5 h-3.5", pinned && "fill-current")} />
                       </button>
                       <div className="relative flex items-center">
                         <input
                           type="checkbox"
                           checked={isWorking}
                           onChange={() => toggleStaffInDay(staff.id)}
                           className="peer sr-only"
                         />
                         {/* iOS-style switch */}
                         <div className="w-[46px] h-7 bg-apple-fill rounded-full peer-checked:bg-apple-green transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow-thumb after:transition-all after:duration-200 peer-checked:after:translate-x-[18px]"></div>
                       </div>
                     </label>
                   );
                 })}
                 </div>
              </div>
            </div>

            <div className="px-4 pb-4 pt-1 shrink-0">
               <button onClick={() => setSelectedDay(null)} className="btn-primary w-full py-2.5 text-[15px]">
                 {t('cal.done')}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
