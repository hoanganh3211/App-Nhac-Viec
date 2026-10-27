import React from 'react';
import { CheckCircle2, Circle, Clock, Flame, Send, ArrowRightLeft, Sparkles } from 'lucide-react';
import { Chore, Member } from '../types';

interface ChoreCardProps {
  chore: Chore;
  members: Member[];
  currentUserId?: string | null;
  onToggleComplete: (choreId: string) => void;
  onNudge: (chore: Chore, assignee?: Member) => void;
  onOpenTransfer: (chore: Chore) => void;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  members,
  currentUserId,
  onToggleComplete,
  onNudge,
  onOpenTransfer,
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
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        chore.isCompletedToday
          ? 'bg-emerald-50/70 border-emerald-200/80 text-slate-700 shadow-2xs'
          : overdue
          ? 'bg-rose-50/80 border-rose-200 shadow-xs'
          : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div className="p-3.5">
        {/* Main row: Icon + Info + Checkmark button */}
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

              {chore.nextBonusPoints && !chore.isCompletedToday && (
                <span className="inline-flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0 whitespace-nowrap">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Thưởng hoàn trả (+1đ)</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Big Checkbox Toggle Button */}
          <button
            onClick={() => onToggleComplete(chore.id)}
            className={`shrink-0 p-1.5 rounded-2xl transition-all transform active:scale-95 ${
              chore.isCompletedToday
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-slate-300 hover:text-indigo-600'
            }`}
            title={chore.isCompletedToday ? 'Đánh dấu chưa xong' : 'Bấm để hoàn thành!'}
          >
            {chore.isCompletedToday ? (
              <CheckCircle2 className="w-7 h-7 fill-emerald-500 text-white" />
            ) : (
              <Circle className="w-7 h-7 text-slate-300 stroke-[1.8]" />
            )}
          </button>
        </div>

        {/* Card Footer: Assignee & Action Buttons */}
        <div className="mt-2.5 pt-2 border-t border-slate-100/90 flex items-center justify-between text-xs">
          {/* Assignee pill */}
          <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-2">
            <span className="text-[11px] text-slate-400 shrink-0">Làm:</span>
            {assignee ? (
              <div className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded-xl truncate">
                <span className="text-xs shrink-0">{assignee.avatar}</span>
                <span className="font-semibold text-slate-800 text-[11px] truncate">
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

          {/* Action buttons (CHỈ CÒN Nhượng việc hoặc Nhắc Zalo - ĐÃ XÓA nút reload theo yêu cầu) */}
          <div className="flex items-center space-x-1 shrink-0">
            {/* Nhượng việc button (Chỉ người được giao mới có quyền nhượng và phải tốn điểm) */}
            {isMine && !chore.isCompletedToday && (
              <button
                onClick={() => onOpenTransfer(chore)}
                title="Nhượng lại việc cho người khác (-điểm việc)"
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold transition border border-amber-200/60 shadow-2xs"
              >
                <ArrowRightLeft className="w-2.5 h-2.5" />
                <span>Nhượng việc</span>
              </button>
            )}

            {!chore.isCompletedToday && !isMine && (
              <button
                onClick={() => onNudge(chore, assignee)}
                title="Nhắc người này qua Zalo"
                className="inline-flex items-center space-x-1 px-2 py-0.5 text-blue-600 hover:bg-blue-50 rounded-lg text-[11px] font-semibold transition"
              >
                <Send className="w-2.5 h-2.5" />
                <span className="whitespace-nowrap">Nhắc Zalo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
