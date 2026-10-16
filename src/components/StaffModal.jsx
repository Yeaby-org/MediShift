import React, { useState } from 'react';
import { X, CalendarMinus, Pin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function StaffModal({ staff, currentMonthDate, onClose, onSave, isNew }) {
  const { t, lang } = useTranslation();
  const [formData, setFormData] = useState(staff ? { fixedDays: [], ...staff } : {});
  const [pickMode, setPickMode] = useState('off'); // 'off' | 'fixed'

  if (!staff) return null;

  const monthStart = currentMonthDate ? startOfMonth(currentMonthDate) : new Date();
  const monthEnd = currentMonthDate ? endOfMonth(currentMonthDate) : new Date();
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  // A date can be either an off day or a pinned shift, never both
  const toggleDay = (dateStr) => {
    const [field, other] = pickMode === 'fixed' ? ['fixedDays', 'offDays'] : ['offDays', 'fixedDays'];
    setFormData(prev => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(dateStr) ? current.filter(d => d !== dateStr) : [...current, dateStr],
        [other]: (prev[other] || []).filter(d => d !== dateStr)
      };
    });
  };

  const weekDays = lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
            <h3 className="text-[22px] font-semibold tracking-tight text-apple-ink">
              {isNew ? t('staff.newTitle') : t('staff.editTitle')}
            </h3>
            <button onClick={onClose} className="btn-icon bg-apple-fill/70">
              <X className="w-4 h-4" />
            </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-6 flex-1">
           {/* Basic Info */}
           <div className="space-y-4">
             <label className="block">
                <span className="block text-[13px] font-medium text-apple-ink-2 mb-1.5">{t('staff.name')}</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
             </label>

             <div className="grid grid-cols-2 gap-3">
               <label className="block">
                  <span className="block text-[13px] font-medium text-apple-ink-2 mb-1.5">{t('staff.role')}</span>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                    className="input"
                  >
                    <optgroup label="Seniors (R)">
                      <option value="R1">R1</option>
                      <option value="R2">R2</option>
                      <option value="R3">R3</option>
                    </optgroup>
                    <optgroup label="Juniors (PGY)">
                      <option value="PGY1">PGY1</option>
                      <option value="PGY2">PGY2</option>
                      <option value="PGY3">PGY3</option>
                    </optgroup>
                  </select>
               </label>

               <label className="block">
                  <span className="block text-[13px] font-medium text-apple-ink-2 mb-1.5">{t('staff.avail')}</span>
                  <select
                    value={formData.availability || 'Full Month'}
                    onChange={e => setFormData({ ...formData, availability: e.target.value })}
                    className="input"
                  >
                    <option value="Full Month">{t('staff.fullMonth')}</option>
                    <option value="First Half">{t('staff.firstHalf')}</option>
                    <option value="Second Half">{t('staff.secondHalf')}</option>
                  </select>
               </label>
             </div>
           </div>

           {/* Quotas */}
           <div className="space-y-1.5">
             <h4 className="text-[13px] font-medium text-apple-ink-2">{t('staff.quotas')}</h4>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'maxWeekdays', label: t('staff.maxWd') },
                  { key: 'maxWeekends', label: t('staff.maxWe') },
                ].map(q => (
                  <label key={q.key} className="flex items-center justify-between bg-apple-bg rounded-[10px] pl-3 pr-1 py-1">
                     <span className="text-[13px] text-apple-ink">{q.label}</span>
                     <input
                       type="number"
                       min="0"
                       value={formData[q.key]}
                       onChange={e => setFormData({ ...formData, [q.key]: parseInt(e.target.value) || 0 })}
                       className="w-14 bg-white rounded-lg px-2 py-1 text-center font-semibold tabular-nums focus:outline-none focus:ring-4 focus:ring-apple-blue/15"
                     />
                  </label>
                ))}
             </div>
           </div>

           {/* Off Days / Pinned Shifts */}
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div className="segmented">
                 {[
                   { mode: 'off', label: t('staff.modeOff'), icon: <CalendarMinus className="w-3.5 h-3.5" />, count: formData.offDays.length },
                   { mode: 'fixed', label: t('staff.modeFixed'), icon: <Pin className="w-3.5 h-3.5" />, count: formData.fixedDays.length },
                 ].map(({ mode, label, icon, count }) => (
                   <button
                     key={mode}
                     type="button"
                     onClick={() => setPickMode(mode)}
                     className={cn("segmented-item", pickMode === mode && "segmented-item-active")}
                   >
                     {icon}
                     {label}
                     {count > 0 && <span className={cn("tabular-nums text-[11px]", mode === 'off' ? "text-apple-red" : "text-apple-blue")}>{count}</span>}
                   </button>
                 ))}
               </div>
             </div>
             <p className="text-xs text-apple-ink-3">
               {pickMode === 'fixed' ? t('staff.clickToToggleFixed') : t('staff.clickToToggle')}
             </p>
             <div className="grid grid-cols-7 gap-1">
               {weekDays.map((d, i) => (
                 <div key={i} className="text-center text-[11px] font-medium text-apple-ink-3 py-1">{d}</div>
               ))}

               {/* Padding offsets */}
               {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                 <div key={`pad-${i}`} />
               ))}

               {/* Days Matrix */}
               {daysInMonth.map(day => {
                 const dateStr = format(day, 'yyyy-MM-dd');
                 const isOff = formData.offDays.includes(dateStr);
                 const isFixed = formData.fixedDays.includes(dateStr);

                 return (
                   <button
                     key={dateStr}
                     onClick={() => toggleDay(dateStr)}
                     className={cn(
                       "aspect-square rounded-full flex items-center justify-center text-[13px] font-medium tabular-nums transition-all duration-150 active:scale-90",
                       isOff
                         ? "bg-apple-red text-white"
                         : isFixed
                           ? "bg-apple-blue text-white"
                           : pickMode === 'fixed'
                             ? "text-apple-ink hover:bg-apple-blue-soft"
                             : "text-apple-ink hover:bg-apple-red/10"
                     )}
                   >
                      {format(day, 'd')}
                   </button>
                 )
               })}
             </div>
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-2 shrink-0 border-t border-apple-fill">
           <button onClick={onClose} className="btn-secondary">
             {t('staff.cancel')}
           </button>
           <button
             onClick={handleSave}
             disabled={!formData.name.trim()}
             className="btn-primary"
           >
             {isNew ? t('staff.addStaff') : t('staff.saveChanges')}
           </button>
        </div>
      </div>
    </div>
  );
}
