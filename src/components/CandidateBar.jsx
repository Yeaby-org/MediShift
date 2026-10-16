import React, { useEffect } from 'react';
import { RefreshCw, Eye, GitCompare } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function CandidateBar({ candidates, showBreaks, diffCounts, showDiff, onToggleDiff, baseIdx, onSetBase, selectedIdx, onSelect, onRegenerate, keyboardEnabled }) {
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
    ...(showBreaks ? [{ key: 'breakShortfall', label: t('cand.breakShortfall'), bad: 'text-apple-red' }] : []),
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
          const isBase = idx === baseIdx;
          return (
            // div instead of button so the "Compare" button can live inside
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(idx)}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(idx)}
              className={cn(
                "group shrink-0 rounded-[14px] bg-white px-4 py-2.5 text-left transition-all duration-200 min-w-[168px] cursor-pointer",
                isActive
                  ? "ring-2 ring-apple-blue shadow-card"
                  : "shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-card",
                isBase && "outline-dashed outline-2 outline-offset-2 outline-apple-orange"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className={cn("text-[13px] font-semibold", isActive ? "text-apple-blue" : "text-apple-ink")}>
                    {t('cand.plan')} {idx + 1}
                  </span>
                  {idx === 0 && <span className="text-[10px] font-semibold text-apple-blue bg-apple-blue-soft rounded-full px-1.5 py-px">{t('cand.best')}</span>}
                </span>
                {isBase ? (
                  <span className="text-[10px] font-semibold text-[#c93400] bg-apple-orange/15 rounded-full px-1.5 py-px">{t('cand.base')}</span>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetBase(idx); }}
                    title={t('cand.compareTitle')}
                    className="flex items-center gap-0.5 text-[10px] font-medium text-apple-ink-3 hover:text-[#c93400] rounded-full px-1.5 py-px opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <GitCompare className="w-3 h-3" />
                    {t('cand.compare')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {metrics.map(m => (
                  <div key={m.key} className="flex justify-between gap-2 text-[11px] text-apple-ink-3">
                    <span>{m.label}</span>
                    <span className={cn("font-medium tabular-nums", c.score[m.key] > 0 ? m.bad : "text-apple-ink-3")}>{c.score[m.key]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 pt-1 border-t border-apple-fill flex justify-between text-[11px] text-apple-ink-3">
                {isBase ? (
                  <span>{t('cand.isBase')}</span>
                ) : (
                  <>
                    <span>{t('cand.diff')}</span>
                    <span className="font-medium tabular-nums text-[#c93400]">{diffCounts[idx]}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        <button onClick={onRegenerate} className="btn-secondary py-1.5 text-[13px]">
          <RefreshCw className="w-3.5 h-3.5" />
          {t('cand.regenerate')}
        </button>
        {candidates.length > 1 && <span className="text-[11px] text-apple-ink-3">{t('cand.hint')}</span>}
        {candidates.length > 1 && selectedIdx === baseIdx && (
          <span className="text-[11px] text-apple-ink-3">{t('cand.compareHint')}</span>
        )}
        {candidates.length > 1 && selectedIdx !== baseIdx && (
          <button
            onClick={onToggleDiff}
            className={cn("flex items-center gap-1 text-[11px] font-medium transition-colors", showDiff ? "text-apple-blue" : "text-apple-ink-3 hover:text-apple-ink-2")}
          >
            <Eye className="w-3 h-3" />
            {t('cand.showDiff')}
          </button>
        )}
      </div>
    </div>
  );
}
