import React, { useMemo } from 'react';
import { differenceInDays, format, isWeekend, parseISO } from 'date-fns';
import { Users, AlertTriangle, CalendarCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function StaffAnalyticsView({ schedule, staffList, currentMonthDate, dailyReqOverrides }) {
  const { t } = useTranslation();
  const analytics = useMemo(() => {
    // Initialize stats
    const stats = staffList.map(staff => ({
      ...staff,
      dates: [],
      wdCount: 0,
      weCount: 0,
      qodCount: 0,
    }));

    // Populate dates
    Object.entries(schedule).forEach(([dateStr, staffIds]) => {
      const dateObj = parseISO(dateStr);
      const isWE = isWeekend(dateObj) || Boolean(dailyReqOverrides[dateStr]?.isHoliday);

      staffIds.forEach(id => {
        const p = stats.find(s => s.id === id);
        if (p) {
          p.dates.push(dateStr);
          if (isWE) p.weCount++;
          else p.wdCount++;
        }
      });
    });

    // Detect QODs (Work -> Rest -> Work)
    stats.forEach(p => {
      p.dates.sort(); // String sort works for YYYY-MM-DD
      let qods = 0;
      for (let i = 1; i < p.dates.length; i++) {
        const diff = differenceInDays(parseISO(p.dates[i]), parseISO(p.dates[i - 1]));
        if (diff === 2) {
          qods++;
        }
      }
      p.qodCount = qods;
    });

    return stats.sort((a, b) => {
      // Sort by Seniors first then names or total shifts
      if (a.level.startsWith('R') && !b.level.startsWith('R')) return -1;
      if (!a.level.startsWith('R') && b.level.startsWith('R')) return 1;
      return (b.wdCount + b.weCount) - (a.wdCount + a.weCount);
    });
  }, [schedule, staffList, dailyReqOverrides]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            {t('stat.title')}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {t('stat.desc')} {analytics.length} {t('stat.membersFor')} {format(currentMonthDate, 'MMMM yyyy')}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {analytics.map(staff => {
          const totalShifts = staff.wdCount + staff.weCount;
          const isR = staff.level.startsWith('R');
          const hasQOD = staff.qodCount > 0;
          
          return (
            <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-md transition-all">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-800">{staff.name}</h3>
                  <span className={cn(
                    "inline-block mt-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-md border",
                    isR ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}>
                    {staff.level}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-800 leading-none">{totalShifts}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('stat.totalShifts')}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 shrink-0">
                 <div className="p-4 flex flex-col items-center justify-center bg-white">
                    <div className="text-xl font-bold text-slate-700">{staff.wdCount} <span className="text-sm font-medium text-slate-400">/ {staff.maxWeekdays}</span></div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t('stat.weekdays')}</div>
                 </div>
                 <div className="p-4 flex flex-col items-center justify-center bg-white">
                    <div className="text-xl font-bold text-slate-700">{staff.weCount} <span className="text-sm font-medium text-slate-400">/ {staff.maxWeekends}</span></div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t('stat.weekends')}</div>
                 </div>
              </div>

              {/* QOD Alert */}
              <div className={cn(
                "p-3 flex items-center justify-center gap-2 border-b border-slate-100 font-bold text-sm shrink-0",
                hasQOD ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {hasQOD ? (
                  <><AlertTriangle className="w-4 h-4" /> {staff.qodCount} {t('stat.qodIncidents')}</>
                ) : (
                  <><CalendarCheck className="w-4 h-4" /> {t('stat.noQod')}</>
                )}
              </div>

              {/* Working Dates */}
              <div className="p-4 bg-slate-50 flex-1 overflow-y-auto">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('stat.assignedDates')}</h4>
                 <div className="flex flex-wrap gap-1.5">
                   {staff.dates.length === 0 ? (
                      <span className="text-sm text-slate-400 italic">{t('stat.noShiftsAssigned')}</span>
                   ) : staff.dates.map(dStr => {
                      const isHoliday = Boolean(dailyReqOverrides[dStr]?.isHoliday);
                      const isWei = isWeekend(parseISO(dStr)) || isHoliday;
                      return (
                        <span key={dStr} className={cn(
                          "px-2 py-1 rounded text-xs font-bold border flex items-center gap-1",
                          isWei ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-slate-600 border-slate-200"
                        )}>
                          {format(parseISO(dStr), 'MMM d')}
                          {isHoliday && <span className="text-[10px]">&nbsp;🌴</span>}
                        </span>
                      )
                   })}
                 </div>
              </div>

              {/* Off Dates */}
              {staff.offDays && staff.offDays.length > 0 && (
                 <div className="p-4 bg-white border-t border-slate-100 flex-1 overflow-y-auto">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      {t('stat.reqOffDays')}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {staff.offDays.map(dStr => (
                        <span key={dStr} className="px-2 py-1 rounded text-xs font-bold border bg-slate-50 text-slate-500 border-slate-200 line-through decoration-slate-300">
                          {format(parseISO(dStr), 'MMM d')}
                        </span>
                      ))}
                    </div>
                 </div>
              )}
              
            </div>
          )
        })}
      </div>
    </div>
  )
}
