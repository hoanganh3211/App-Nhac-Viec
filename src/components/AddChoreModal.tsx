import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Chore, FrequencyType, Member } from '../types';
import { DAYS_OF_WEEK } from '../utils/storage';

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChore: (chore: Omit<Chore, 'id' | 'isCompletedToday'>) => void;
  members: Member[];
}

const PRESETS = [
  { title: 'Rửa bát', icon: '🍽️', points: 2, time: '21:30', freq: 'daily' as FrequencyType },
  { title: 'Đổ rác', icon: '🗑️', points: 1, time: '20:30', freq: 'daily' as FrequencyType },
  { title: 'Cọ nhà vệ sinh', icon: '🚽', points: 4, time: '22:00', freq: 'weekly' as FrequencyType },
  { title: 'Lau sàn', icon: '🧹', points: 3, time: '21:00', freq: 'weekly' as FrequencyType },
];

export const AddChoreModal: React.FC<AddChoreModalProps> = ({ isOpen, onClose, onAddChore, members }) => {
  const todayDayIndex = new Date().getDay();

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🧹');
  const [points, setPoints] = useState(2);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [dueTime, setDueTime] = useState('21:00');

  if (!isOpen) return null;

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setTitle(p.title);
    setIcon(p.icon);
    setPoints(p.points);
    setDueTime(p.time);
    setFrequency(p.freq);
    if (p.freq === 'daily') setDaysOfWeek([1, 2, 3, 4, 5, 6, 0]);
  };

  const toggleDay = (day: number) => {
    if (frequency === 'once') { setDaysOfWeek([day]); return; }
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddChore({
      title: title.trim(),
      icon,
      category: 'cleaning',
      points,
      frequency,
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [todayDayIndex],
      dueTime,
      assignedTo: members[0]?.id || '',
      rotationRule: frequency === 'once' ? 'fixed' : 'least-points',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base">Thêm Công Việc Mới</h3>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-700">
          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button key={p.title} type="button" onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition flex items-center space-x-1 cursor-pointer">
                <span>{p.icon}</span><span>{p.title}</span>
              </button>
            ))}
          </div>

          {/* Title & Icon */}
          <div className="flex space-x-2">
            <div className="w-16">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Icon</label>
              <input type="text" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2}
                className="w-full text-center text-xl p-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên công việc <span className="text-rose-500">*</span></label>
              <input type="text" required placeholder="Ví dụ: Rửa bát, Đổ rác..." value={title} onChange={e => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Làm vào thứ mấy?</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map(d => {
                const sel = daysOfWeek.includes(d.day);
                const isToday = d.day === todayDayIndex;
                return (
                  <button key={d.day} type="button" onClick={() => toggleDay(d.day)}
                    className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                      sel ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-indigo-100/50 border border-slate-200/80'
                    }`}>
                    <span>{d.label}</span>
                    {isToday && <span className={`text-[8px] mt-0.5 ${sel ? 'text-indigo-200' : 'text-indigo-600'}`}>Nay</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Chu kỳ lặp</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 'daily' as FrequencyType, label: 'Hàng ngày' },
                { val: 'weekly' as FrequencyType, label: 'Hàng tuần' },
                { val: 'once' as FrequencyType, label: 'Làm 1 lần' },
              ]).map(f => (
                <button key={f.val} type="button"
                  onClick={() => {
                    setFrequency(f.val);
                    if (f.val === 'daily') setDaysOfWeek([1, 2, 3, 4, 5, 6, 0]);
                    if (f.val === 'once') setDaysOfWeek([todayDayIndex]);
                  }}
                  className={`py-2 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                    frequency === f.val
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Points */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Trọng số điểm</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px]">{points} điểm</span>
            </div>
            <input type="range" min="1" max="5" step="1" value={points} onChange={e => setPoints(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer" />
          </div>

          {/* Due Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Hạn hoàn thành</label>
            <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Submit */}
          <button type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition text-sm cursor-pointer">
            + Thêm Công Việc
          </button>
        </form>
      </div>
    </div>
  );
};
