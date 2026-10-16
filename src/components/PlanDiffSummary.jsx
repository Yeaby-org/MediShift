import React from 'react';
import { GitCompare } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

// 每位醫師的班數變化 (正在看的方案 - 基準)
export default function PlanDiffSummary({ viewIdx, baseIdx, changedDays, staffDelta, focusedStaffId, onFocusStaff }) {
  const { t } = useTranslation();

  // Fewer shifts / QOD is good (green); more breaks is good
  const fields = [
    { key: 'wd', label: t('diff.wd'), goodWhenUp: false },
    { key: 'we', label: t('diff.we'), goodWhenUp: false },
    { key: 'qod', label: t('diff.qod'), goodWhenUp: false },
    { key: 'breaks', label: t('diff.breaks'), goodWhenUp: true },
  ];

  return (
    <div className="px-8 pt-3 shrink-0">
      <div className="card px-4 py-2.5 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="shrink-0 flex items-center gap-1.5 text-[13px] text-apple-ink">
          <GitCompare className="w-3.5 h-3.5 text-apple-ink-3" />
          <span className="font-semibold text-apple-blue">{t('cand.plan')} {viewIdx + 1}</span>
          <span className="text-apple-ink-3">{t('diff.vs')}</span>
          <span className="font-semibold text-[#c93400]">{t('cand.plan')} {baseIdx + 1}</span>
          <span className="text-apple-ink-3">（{t('cand.base')}）· {t('cand.diff')}</span>
          <span className="font-semibold tabular-nums">{changedDays}</span>
        </div>

        <div className="w-px h-5 bg-apple-fill shrink-0" />

        {staffDelta.length === 0 ? (
          <span className="text-[13px] text-apple-ink-3 shrink-0">{t('diff.noStaffChange')}</span>
        ) : (
          <div className="flex items-center gap-2">
            {staffDelta.map(d => (
              <button
                key={d.id}
                onClick={() => onFocusStaff(d.id)}
                title={t('sidebar.focusHint')}
                className={cn(
                  "shrink-0 flex items-center gap-2 rounded-full px-3 py-1 text-[12px] transition-colors",
                  focusedStaffId === d.id ? "bg-apple-blue text-white" : "bg-apple-bg hover:bg-apple-fill text-apple-ink"
                )}
              >
                <span className="font-medium">{d.name}</span>
                {fields.filter(f => d[f.key]).map(f => {
                  const good = (d[f.key] > 0) === f.goodWhenUp;
                  return (
                    <span
                      key={f.key}
                      className={cn("tabular-nums", focusedStaffId === d.id ? "text-white/90" : good ? "text-[#248a3d]" : "text-[#c93400]")}
                    >
                      {f.label}{d[f.key] > 0 ? '+' : '−'}{Math.abs(d[f.key])}
                    </span>
                  );
                })}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
