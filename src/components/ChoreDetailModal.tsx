import React from 'react';
import { 
  X, 
  Clock, 
  Flame, 
  Calendar, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Send, 
  ArrowRightLeft, 
  AlignLeft,
  User,
  Undo2
} from 'lucide-react';
import { Chore, Member } from '../types';
import { formatChoreDays } from '../utils/storage';

interface ChoreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore: Chore | null;
  members: Member[];
  currentUserId: string | null;
  onToggleComplete: (choreId: string) => void;
  onOpenTransfer: (chore: Chore) => void;
  onNudge: (chore: Chore, assignee?: Member) => void;
  onOpenRequestRedo: (chore: Chore) => void;
}

export const ChoreDetailModal: React.FC<ChoreDetailModalProps> = ({
  isOpen,
  onClose,
  chore,
  members,
  currentUserId,
  onToggleComplete,
  onOpenTransfer,
  onNudge,
  onOpenRequestRedo,
}) => {
  if (!isOpen || !chore) return null;

  const assignee = members.find((m) => m.id === chore.assignedTo);
  const isMine = Boolean(currentUserId && chore.assignedTo === currentUserId);

  const isOverdue = (): boolean => {
    if (chore.isCompletedToday) return false;
    const now = new Date();
    const [hours, minutes] = chore.dueTime.split(':').map(Number);
    const due = new Date();
    due.setHours(hours, minutes, 0, 0);
    return now > due;
  };

  const overdue = isOverdue();
  const rewardPoints = chore.nextBonusPoints || chore.points;

  const getCategoryLabel = (category: Chore['category']) => {
    switch (category) {
      case 'cleaning':
        return 'Vệ sinh & Quét dọn';
      case 'kitchen':
        return 'Bếp & Ăn uống';
      case 'trash':
        return 'Rác & Vệ sinh môi trường';
      case 'shopping':
        return 'Mua sắm gia dụng';
      default:
        return 'Việc chung';
    }
  };

  const getFrequencyLabel = (freq: Chore['frequency']) => {
    switch (freq) {
      case 'daily':
        return 'Hàng ngày';
      case 'alternate':
        return 'Cách ngày';
      case 'weekly':
        return `Hàng tuần (${formatChoreDays(chore.daysOfWeek, chore.frequency)})`;
      case 'once':
        return '⚡ 1 lần duy nhất (Việc phát sinh)';
      default:
        return 'Tùy chỉnh';
    }
  };

  const getRotationLabel = (rule: Chore['rotationRule']) => {
    switch (rule) {
      case 'round-robin':
        return 'Xoay vòng đều';
      case 'least-points':
        return 'Ưu tiên ít điểm nhất';
      case 'fixed':
        return 'Cố định người làm';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{chore.icon}</span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">{chore.title}</h3>
              <span className="text-[10px] text-slate-500 font-medium">
                {getCategoryLabel(chore.category)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {/* Status banner */}
          {chore.isCompletedToday ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Đã hoàn thành hôm nay!</div>
                  <div className="text-[11px] text-emerald-700">
                    Lúc {chore.completedAt || 'hôm nay'} (+{rewardPoints} điểm)
                  </div>
                </div>
              </div>
            </div>
          ) : chore.redoRequest ? (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-950 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Yêu cầu làm lại từ {chore.redoRequest.requestedByName}:</span>
              </div>
              <p className="text-[11px] pl-5 italic font-medium">
                "{chore.redoRequest.reason}"
              </p>
              <div className="text-[10px] text-amber-700 pl-5">
                Gửi lúc {chore.redoRequest.requestedAt}. Hãy làm sạch và tick lại nhé!
              </div>
            </div>
          ) : overdue ? (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center space-x-2 text-rose-950">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-bold text-xs">Đã quá giờ quy định ({chore.dueTime})!</div>
                <div className="text-[11px] text-rose-700">
                  Cần hoàn thành ngay để tránh bị trừ điểm trễ hạn.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center space-x-2 text-indigo-950">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="text-[11px]">
                Thời hạn hoàn thành: <strong>{chore.dueTime}</strong> hôm nay.
              </div>
            </div>
          )}

          {/* Description section (Chi tiết công việc) */}
          <div className="space-y-1.5">
            <div className="text-slate-600 font-bold text-xs flex items-center space-x-1">
              <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mô tả & Hướng dẫn chi tiết:</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-slate-700 leading-relaxed text-[11px]">
              {chore.description && chore.description.trim() ? (
                <p className="whitespace-pre-line">{chore.description}</p>
              ) : (
                <p className="text-slate-400 italic">
                  Chưa có hướng dẫn hoặc mô tả chi tiết cho công việc này.
                </p>
              )}
            </div>
          </div>

          {/* Assignee Card */}
          <div className="space-y-1.5">
            <div className="text-slate-600 font-bold text-xs flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Người phụ trách hôm nay:</span>
            </div>
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              isMine 
                ? 'bg-indigo-50/70 border-indigo-200' 
                : 'bg-white border-slate-200/80'
            }`}>
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{assignee?.avatar || '👤'}</span>
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    {assignee?.name || 'Chưa giao'} {isMine && <span className="text-indigo-600 font-bold">(Bạn)</span>}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {assignee?.points || 0} điểm tích lũy • Chuỗi {assignee?.streak || 0} ngày
                  </div>
                </div>
              </div>

              {isMine && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                  Việc của bạn
                </span>
              )}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="text-slate-400 text-[10px] flex items-center space-x-1 mb-0.5">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Điểm hoàn thành</span>
              </div>
              <div className="font-bold text-amber-700">+{rewardPoints} điểm</div>
              {chore.nextBonusPoints && (
                <div className="text-[9px] text-indigo-600 font-medium">Bao gồm +1đ thưởng nhượng</div>
              )}
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="text-slate-400 text-[10px] flex items-center space-x-1 mb-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Tần suất làm</span>
              </div>
              <div className="font-bold text-slate-700">{getFrequencyLabel(chore.frequency)}</div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 col-span-2">
              <div className="text-slate-400 text-[10px] flex items-center space-x-1 mb-0.5">
                <Scale className="w-3 h-3 text-slate-400" />
                <span>Cách phân công xoay vòng</span>
              </div>
              <div className="font-bold text-slate-700">{getRotationLabel(chore.rotationRule)}</div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 space-y-2">
          {chore.isCompletedToday ? (
            <div className="space-y-2">
              {/* Nếu là chính chủ: Cho phép hủy tích để hoàn thành lại */}
              {isMine && (
                <button
                  onClick={() => {
                    onToggleComplete(chore.id);
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-rose-600 border border-rose-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-2xs"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Hủy đánh dấu hoàn thành (Làm lại)</span>
                </button>
              )}

              {/* Nếu là người khác: Cho phép yêu cầu làm lại nếu thấy làm chưa tốt */}
              {!isMine && (
                <button
                  onClick={() => {
                    onOpenRequestRedo(chore);
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-amber-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Yêu cầu làm lại (Làm chưa đạt)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {isMine ? (
                <>
                  <button
                    onClick={() => {
                      onOpenTransfer(chore);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-2xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Nhượng việc</span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleComplete(chore.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition shadow-md shadow-indigo-100"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xong (+{rewardPoints}đ)</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onNudge(chore, assignee);
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-blue-100"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi lời nhắc Zalo cho {assignee?.name}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
