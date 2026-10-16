import React from 'react';
import { Search, Plus, X, CalendarDays, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn, levelDotClass } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function Sidebar({
  staffList,
  onAddStaff,
  onEditStaff,
  removeStaff,
  dailyRequirements,
  setDailyRequirements,
  onOpenRuleModal,
  searchQuery,
  setSearchQuery,
  searchedStaff,
  focusedStaffId,
  onFocusStaff,
  schedule,
  onGenerate,
  onClear
}) {
  const { t } = useTranslation();

  // Find shifts for searched staff
  const staffShifts = [];
  if (searchedStaff) {
    Object.entries(schedule).forEach(([dateStr, staffIds]) => {
      if (staffIds.includes(searchedStaff.id)) {
        staffShifts.push(dateStr);
      }
    });
    staffShifts.sort();
  }

  return (
    <div className="flex flex-col gap-7 px-5 pb-6 pt-1 min-h-full">
      {/* Search Section */}
      <section>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-apple-ink-3" />
          </div>
          <input
            type="text"
            className="input pl-9 py-[7px] text-sm bg-apple-fill/70"
            placeholder={t('sidebar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Searched Staff Shifts Overview */}
        {searchedStaff && (
          <div className="mt-3 p-4 rounded-[14px] bg-white shadow-card animate-fade">
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full shrink-0", levelDotClass(searchedStaff.level))} />
              <h3 className="flex-1 text-[15px] font-semibold text-apple-ink truncate">
                {searchedStaff.name}{t('sidebar.shifts')}
              </h3>
              <span className="text-[13px] font-medium text-apple-ink-3 tabular-nums">{staffShifts.length}</span>
              {focusedStaffId && (
                <button
                  onClick={() => onFocusStaff(focusedStaffId)}
                  className="btn-icon w-6 h-6"
                  title={t('sidebar.showAll')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {staffShifts.length > 0 ? staffShifts.map(date => (
                <span key={date} className="px-2.5 py-1 bg-apple-bg text-apple-ink rounded-full text-xs font-medium tabular-nums">
                  {format(parseISO(date), 'M/d')} <span className="text-apple-ink-3">{format(parseISO(date), 'EEE')}</span>
                </span>
              )) : (
                <span className="text-sm text-apple-ink-3">{t('sidebar.noShifts')}</span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Settings Section */}
      <section className="space-y-2">
        <h3 className="section-title px-1">{t('sidebar.globalReq')}</h3>
        <div className="inset-group shadow-card">
          <label className="flex items-center justify-between px-4 py-3 text-[15px] text-apple-ink">
            <span>{t('sidebar.defaultTotal')}</span>
            <input
              type="number" min="1" max="20"
              className="w-14 bg-apple-bg rounded-lg px-2 py-1 text-center font-medium tabular-nums focus:outline-none focus:ring-4 focus:ring-apple-blue/15 focus:bg-white transition-all"
              value={dailyRequirements.total}
              onChange={(e) => setDailyRequirements({ ...dailyRequirements, total: parseInt(e.target.value) || 0 })}
            />
          </label>
          <button
            onClick={onOpenRuleModal}
            className="w-full flex items-center justify-between px-4 py-3 text-[15px] text-apple-blue hover:bg-apple-bg/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {t('sidebar.rulePlannerBtn')}
            </span>
          </button>
        </div>
      </section>

      {/* Staff Management Section */}
      <section className="space-y-2">
        <h3 className="section-title px-1 flex items-center justify-between">
          <span>{t('sidebar.directory')}</span>
          <span className="text-apple-ink-3 font-medium tabular-nums">{staffList.length}</span>
        </h3>
        <ul className="inset-group shadow-card">
          {staffList.map(staff => {
            const isFocused = focusedStaffId === staff.id;
            return (
              <li
                key={staff.id}
                onClick={() => onFocusStaff(staff.id)}
                title={t('sidebar.focusHint')}
                className={cn(
                  "px-4 py-3 flex items-center gap-3 group cursor-pointer transition-colors",
                  isFocused ? "bg-apple-blue-soft" : "hover:bg-apple-bg/60"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", levelDotClass(staff.level))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-[15px] font-medium truncate", isFocused ? "text-apple-blue" : "text-apple-ink")}>{staff.name}</span>
                    <span className="text-xs text-apple-ink-3">{staff.level}</span>
                  </div>
                  <div className="text-xs text-apple-ink-3 mt-0.5 flex gap-2 tabular-nums">
                    <span>{t('sidebar.wd')} {staff.maxWeekdays}</span>
                    <span>{t('sidebar.we')} {staff.maxWeekends}</span>
                    {staff.minWeekendBreaks > 0 && <span>{t('sidebar.breaks')} {staff.minWeekendBreaks}</span>}
                    {staff.offDays.length > 0 && <span className="text-apple-red">{staff.offDays.length} {t('sidebar.off')}</span>}
                    {staff.fixedDays?.length > 0 && <span className="text-apple-blue">{staff.fixedDays.length} {t('pin.pinned')}</span>}
                  </div>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEditStaff(staff.id)}
                    className="btn-icon w-7 h-7 hover:text-apple-blue"
                    title="Edit staff"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeStaff(staff.id)}
                    className="btn-icon w-7 h-7 hover:text-apple-red"
                    title="Remove staff"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
          <li>
            <button
              onClick={onAddStaff}
              className="w-full flex items-center gap-2 px-4 py-3 text-[15px] text-apple-blue hover:bg-apple-bg/60 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('sidebar.addStaffBtn')}
            </button>
          </li>
        </ul>
      </section>

      {/* Action Section */}
      <section className="mt-auto pt-2 flex flex-col gap-1">
         <button onClick={onGenerate} className="btn-primary w-full py-2.5 text-[15px]">
           <RefreshCw className="w-4 h-4" />
           {t('sidebar.generateBtn')}
         </button>
         <button
           onClick={onClear}
           className="w-full py-2 text-sm font-medium text-apple-red hover:opacity-70 transition-opacity"
         >
           {t('sidebar.clearBtn')}
         </button>
      </section>
    </div>
  );
}
