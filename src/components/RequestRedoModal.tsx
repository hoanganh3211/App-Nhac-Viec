import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, MessageSquare, Check } from 'lucide-react';
import { Chore, Member } from '../types';

interface RequestRedoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore: Chore | null;
  currentMember: Member | null;
  members: Member[];
  onConfirmRedo: (choreId: string, reason: string) => void;
}

const PRESET_REASONS = [
  'Chưa lau sạch sàn / mặt đá bếp',
  'Chưa đổ hết rác / chưa thay túi rác mới',
  'Chưa cọ bồn cầu / sàn nhà vệ sinh sạch',
  'Rửa bát đĩa còn bẩn / chưa lau khô',
  'Chưa cất dọn đồ đạc vào đúng vị trí',
  'Quên chưa làm xong hẳn',
];

export const RequestRedoModal: React.FC<RequestRedoModalProps> = ({
  isOpen,
  onClose,
  chore,
  currentMember,
  members,
  onConfirmRedo,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen || !chore) return null;

  const assignee = members.find((m) => m.id === chore.assignedTo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() || selectedPreset;
    onConfirmRedo(chore.id, finalReason);
    setCustomReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Yêu Cầu Làm Lại Công Việc</h3>
              <p className="text-[10px] text-amber-100">
                Gửi bởi: {currentMember?.name || 'Bạn'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* Target Chore Info */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center space-x-3">
            <span className="text-2xl">{chore.icon}</span>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-800 text-xs truncate">{chore.title}</h4>
              <p className="text-[11px] text-slate-500">
                Người làm: <strong>{assignee?.name || 'Thành viên'}</strong> {assignee?.avatar}
              </p>
            </div>
          </div>

          {/* Warning banner */}
          <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start space-x-2 text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Công việc sẽ được chuyển về trạng thái <strong>Chưa xong</strong> và tạm thu hồi lại <strong>{chore.points} điểm</strong> đã nhận cho đến khi {assignee?.name} làm lại đạt yêu cầu!
            </p>
          </div>

          {/* Preset Reasons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Chọn lý do chưa đạt:
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((reason) => {
                const isSelected = selectedPreset === reason && !customReason.trim();
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(reason);
                      setCustomReason('');
                    }}
                    className={`w-full p-2.5 text-left rounded-xl border text-[11px] flex items-center justify-between transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 font-semibold text-amber-950 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Note Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              <span>Hoặc ghi chú chi tiết cụ thể:</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Dưới bồn rửa vẫn còn rác đọng..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-200 flex items-center justify-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Gửi Yêu Cầu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
