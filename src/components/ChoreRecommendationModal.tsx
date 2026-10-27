import React, { useState } from 'react';
import { Sparkles, Check, Clock, Scale } from 'lucide-react';
import { Chore } from '../types';

interface ChoreRecommendationModalProps {
  isOpen: boolean;
  roomName: string;
  onApplyChores: (selectedChores: Omit<Chore, 'id' | 'isCompletedToday' | 'assignedTo'>[]) => void;
  onSkip: () => void;
}

interface RecommendedChoreItem {
  key: string;
  selected: boolean;
  title: string;
  icon: string;
  category: 'cleaning' | 'kitchen' | 'trash' | 'shopping' | 'other';
  points: number;
  dueTime: string;
  description: string;
}

const DEFAULT_RECOMMENDATIONS: RecommendedChoreItem[] = [
  {
    key: 'rec_1',
    selected: true,
    title: 'Đổ rác & Thay túi rác',
    icon: '🗑️',
    category: 'trash',
    points: 1,
    dueTime: '20:30',
    description: 'Gom rác phòng khách, bếp và mang xuống thùng rác chung',
  },
  {
    key: 'rec_2',
    selected: true,
    title: 'Rửa bát tối & Lau bếp',
    icon: '🍽️',
    category: 'kitchen',
    points: 2,
    dueTime: '21:30',
    description: 'Rửa sạch bát đĩa sau bữa tối, úp khô và lau khô mặt đá bếp',
  },
  {
    key: 'rec_3',
    selected: true,
    title: 'Quét nhà & Hút bụi phòng',
    icon: '🧹',
    category: 'cleaning',
    points: 3,
    dueTime: '21:00',
    description: 'Lau sàn nhà sạch sẽ bằng nước lau sàn thơm',
  },
  {
    key: 'rec_4',
    selected: true,
    title: 'Cọ sàn & Bồn cầu nhà vệ sinh',
    icon: '🚽',
    category: 'cleaning',
    points: 4,
    dueTime: '22:00',
    description: 'Xịt nước tẩy, cọ sạch bồn cầu, lavabo và gạt khô sàn',
  },
  {
    key: 'rec_5',
    selected: false,
    title: 'Nấu bữa tối chung',
    icon: '🍳',
    category: 'kitchen',
    points: 3,
    dueTime: '19:00',
    description: 'Nấu cơm bữa tối cho cả phòng',
  },
  {
    key: 'rec_6',
    selected: false,
    title: 'Mua đồ gia dụng chung (Giấy, gia vị)',
    icon: '🛒',
    category: 'shopping',
    points: 2,
    dueTime: '18:00',
    description: 'Kiểm tra đồ dùng chung trong phòng để mua bù',
  },
];

export const ChoreRecommendationModal: React.FC<ChoreRecommendationModalProps> = ({
  isOpen,
  roomName,
  onApplyChores,
  onSkip,
}) => {
  const [items, setItems] = useState<RecommendedChoreItem[]>(DEFAULT_RECOMMENDATIONS);

  if (!isOpen) return null;

  const toggleSelect = (key: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItemPoints = (key: string, points: number) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, points } : item))
    );
  };

  const updateItemTime = (key: string, dueTime: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, dueTime } : item))
    );
  };

  const selectedCount = items.filter((i) => i.selected).length;

  const handleApply = () => {
    const selectedChores = items
      .filter((i) => i.selected)
      .map((i) => ({
        title: i.title,
        icon: i.icon,
        category: i.category,
        points: i.points,
        frequency: 'daily' as const,
        dueTime: i.dueTime,
        rotationRule: 'least-points' as const,
        description: i.description,
      }));

    onApplyChores(selectedChores);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Gợi Ý Việc Nhà Cho Phòng Mới</h3>
              <p className="text-[11px] text-indigo-100">
                Phòng: <strong>{roomName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Intro */}
        <div className="p-4 bg-indigo-50/70 border-b border-indigo-100/80 text-xs text-indigo-950 flex items-start space-x-2">
          <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Chọn các công việc thường nhật của phòng bạn. Bạn có thể sửa trực tiếp số điểm và giờ làm. Nếu không cần, bấm <strong>Bỏ qua</strong> để bắt đầu với danh sách trống.
          </p>
        </div>

        {/* Chores List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
          {items.map((item) => (
            <div
              key={item.key}
              className={`p-3 rounded-2xl border transition-all ${
                item.selected
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-2xs'
                  : 'border-slate-200/80 bg-white opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Checkbox & Info */}
                <div 
                  onClick={() => toggleSelect(item.key)}
                  className="flex items-start space-x-2.5 flex-1 min-w-0 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition ${
                      item.selected
                        ? 'bg-indigo-600 text-white'
                        : 'border-2 border-slate-300 bg-white'
                    }`}
                  >
                    {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base shrink-0">{item.icon}</span>
                      <h4 className="font-bold text-xs text-slate-900 truncate">{item.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                  </div>
                </div>

                {/* Inline Points & Due Time editing */}
                {item.selected && (
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Points select */}
                    <select
                      value={item.points}
                      onChange={(e) => updateItemPoints(item.key, Number(e.target.value))}
                      className="p-1 bg-white border border-amber-200 text-amber-900 rounded-lg text-[10px] font-bold focus:outline-none"
                    >
                      <option value={1}>1đ (Nhẹ)</option>
                      <option value={2}>2đ (Vừa)</option>
                      <option value={3}>3đ (Nặng)</option>
                      <option value={4}>4đ (Rất nặng)</option>
                      <option value={5}>5đ (Đặc biệt)</option>
                    </select>

                    {/* Time select */}
                    <div className="flex items-center space-x-0.5 bg-white border border-slate-200 px-1.5 py-1 rounded-lg">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <input
                        type="time"
                        value={item.dueTime}
                        onChange={(e) => updateItemTime(item.key, e.target.value)}
                        className="text-[10px] text-slate-700 font-semibold focus:outline-none bg-transparent w-12"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center space-x-2.5">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-600 font-semibold rounded-xl border border-slate-200 text-xs transition text-center"
          >
            Bỏ qua (Để trống)
          </button>

          <button
            onClick={handleApply}
            disabled={selectedCount === 0}
            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-100 text-xs transition text-center"
          >
            Thêm {selectedCount} việc đã chọn
          </button>
        </div>
      </div>
    </div>
  );
};
