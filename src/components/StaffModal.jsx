import React, { useState } from 'react';
import { X, CalendarMinus, CheckCheck } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';

export default function StaffModal({ staff, currentMonthDate, onClose, onSave, isNew }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(staff || {});
  
  if (!staff) return null;

  const monthStart = currentMonthDate ? startOfMonth(currentMonthDate) : new Date();
  const monthEnd = currentMonthDate ? endOfMonth(currentMonthDate) : new Date();
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const toggleOffDay = (dateStr) => {
    setFormData(prev => {
      const isOff = prev.offDays?.includes(dateStr);
      if (isOff) {
        return { ...prev, offDays: prev.offDays.filter(d => d !== dateStr) };
      } else {
        return { ...prev, offDays: [...(prev.offDays || []), dateStr] };
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-lg font-black text-slate-800">
              {isNew ? t('staff.newTitle') : t('staff.editTitle')}
            </h3>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
        </div>
        
        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-white">
           {/* Basic Info */}
           <div className="space-y-4">
             <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1.5">{t('staff.name')}</span>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                />
             </label>

             <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1.5">{t('staff.role')}</span>
                <select 
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
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

             <label className="block mt-4">
                <span className="block text-sm font-bold text-slate-700 mb-1.5">{t('staff.avail')}</span>
                <select 
                  value={formData.availability || 'Full Month'}
                  onChange={e => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                >
                  <option value="Full Month">{t('staff.fullMonth')}</option>
                  <option value="First Half">{t('staff.firstHalf')}</option>
                  <option value="Second Half">{t('staff.secondHalf')}</option>
                </select>
             </label>
           </div>

           {/* Quotas */}
           <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
             <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('staff.quotas')}</h4>
             <div className="grid grid-cols-2 gap-4">
                <label className="block">
                   <span className="block text-xs font-bold text-slate-600 mb-1.5">{t('staff.maxWd')}</span>
                   <input 
                     type="number" 
                     min="0"
                     value={formData.maxWeekdays}
                     onChange={e => setFormData({ ...formData, maxWeekdays: parseInt(e.target.value) || 0 })}
                     className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center font-bold"
                   />
                </label>
                <label className="block">
                   <span className="block text-xs font-bold text-slate-600 mb-1.5">{t('staff.maxWe')}</span>
                   <input 
                     type="number" 
                     min="0"
                     value={formData.maxWeekends}
                     onChange={e => setFormData({ ...formData, maxWeekends: parseInt(e.target.value) || 0 })}
                     className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center font-bold"
                   />
                </label>
             </div>
           </div>

           {/* Off Days */}
           <div className="space-y-3">
             <h4 className="text-sm font-bold text-slate-700 flex items-center justify-between">
               <span className="flex items-center gap-2">
                 <CalendarMinus className="w-4 h-4 text-rose-500" />
                 {t('staff.offDays')}
               </span>
               <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-black border border-rose-100">
                 {formData.offDays.length} {t('sidebar.off')}
               </span>
             </h4>
             <p className="text-xs text-slate-500 font-medium pb-2 border-b border-slate-100">
               {t('staff.clickToToggle')}
             </p>
             <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-black text-slate-400 uppercase py-1">{d}</div>
                  ))}
                  
                  {/* Padding offsets */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}

                  {/* Days Matrix */}
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = formData.offDays.includes(dateStr);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleOffDay(dateStr)}
                        className={cn(
                          "aspect-square rounded-lg flex flex-col items-center justify-center relative border transition-all text-xs font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                          isSelected 
                            ? "bg-rose-500 text-white border-rose-600 shadow-rose-500/30 scale-105 z-10" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50"
                        )}
                      >
                         {format(day, 'd')}
                         {isSelected && <CheckCheck className="w-2.5 h-2.5 text-rose-200 absolute bottom-0.5" />}
                      </button>
                    )
                  })}
                </div>
             </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors border border-transparent hover:border-slate-300"
           >
             {t('staff.cancel')}
           </button>
           <button 
             onClick={handleSave}
             disabled={!formData.name.trim()}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
           >
             {isNew ? t('staff.addStaff') : t('staff.saveChanges')}
           </button>
        </div>
      </div>
    </div>
  );
}
