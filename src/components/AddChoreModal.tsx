import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Clock, Scale, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Chore, FrequencyType, Member, RotationRule } from '../types';
import { DAYS_OF_WEEK } from '../utils/storage';

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChore: (chore: Omit<Chore, 'id' | 'isCompletedToday'>) => void;
  members: Member[];
}

const PRESETS = [
  { title: 'Rửa bát tối & Lau bếp', icon: '🍽️', points: 2, category: 'kitchen', time: '21:30', freq: 'daily' as FrequencyType },
  { title: 'Đổ rác & Thay túi rác', icon: '🗑️', points: 1, category: 'trash', time: '20:30', freq: 'daily' as FrequencyType },
  { title: 'Cọ nhà vệ sinh & Bồn cầu', icon: '🚽', points: 4, category: 'cleaning', time: '22:00', freq: 'weekly' as FrequencyType },
  { title: 'Lau sàn & Quét phòng', icon: '🧹', points: 3, category: 'cleaning', time: '21:00', freq: 'alternate' as FrequencyType },
  { title: 'Nấu bữa tối chung', icon: '🍳', points: 3, category: 'kitchen', time: '19:00', freq: 'daily' as FrequencyType },
  { title: 'Đi chợ mua đồ chung', icon: '🛒', points: 2, category: 'shopping', time: '18:00', freq: 'weekly' as FrequencyType },
  { title: 'Sửa bóng đèn / vòi nước', icon: '💡', points: 2, category: 'other', time: '19:00', freq: 'once' as FrequencyType },
  { title: 'Dọn phòng đón bạn / tiệc', icon: '🎉', points: 4, category: 'cleaning', time: '17:00', freq: 'once' as FrequencyType },
];

export const AddChoreModal: React.FC<AddChoreModalProps> = ({
  isOpen,
  onClose,
  onAddChore,
  members,
}) => {
  const todayDayIndex = new Date().getDay(); // 0 = CN, 1 = T2, ..., 6 = T7

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🧹');
  const [category, setCategory] = useState<'cleaning' | 'kitchen' | 'trash' | 'shopping' | 'other'>('cleaning');
  const [points, setPoints] = useState(2);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [dueTime, setDueTime] = useState('21:00');
  const [assignedTo, setAssignedTo] = useState('');
  const [rotationRule, setRotationRule] = useState<RotationRule>('least-points');
  const [description, setDescription] = useState('');

  // Tự động gợi ý giao việc cho người đang ít điểm nhất để đảm bảo công bằng từ đầu
  useEffect(() => {
    if (members.length > 0) {
      const sortedByPoints = [...members].sort((a, b) => a.points - b.points);
      setAssignedTo(sortedByPoints[0]?.id || members[0]?.id);
    }
  }, [members, isOpen]);

  // Nếu chọn "Làm 1 lần duy nhất", cố định người làm và mặc định ngày hôm nay nếu chưa chọn
  useEffect(() => {
    if (frequency === 'once') {
      setRotationRule('fixed');
      if (daysOfWeek.length === 0 || daysOfWeek.length === 7) {
        setDaysOfWeek([todayDayIndex]);
      }
    }
  }, [frequency]);

  if (!isOpen) return null;

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setTitle(p.title);
    setIcon(p.icon);
    setPoints(p.points);
    setCategory(p.category as any);
    setDueTime(p.time);
    setFrequency(p.freq);
    if (p.freq === 'once') {
      setDaysOfWeek([todayDayIndex]);
      setRotationRule('fixed');
    }
  };

  const toggleDay = (day: number) => {
    if (frequency === 'once') {
      // Việc 1 lần chỉ chọn 1 thứ cụ thể
      setDaysOfWeek([day]);
      return;
    }

    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        const next = daysOfWeek.filter((d) => d !== day);
        setDaysOfWeek(next);
        if (next.length < 7 && frequency === 'daily') {
          setFrequency('weekly');
        }
      }
    } else {
      const next = [...daysOfWeek, day].sort();
      setDaysOfWeek(next);
      if (next.length === 7) {
        setFrequency('daily');
      }
    }
  };

  const handleQuickSelectDays = (type: 'all' | 'weekdays' | 'weekend' | 'today') => {
    if (type === 'all') {
      setDaysOfWeek([1, 2, 3, 4, 5, 6, 0]);
      if (frequency !== 'once') setFrequency('daily');
    } else if (type === 'weekdays') {
      setDaysOfWeek([1, 2, 3, 4, 5]);
      if (frequency !== 'once') setFrequency('weekly');
    } else if (type === 'weekend') {
      setDaysOfWeek([6, 0]);
      if (frequency !== 'once') setFrequency('weekly');
    } else if (type === 'today') {
      setDaysOfWeek([todayDayIndex]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignedTo) return;

    onAddChore({
      title: title.trim(),
      icon,
      category,
      points,
      frequency,
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [todayDayIndex],
      dueTime,
      assignedTo,
      rotationRule: frequency === 'once' ? 'fixed' : rotationRule,
      description: description.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Thêm Công Việc Mới</h3>
              <p className="text-[10px] text-slate-400">Thiết lập thứ làm việc & chu kỳ lặp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-700">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gợi ý việc phổ biến (Bấm để chọn nhanh):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>{p.icon}</span>
                  <span>{p.title}</span>
                  {p.freq === 'once' && (
                    <span className="text-[9px] px-1 py-0.2 bg-amber-200 text-amber-900 rounded-md font-bold">1 lần</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Icon */}
          <div className="flex space-x-2">
            <div className="w-16">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Icon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full text-center text-xl p-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên công việc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Rửa bát, Đổ rác, Sửa bóng đèn..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 1. LÀM VIỆC VÀO THỨ MẤY (BẮT BUỘC CHỌN TRƯỚC) */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Làm việc vào thứ mấy?</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">
                {frequency === 'once' 
                  ? `(Làm 1 lần: ${DAYS_OF_WEEK.find(d => d.day === daysOfWeek[0])?.full || 'Hôm nay'})` 
                  : frequency === 'daily'
                  ? '(Hàng ngày: Cả 7 ngày T2-CN)'
                  : `(Hàng tuần: ${daysOfWeek.map(d => DAYS_OF_WEEK.find(x => x.day === d)?.label).join(', ')})`}
              </span>
            </div>

            {/* Day Pills: T2, T3, T4, T5, T6, T7, CN */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = daysOfWeek.includes(d.day);
                const isToday = d.day === todayDayIndex;
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => toggleDay(d.day)}
                    className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-indigo-100/50 border border-slate-200/80'
                    }`}
                  >
                    <span>{d.label}</span>
                    {isToday && (
                      <span className={`text-[8px] font-normal leading-none mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-indigo-600 font-semibold'}`}>
                        Nay
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick selectors */}
            <div className="flex flex-wrap gap-1 pt-1">
              <button
                type="button"
                onClick={() => handleQuickSelectDays('today')}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
              >
                Hôm nay
              </button>
              {frequency !== 'once' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('all')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    Cả tuần (T2-CN)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('weekdays')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                  >
                    T2 - T6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('weekend')}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cuối tuần (T7, CN)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 2. CHU KỲ LẶP (ĐIỀU CHỈNH SAU KHI CHỌN THỨ) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              Chu kỳ lặp lại công việc
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFrequency('daily');
                  setDaysOfWeek([1, 2, 3, 4, 5, 6, 0]);
                }}
                className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                  frequency === 'daily'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">Hàng ngày</div>
                <div className="text-[10px] text-slate-500">Tự động chọn cả 7 ngày (T2 ➔ CN)</div>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                  frequency === 'weekly'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">Hàng tuần</div>
                <div className="text-[10px] text-slate-500">Lặp vào các thứ đã chọn</div>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('alternate')}
                className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                  frequency === 'alternate'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">Cách ngày</div>
                <div className="text-[10px] text-slate-500">2 ngày làm 1 lần</div>
              </button>

              {/* OPTION VIỆC PHÁT SINH 1 LẦN DUY NHẤT */}
              <button
                type="button"
                onClick={() => {
                  setFrequency('once');
                  setRotationRule('fixed');
                  if (daysOfWeek.length !== 1) {
                    setDaysOfWeek([todayDayIndex]);
                  }
                }}
                className={`p-2.5 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
                  frequency === 'once'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50/50'
                }`}
              >
                <div className="flex items-center space-x-1 text-xs font-bold text-amber-800">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Làm 1 lần</span>
                </div>
                <div className="text-[10px] text-amber-900/70">Chỉ làm đúng 1 ngày hẹn</div>
              </button>
            </div>

            {/* Helper alert for 1-time chore */}
            {frequency === 'once' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-amber-900 text-[11px] animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Việc chung làm 1 lần ({DAYS_OF_WEEK.find(d => d.day === daysOfWeek[0])?.full || 'Hôm nay'}):</strong> Việc chỉ xuất hiện trên danh sách đúng vào ngày này (không hiện sớm trước hạn). Sau khi làm xong sẽ tự động đóng và không lặp lại.
                </div>
              </div>
            )}
          </div>

          {/* Points / Trọng số việc */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
              <span className="flex items-center space-x-1">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                <span>Trọng số điểm công việc:</span>
              </span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold">
                {points} điểm ({points === 1 ? 'Việc nhẹ' : points <= 3 ? 'Việc vừa' : 'Việc nặng'})
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-amber-700/80 px-1">
              <span>1đ (Đổ rác)</span>
              <span>2đ (Rửa bát)</span>
              <span>3đ (Lau nhà)</span>
              <span>4-5đ (Cọ WC, dọn tiệc)</span>
            </div>
          </div>

          {/* Time & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Hạn hoàn thành</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {frequency === 'once' ? 'Người làm việc này' : 'Người làm ban đầu'}
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar} {m.name} ({m.points}đ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rotation Rule (Chỉ hiện khi lặp lại, nếu làm 1 lần thì tự động cố định) */}
          {frequency !== 'once' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Thuật toán xoay việc
              </label>
              <select
                value={rotationRule}
                onChange={(e) => setRotationRule(e.target.value as RotationRule)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="least-points">Ưu tiên người ít điểm nhất (Công bằng nhất)</option>
                <option value="round-robin">Xoay vòng tuần tự (A-B-C)</option>
                <option value="fixed">Cố định người này</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú cụ thể</label>
            <input
              type="text"
              placeholder="Ví dụ: Rửa xong úp khô, mua bóng đèn loại E27..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2 space-y-1.5">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition text-sm cursor-pointer"
            >
              {members.length > 1 
                ? (frequency === 'once' ? '+ Gửi Đề Xuất Việc Phát Sinh (1 lần)' : '+ Gửi Đề Xuất Thêm Việc')
                : (frequency === 'once' ? 'Lưu Việc Phát Sinh 1 Lần' : 'Lưu & Phân Công Việc')}
            </button>
            {members.length > 1 && (
              <p className="text-[10px] text-slate-400 text-center italic">
                *Thêm việc mới sẽ được gửi cho phòng biểu quyết (cần &gt;50% đồng ý).
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
