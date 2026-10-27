import React from 'react';
import { CheckCircle2, Circle, Clock, Flame, Send, ArrowRightLeft, Sparkles, Lock, RotateCcw, Undo2, Calendar } from 'lucide-react';
import { Chore, Member } from '../types';
import { formatChoreDays } from '../utils/storage';

interface ChoreCardProps {
  chore: Chore;
  members: Member[];
  currentUserId?: string | null;
  onToggleComplete: (choreId: string) => void;
  onNudge: (chore: Chore, assignee?: Member) => void;
  onOpenTransfer: (chore: Chore) => void;
  onOpenDetail: (chore: Chore) => void;
  onOpenRequestRedo: (chore: Chore) => void;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  members,
  currentUserId,
  onToggleComplete,
  onNudge,
  onOpenTransfer,
  onOpenDetail,
  onOpenRequestRedo,
}) => {
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

  return (
    <div
      onClick={() => onOpenDetail(chore)}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer ${
        chore.isCompletedToday
          ? 'bg-emerald-50/70 border-emerald-200/80 text-slate-700 shadow-2xs hover:border-emerald-300'
          : overdue
          ? 'bg-rose-50/80 border-rose-200 shadow-xs hover:border-rose-300'
          : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-200'
      }`}
    >
      <div className="p-3.5">
        {/* Main row: Icon + Info + Checkmark button (CHỈ HIỆN NÚT TICK CHO CHÍNH CHỦ) */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Task Icon */}
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
              chore.isCompletedToday
                ? 'bg-emerald-100 text-emerald-700'
                : overdue
                ? 'bg-rose-100 text-rose-700'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            {chore.icon}
          </div>

          {/* Middle: Title & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h3
                className={`font-semibold text-sm leading-snug truncate ${
                  chore.isCompletedToday ? 'line-through text-slate-400' : 'text-slate-800'
                }`}
              >
                {chore.title}
              </h3>
            </div>

            {chore.description && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {chore.description}
              </p>
            )}

            {/* Redo request alert badge */}
            {chore.redoRequest && !chore.isCompletedToday && (
              <div className="mt-1 flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-950 text-[10px] font-semibold border border-amber-200">
                <RotateCcw className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                <span className="truncate">Cần làm lại: "{chore.redoRequest.reason}" ({chore.redoRequest.requestedByName})</span>
              </div>
            )}

            {/* Badges: Time, Points, Bonus */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap ${
                  chore.isCompletedToday
                    ? 'bg-emerald-100 text-emerald-800'
                    : overdue
                    ? 'bg-rose-100 text-rose-800 font-bold animate-pulse'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {chore.isCompletedToday
                    ? `Xong ${chore.completedAt || ''}`
                    : overdue
                    ? `Trễ hạn (${chore.dueTime})`
                    : chore.dueTime}
                </span>
              </span>

              <span className="inline-flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0 whitespace-nowrap">
                <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                <span>+{rewardPoints}đ</span>
              </span>

              {chore.frequency === 'once' ? (
                <span className="inline-flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 whitespace-nowrap">
                  <span>⚡ 1 lần</span>
                </span>
              ) : chore.daysOfWeek && chore.daysOfWeek.length > 0 && chore.daysOfWeek.length < 7 && (
                <span className="inline-flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap">
                  <Calendar className="w-2.5 h-2.5 text-slate-400" />
                  <span>{formatChoreDays(chore.daysOfWeek, chore.frequency)}</span>
                </span>
              )}

              {chore.nextBonusPoints && !chore.isCompletedToday && (
                <span className="inline-flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0 whitespace-nowrap">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Thưởng hoàn trả (+1đ)</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Checkbox completion area */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {chore.isCompletedToday ? (
              // Nếu đã xong:
              // - Nếu là chính chủ: có thể bấm bỏ tick để làm lại
              // - Nếu là người khác: chỉ hiển thị icon tĩnh, KHÔNG bấm được
              isMine ? (
                <button
                  onClick={() => onToggleComplete(chore.id)}
                  className="p-1.5 rounded-2xl text-emerald-600 hover:text-rose-600 transition transform active:scale-95"
                  title="Bấm để hủy tích & làm lại"
                >
                  <CheckCircle2 className="w-7 h-7 fill-emerald-500 text-white" />
                </button>
              ) : (
                <div className="p-1.5 text-emerald-600" title="Đã hoàn thành">
                  <CheckCircle2 className="w-7 h-7 fill-emerald-500 text-white" />
                </div>
              )
            ) : isMine ? (
              // CHỈ HIỆN NÚT TICK KHI LÀ VIỆC CỦA CHÍNH MÌNH
              <button
                onClick={() => onToggleComplete(chore.id)}
                className="p-1.5 rounded-2xl text-slate-300 hover:text-indigo-600 transition transform active:scale-95"
                title="Bấm để xác nhận hoàn thành việc của bạn"
              >
                <Circle className="w-7 h-7 text-slate-300 stroke-[1.8]" />
              </button>
            ) : (
              // NẾU LÀ VIỆC CỦA NGƯỜI KHÁC: ẨN NÚT TICK HOÀN TOÀN
              <div 
                className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-slate-100 text-[10px] text-slate-400 font-medium"
                title={`Chỉ ${assignee?.name || 'người được giao'} mới có quyền tick`}
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Chờ làm</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer: Assignee & Action Buttons */}
        <div className="mt-2.5 pt-2 border-t border-slate-100/90 flex items-center justify-between text-xs">
          {/* Assignee pill */}
          <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-2">
            <span className="text-[11px] text-slate-400 shrink-0">Làm:</span>
            {assignee ? (
              <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-xl truncate ${
                isMine ? 'bg-indigo-100 text-indigo-900 font-bold border border-indigo-200/80' : 'bg-slate-100 text-slate-800'
              }`}>
                <span className="text-xs shrink-0">{assignee.avatar}</span>
                <span className="text-[11px] truncate">
                  {assignee.name} {isMine && '(Bạn)'}
                </span>
                {assignee.streak > 1 && (
                  <span className="text-[9px] text-amber-600 font-bold shrink-0">
                    🔥{assignee.streak}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Chưa giao</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Khi ĐÃ hoàn thành: */}
            {chore.isCompletedToday && (
              <>
                {/* Chính chủ: Nút hủy tích để làm lại */}
                {isMine && (
                  <button
                    onClick={() => onToggleComplete(chore.id)}
                    title="Hủy đánh dấu hoàn thành để làm lại"
                    className="inline-flex items-center space-x-1 px-2 py-0.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg text-[10px] font-semibold transition"
                  >
                    <Undo2 className="w-2.5 h-2.5 text-rose-500" />
                    <span>Hủy tích</span>
                  </button>
                )}

                {/* Người khác: Nút yêu cầu làm lại nếu thấy làm ẩu / chưa sạch */}
                {!isMine && (
                  <button
                    onClick={() => onOpenRequestRedo(chore)}
                    title="Yêu cầu làm lại nếu việc làm chưa sạch / chưa đạt"
                    className="inline-flex items-center space-x-1 px-2 py-0.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-semibold transition"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-amber-600" />
                    <span>Làm lại?</span>
                  </button>
                )}
              </>
            )}

            {/* Khi CHƯA hoàn thành: */}
            {!chore.isCompletedToday && (
              <>
                {/* Nhượng việc button (Chỉ chính chủ mới được nhượng) */}
                {isMine && (
                  <button
                    onClick={() => onOpenTransfer(chore)}
                    title="Nhượng lại việc cho người khác (-điểm việc)"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold transition border border-amber-200/60 shadow-2xs"
                  >
                    <ArrowRightLeft className="w-2.5 h-2.5" />
                    <span>Nhượng việc</span>
                  </button>
                )}

                {/* Nhắc Zalo (Chỉ người khác mới cần nhắc người được giao) */}
                {!isMine && (
                  <button
                    onClick={() => onNudge(chore, assignee)}
                    title="Nhắc người này qua Zalo"
                    className="inline-flex items-center space-x-1 px-2 py-0.5 text-blue-600 hover:bg-blue-50 rounded-lg text-[11px] font-semibold transition"
                  >
                    <Send className="w-2.5 h-2.5" />
                    <span className="whitespace-nowrap">Nhắc Zalo</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
