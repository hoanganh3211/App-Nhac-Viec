import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Clock, Scale } from 'lucide-react';
import { Chore, FrequencyType, Member, RotationRule } from '../types';

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChore: (chore: Omit<Chore, 'id' | 'isCompletedToday'>) => void;
  members: Member[];
}

const PRESETS = [
  { title: 'Rửa bát tối & Lau bếp', icon: '🍽️', points: 2, category: 'kitchen', time: '21:30' },
  { title: 'Đổ rác & Thay túi rác', icon: '🗑️', points: 1, category: 'trash', time: '20:30' },
  { title: 'Cọ nhà vệ sinh & Bồn cầu', icon: '🚽', points: 4, category: 'cleaning', time: '22:00' },
  { title: 'Lau sàn & Quét phòng', icon: '🧹', points: 3, category: 'cleaning', time: '21:00' },
  { title: 'Nấu bữa tối chung', icon: '🍳', points: 3, category: 'kitchen', time: '19:00' },
  { title: 'Đi chợ mua đồ chung', icon: '🛒', points: 2, category: 'shopping', time: '18:00' },
  { title: 'Phơi đồ & Thu đồ', icon: '👕', points: 2, category: 'other', time: '20:00' },
];

export const AddChoreModal: React.FC<AddChoreModalProps> = ({
  isOpen,
  onClose,
  onAddChore,
  members,
}) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🧹');
  const [category, setCategory] = useState<'cleaning' | 'kitchen' | 'trash' | 'shopping' | 'other'>('cleaning');
  const [points, setPoints] = useState(2);
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

  if (!isOpen) return null;

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setTitle(p.title);
    setIcon(p.icon);
    setPoints(p.points);
    setCategory(p.category as any);
    setDueTime(p.time);
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
      dueTime,
      assignedTo,
      rotationRule,
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
            <h3 className="font-bold text-slate-800 text-base">Thêm Công Việc Mới</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
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
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition flex items-center space-x-1"
                >
                  <span>{p.icon}</span>
                  <span>{p.title}</span>
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
                className="w-full text-center text-xl p-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                placeholder="Ví dụ: Rửa bát, Đổ rác..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
              <span>4-5đ (Cọ WC)</span>
            </div>
          </div>

          {/* Time & Frequency */}
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
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Chu kỳ lặp</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="daily">Hàng ngày</option>
                <option value="alternate">Cách ngày (2 ngày/lần)</option>
                <option value="weekly">Hàng tuần</option>
                <option value="custom">Tùy biến</option>
              </select>
            </div>
          </div>

          {/* Assignee & Rotation Rule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Người làm ban đầu
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar} {m.name} ({m.points}đ)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Thuật toán xoay việc
              </label>
              <select
                value={rotationRule}
                onChange={(e) => setRotationRule(e.target.value as RotationRule)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="least-points">Ưu tiên người ít điểm nhất (Công bằng)</option>
                <option value="round-robin">Xoay vòng tuần tự (A-B-C)</option>
                <option value="fixed">Cố định người này</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú cụ thể</label>
            <input
              type="text"
              placeholder="Ví dụ: Rửa xong úp khô, nhớ lau mặt bếp..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2 space-y-1.5">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition text-sm"
            >
              {members.length > 1 ? '+ Gửi Đề Xuất Thêm Việc' : 'Lưu & Phân Công Việc'}
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
