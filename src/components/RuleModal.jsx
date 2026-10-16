import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWeekend, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function RuleModal({
  currentMonthDate,
  dailyRequirements,
  dailyReqOverrides,
  updateDayReqOverride,
  removeDayReqOverride,
  onClose
}) {
  const { t, lang } = useTranslation();
  const [selectedDates, setSelectedDates] = useState(new Set());

  // Form State
  const [ruleForm, setRuleForm] = useState({
    total: dailyRequirements.total,
    minR: dailyRequirements.minR,
    minSeniorR: dailyRequirements.minSeniorR || 0,
    minPGY: dailyRequirements.minPGY,
    isHoliday: false
  });

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(monthStart);

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const toggleDate = (dateStr) => {
    const newSet = new Set(selectedDates);
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }
    setSelectedDates(newSet);
  };

  const handleSelectWeekends = () => {
    const newSet = new Set(selectedDates);
    daysInMonth.forEach(day => {
      if (isWeekend(day)) {
        newSet.add(format(day, 'yyyy-MM-dd'));
      }
    });
    setSelectedDates(newSet);
  };

  const handleApply = () => {
    if (selectedDates.size === 0) return;

    selectedDates.forEach(dateStr => {
      updateDayReqOverride(dateStr, { ...ruleForm });
    });

    setSelectedDates(new Set());
  };

  // Sort overrides for display
  const overrideEntries = Object.entries(dailyReqOverrides).sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));

  const weekDays = lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const formFields = [
    { key: 'total', label: t('ruleModal.totalNeeds') },
    { key: 'minSeniorR', label: t('ruleModal.minSeniorR') },
    { key: 'minR', label: t('ruleModal.minR') },
    { key: 'minPGY', label: t('ruleModal.minPGY') },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-4xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
            <h3 className="text-[22px] font-semibold tracking-tight text-apple-ink">
              {t('ruleModal.title')}
            </h3>
            <button onClick={onClose} className="btn-icon bg-apple-fill/70">
              <X className="w-4 h-4" />
            </button>
        </div>

        {/* Body (Two Columns) */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

          {/* LEFT COL: Multi-select Calendar */}
          <div className="md:w-1/2 flex flex-col px-6 pb-6">
             <div className="flex items-end justify-between mb-4">
                <div>
                   <h4 className="text-[15px] font-semibold text-apple-ink">{t('ruleModal.selectDays')}</h4>
                   <p className="text-xs text-apple-ink-3 mt-0.5">{t('ruleModal.selectDaysDesc')}</p>
                </div>
                <button onClick={handleSelectWeekends} className="btn-secondary py-1 px-3 text-[13px]">
                  {t('ruleModal.pickWeekends')}
                </button>
             </div>
             <div className="overflow-y-auto flex-1">
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-[11px] font-medium text-apple-ink-3 py-1">{d}</div>
                  ))}

                  {/* Padding offsets */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}

                  {/* Days */}
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDates.has(dateStr);
                    const hasRule = !!dailyReqOverrides[dateStr];

                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleDate(dateStr)}
                        className={cn(
                          "aspect-square rounded-full flex flex-col items-center justify-center relative text-sm font-medium tabular-nums transition-all duration-150 active:scale-90",
                          isSelected
                            ? "bg-apple-blue text-white"
                            : "text-apple-ink hover:bg-apple-blue-soft",
                          !isSelected && isWeekend(day) && "text-apple-ink-3"
                        )}
                      >
                         {format(day, 'd')}
                         {hasRule && <span className={cn("w-1 h-1 rounded-full absolute bottom-1.5", isSelected ? "bg-white" : "bg-apple-orange")} title="Already holds a custom rule" />}
                      </button>
                    )
                  })}
                </div>
             </div>
          </div>

          {/* RIGHT COL: Settings & Overview */}
          <div className="md:w-1/2 flex flex-col bg-apple-bg md:rounded-tl-[18px]">
             {/* Form Area */}
             <div className="p-6 pb-5">
                <h4 className="text-[15px] font-semibold text-apple-ink mb-3 flex items-center justify-between">
                   <span>{t('ruleModal.applyRules')}</span>
                   <span className="text-[13px] font-medium text-apple-blue tabular-nums">
                     {selectedDates.size} {t('ruleModal.daysSelected')}
                   </span>
                </h4>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {formFields.map(f => (
                    <label key={f.key} className="block bg-white rounded-[12px] p-2">
                       <span className="block text-[11px] text-apple-ink-3 mb-1 text-center truncate">{f.label}</span>
                       <input
                         type="number" min="0"
                         value={ruleForm[f.key]}
                         onChange={e => setRuleForm(prev => ({ ...prev, [f.key]: parseInt(e.target.value) || 0 }))}
                         className="w-full bg-transparent text-center text-xl font-semibold tabular-nums text-apple-ink focus:outline-none"
                       />
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer bg-white px-3 py-2.5 rounded-[12px] mb-4">
                  <input
                    type="checkbox"
                    checked={ruleForm.isHoliday}
                    onChange={e => setRuleForm(prev => ({...prev, isHoliday: e.target.checked}))}
                    className="w-4 h-4 rounded accent-apple-blue"
                  />
                  <span className="text-[13px] text-apple-ink">{t('ruleModal.treatHoliday')}</span>
                </label>

                <button
                  onClick={handleApply}
                  disabled={selectedDates.size === 0}
                  className="btn-primary w-full py-2.5 text-[15px]"
                >
                  {t('ruleModal.applyBtn')} {selectedDates.size} {t('ruleModal.days')}
                </button>
             </div>

             {/* Overview Matrix */}
             <div className="flex-1 overflow-y-auto px-6 pb-6">
               <h4 className="section-title mb-2">{t('ruleModal.activeRules')}</h4>

               {overrideEntries.length === 0 ? (
                 <div className="text-center py-8 text-[13px] text-apple-ink-3 bg-white/60 rounded-[12px]">
                   {t('ruleModal.noRules')}
                 </div>
               ) : (
                 <ul className="inset-group">
                   {overrideEntries.map(([dateStr, reqs]) => (
                     <li key={dateStr} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-[15px] text-apple-ink flex items-center gap-2 tabular-nums">
                             {format(parseISO(dateStr), lang === 'zh' ? 'M/d (EEE)' : 'MMM d (EEE)')}
                             {reqs.isHoliday && <span className="text-[11px] font-medium text-apple-red">{t('cal.holiday')}</span>}
                          </p>
                          <p className="text-xs text-apple-ink-3 mt-0.5 tabular-nums">
                            {t('cal.total')} {reqs.total} · {t('cal.snrR')} {reqs.minSeniorR || 0} · {t('cal.anyR')} {reqs.minR} · {t('cal.pgy')} {reqs.minPGY}
                          </p>
                        </div>
                        <button
                          onClick={() => removeDayReqOverride(dateStr)}
                          className="btn-icon hover:text-apple-red"
                          title="Remove custom rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
