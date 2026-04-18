import React, { useState } from 'react';
import { Search, UserPlus, X, Calendar as CalendarIcon, Users, Edit2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
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
  schedule,
  currentMonthDate,
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
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Search Section */}
      <section>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 bg-slate-50 rounded-xl leading-5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-slate-400 transition-all sm:text-sm shadow-sm"
            placeholder={t('sidebar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Searched Staff Shifts Overview */}
        {searchedStaff && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
              {searchedStaff.name}{t('sidebar.shifts')}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {staffShifts.length > 0 ? staffShifts.map(date => (
                <span key={date} className="px-2 py-1 bg-white text-indigo-700 rounded-md text-xs font-semibold border border-indigo-200 shadow-sm">
                  {format(new Date(date), 'd')} ({format(new Date(date), 'EEE')})
                </span>
              )) : (
                <span className="text-sm text-slate-500 italic">{t('sidebar.noShifts')}</span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Settings Section */}
      <section className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
           <Users className="w-4 h-4 text-slate-400" />
           {t('sidebar.globalReq')}
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span title="Default number of people working per day for the month">{t('sidebar.defaultTotal')}</span>
            <input 
              type="number" min="1" max="20"
              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-center font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
              value={dailyRequirements.total}
              onChange={(e) => setDailyRequirements({ ...dailyRequirements, total: parseInt(e.target.value) || 0 })}
            />
          </label>
        </div>
        
        <button 
          onClick={onOpenRuleModal}
          className="w-full mt-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <CalendarIcon className="w-4 h-4" />
          {t('sidebar.rulePlannerBtn')}
        </button>
      </section>

      {/* Staff Management Section */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
           <span>{t('sidebar.directory')} ({staffList.length})</span>
        </h3>
        <ul className="space-y-3">
          {staffList.map(staff => (
            <li key={staff.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2 group shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800">{staff.name}</span>
                    <span className={cn(
                      "text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md border",
                      staff.level.startsWith('R') 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>{staff.level}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 flex gap-2.5 items-center">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{t('sidebar.wd')}: {staff.maxWeekdays}</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{t('sidebar.we')}: {staff.maxWeekends}</span>
                    {staff.offDays.length > 0 && <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{staff.offDays.length} {t('sidebar.off')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEditStaff(staff.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                    title="Edit staff"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeStaff(staff.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    title="Remove staff"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        <button 
          onClick={onAddStaff} 
          className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-dashed border-slate-300 rounded-xl py-3 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          {t('sidebar.addStaffBtn')}
        </button>
      </section>

      {/* Action Section */}
      <section className="mt-auto pt-6 flex flex-col gap-2">
         <button 
           onClick={onGenerate}
           className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 flex items-center justify-center gap-2"
         >
           <CalendarIcon className="w-5 h-5" />
           {t('sidebar.generateBtn')}
         </button>
         <button 
           onClick={onClear}
           className="w-full py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
         >
           <X className="w-4 h-4" />
           {t('sidebar.clearBtn')}
         </button>
      </section>
    </div>
  );
}
