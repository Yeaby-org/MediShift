import React, { useState } from 'react';
import { X, CalendarMinus } from 'lucide-react';
import { format } from 'date-fns';

export default function StaffModal({ staff, onClose, onSave, isNew }) {
  if (!staff) return null;

  const [formData, setFormData] = useState({ ...staff });
  const [newOffDate, setNewOffDate] = useState('');

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleAddOffDay = () => {
    if (newOffDate && !formData.offDays.includes(newOffDate)) {
      setFormData({
        ...formData,
        offDays: [...formData.offDays, newOffDate]
      });
      setNewOffDate('');
    }
  };

  const removeOffDay = (dateStr) => {
    setFormData({
      ...formData,
      offDays: formData.offDays.filter(d => d !== dateStr)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-lg font-black text-slate-800">
              {isNew ? 'New Staff Member' : 'Edit Staff Profile'}
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
                <span className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</span>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                />
             </label>

             <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1.5">Role / Seniority</span>
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
                <span className="block text-sm font-bold text-slate-700 mb-1.5">Availability Period</span>
                <select 
                  value={formData.availability || 'Full Month'}
                  onChange={e => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                >
                  <option value="Full Month">Full Month</option>
                  <option value="First Half">First Half (Day 1-15)</option>
                  <option value="Second Half">Second Half (Day 16+)</option>
                </select>
             </label>
           </div>

           {/* Quotas */}
           <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
             <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Shift Quotas</h4>
             <div className="grid grid-cols-2 gap-4">
                <label className="block">
                   <span className="block text-xs font-bold text-slate-600 mb-1.5">Max Weekdays</span>
                   <input 
                     type="number" 
                     min="0"
                     value={formData.maxWeekdays}
                     onChange={e => setFormData({ ...formData, maxWeekdays: parseInt(e.target.value) || 0 })}
                     className="w-full bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-center font-bold"
                   />
                </label>
                <label className="block">
                   <span className="block text-xs font-bold text-slate-600 mb-1.5">Max Weekends</span>
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
             <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
               <CalendarMinus className="w-4 h-4 text-rose-500" />
               Pre-scheduled Off Days
             </h4>
             <div className="flex flex-col gap-2">
               {formData.offDays.length === 0 && (
                 <div className="text-sm text-slate-400 font-medium italic px-1">No off days added.</div>
               )}
               {formData.offDays.map(d => (
                 <div key={d} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-sm font-semibold text-slate-700">{format(new Date(d), 'MMM d, yyyy (EEEE)')}</span>
                    <button onClick={() => removeOffDay(d)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                 </div>
               ))}
               <div className="flex items-center gap-2 mt-2">
                 <input 
                   type="date"
                   value={newOffDate}
                   onChange={e => setNewOffDate(e.target.value)}
                   className="flex-1 bg-white border border-slate-300 shadow-sm rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                 />
                 <button 
                   onClick={handleAddOffDay}
                   disabled={!newOffDate}
                   className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg transition-colors shadow-md shadow-slate-900/20"
                 >
                   Add
                 </button>
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
             Cancel
           </button>
           <button 
             onClick={handleSave}
             disabled={!formData.name.trim()}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
           >
             {isNew ? 'Add Staff' : 'Save Changes'}
           </button>
        </div>
      </div>
    </div>
  );
}
