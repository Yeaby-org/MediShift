import React, { useEffect } from 'react';
import { RefreshCw, Star } from 'lucide-react';
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
    { key: 'shortageDays', label: t('cand.shortage'), bad: 'text-rose-600' },
    { key: 'qodTotal', label: t('cand.qod'), bad: 'text-amber-600' },
    { key: 'shiftSpread', label: t('cand.spread'), bad: 'text-slate-700' },
    { key: 'weekendSpread', label: t('cand.weSpread'), bad: 'text-slate-700' },
  ];

  return (
    <div className="border-b border-slate-200 bg-white px-8 py-3 flex items-center gap-3 shrink-0 z-10">
      <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-1">
        {candidates.length === 0 ? (
          <div className="text-sm font-medium text-slate-400 italic py-2">{t('cand.empty')}</div>
        ) : candidates.map((c, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-left transition-all min-w-[150px]",
              idx === selectedIdx
                ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <div className={cn("text-xs font-black flex items-center gap-1 mb-1", idx === selectedIdx ? "text-indigo-700" : "text-slate-700")}>
              {t('cand.plan')} {idx + 1}
              {idx === 0 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              {metrics.map(m => (
                <div key={m.key} className="flex justify-between gap-2 text-[10px] font-bold text-slate-400">
                  <span>{m.label}</span>
                  <span className={c.score[m.key] > 0 ? m.bad : "text-emerald-600"}>{c.score[m.key]}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('cand.regenerate')}
        </button>
        {candidates.length > 1 && <span className="text-[10px] font-medium text-slate-400">{t('cand.hint')}</span>}
      </div>
    </div>
  );
}
