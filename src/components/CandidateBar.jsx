import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function CandidateBar({ candidates, selectedIdx, onSelect, onRegenerate, keyboardEnabled }) {
  const { t } = useTranslation();

  // ← → to switch plans
  useEffect(() => {
    if (!keyboardEnabled || candidates.length === 0) return;
    const handleKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') onSelect(Math.max(0, selectedIdx - 1));
      if (e.key === 'ArrowRight') onSelect(Math.min(candidates.length - 1, selectedIdx + 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [keyboardEnabled, candidates.length, selectedIdx, onSelect]);

  const metrics = [
    { key: 'shortageDays', label: t('cand.shortage'), bad: 'text-apple-red' },
    { key: 'qodTotal', label: t('cand.qod'), bad: 'text-apple-orange' },
    { key: 'shiftSpread', label: t('cand.spread'), bad: 'text-apple-ink' },
    { key: 'weekendSpread', label: t('cand.weSpread'), bad: 'text-apple-ink' },
  ];

  return (
    <div className="px-8 pt-5 flex items-center gap-4 shrink-0">
      <div className="flex-1 flex gap-2.5 overflow-x-auto no-scrollbar p-1 -m-1">
        {candidates.length === 0 ? (
          <div className="text-sm text-apple-ink-3 py-3">{t('cand.empty')}</div>
        ) : candidates.map((c, idx) => {
          const isActive = idx === selectedIdx;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={cn(
                "shrink-0 rounded-[14px] bg-white px-4 py-2.5 text-left transition-all duration-200 min-w-[156px]",
                isActive
                  ? "ring-2 ring-apple-blue shadow-card"
                  : "shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-card"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("text-[13px] font-semibold", isActive ? "text-apple-blue" : "text-apple-ink")}>
                  {t('cand.plan')} {idx + 1}
                </span>
                {idx === 0 && <span className="text-[10px] font-semibold text-apple-blue bg-apple-blue-soft rounded-full px-1.5 py-px">{t('cand.best')}</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {metrics.map(m => (
                  <div key={m.key} className="flex justify-between gap-2 text-[11px] text-apple-ink-3">
                    <span>{m.label}</span>
                    <span className={cn("font-medium tabular-nums", c.score[m.key] > 0 ? m.bad : "text-apple-ink-3")}>{c.score[m.key]}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        <button onClick={onRegenerate} className="btn-secondary py-1.5 text-[13px]">
          <RefreshCw className="w-3.5 h-3.5" />
          {t('cand.regenerate')}
        </button>
        {candidates.length > 1 && <span className="text-[11px] text-apple-ink-3">{t('cand.hint')}</span>}
      </div>
    </div>
  );
}
