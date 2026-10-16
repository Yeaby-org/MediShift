import React, { useMemo } from 'react';
import { format, isWeekend, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn, levelDotClass } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { computeStaffStats } from '../lib/scheduler';

export default function StaffAnalyticsView({ schedule, staffList, currentMonthDate, dailyReqOverrides }) {
  const { t, lang } = useTranslation();
  const analytics = useMemo(() => {
    const stats = computeStaffStats(schedule, staffList, dailyReqOverrides);

    return stats.sort((a, b) => {
      // Sort by Seniors first then names or total shifts
      if (a.level.startsWith('R') && !b.level.startsWith('R')) return -1;
      if (!a.level.startsWith('R') && b.level.startsWith('R')) return 1;
      return (b.wdCount + b.weCount) - (a.wdCount + a.weCount);
    });
  }, [schedule, staffList, dailyReqOverrides]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-8">
      <div className="pt-2">
        <h2 className="text-[32px] font-semibold tracking-tight text-apple-ink">
          {t('stat.title')}
        </h2>
        <p className="text-[15px] text-apple-ink-2 mt-1">
          {t('stat.desc')} {analytics.length} {t('stat.membersFor')} {lang === 'zh' ? format(currentMonthDate, 'yyyy 年 M 月') : format(currentMonthDate, 'MMMM yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {analytics.map(staff => {
          const totalShifts = staff.wdCount + staff.weCount;
          const hasQOD = staff.qodCount > 0;

          return (
            <div key={staff.id} className="card p-6 flex flex-col gap-5 transition-shadow duration-200 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]">

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[19px] font-semibold tracking-tight text-apple-ink">{staff.name}</h3>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-apple-ink-2">
                    <span className={cn("w-2 h-2 rounded-full", levelDotClass(staff.level))} />
                    {staff.level}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[40px] leading-none font-semibold tracking-tight tabular-nums text-apple-ink">{totalShifts}</div>
                  <div className="text-xs text-apple-ink-3 mt-1">{t('stat.totalShifts')}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { label: t('stat.weekdays'), value: staff.wdCount, max: staff.maxWeekdays },
                   { label: t('stat.weekends'), value: staff.weCount, max: staff.maxWeekends },
                 ].map(s => (
                   <div key={s.label} className="bg-apple-bg rounded-[12px] px-4 py-3">
                      <div className="text-xs text-apple-ink-3">{s.label}</div>
                      <div className="text-[22px] font-semibold tabular-nums text-apple-ink">
                        {s.value}<span className="text-sm font-medium text-apple-ink-3"> / {s.max}</span>
                      </div>
                      <div className="h-1 rounded-full bg-apple-fill mt-2 overflow-hidden">
                        <div className="h-full rounded-full bg-apple-blue transition-all duration-500" style={{ width: `${s.max ? Math.min(100, (s.value / s.max) * 100) : 0}%` }} />
                      </div>
                   </div>
                 ))}
              </div>

              {/* QOD */}
              <div className={cn("flex items-center gap-1.5 text-[13px] font-medium", hasQOD ? "text-[#c93400]" : "text-[#248a3d]")}>
                {hasQOD ? (
                  <><AlertTriangle className="w-4 h-4" /> {staff.qodCount} {t('stat.qodIncidents')}</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> {t('stat.noQod')}</>
                )}
              </div>

              {/* Working Dates */}
              <div>
                 <h4 className="text-xs text-apple-ink-3 mb-2">{t('stat.assignedDates')}</h4>
                 <div className="flex flex-wrap gap-1.5">
                   {staff.dates.length === 0 ? (
                      <span className="text-[13px] text-apple-ink-3">{t('stat.noShiftsAssigned')}</span>
                   ) : staff.dates.map(dStr => {
                      const isHoliday = Boolean(dailyReqOverrides[dStr]?.isHoliday);
                      const isWei = isWeekend(parseISO(dStr)) || isHoliday;
                      return (
                        <span key={dStr} className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium tabular-nums",
                          isWei ? "bg-apple-orange/15 text-[#b25000]" : "bg-apple-bg text-apple-ink"
                        )}>
                          {format(parseISO(dStr), 'M/d')}
                        </span>
                      )
                   })}
                 </div>
              </div>

              {/* Off Dates */}
              {staff.offDays && staff.offDays.length > 0 && (
                 <div>
                    <h4 className="text-xs text-apple-ink-3 mb-2">{t('stat.reqOffDays')}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {[...staff.offDays].sort().map(dStr => (
                        <span key={dStr} className="px-2.5 py-1 rounded-full text-xs font-medium tabular-nums text-apple-ink-3 bg-apple-bg line-through decoration-apple-line">
                          {format(parseISO(dStr), 'M/d')}
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
