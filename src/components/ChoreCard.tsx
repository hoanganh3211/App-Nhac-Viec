import React from 'react';
import { CheckCircle2, Circle, Clock, Flame, Send, RotateCw } from 'lucide-react';
import { Chore, Member } from '../types';

interface ChoreCardProps {
  chore: Chore;
  members: Member[];
  onToggleComplete: (choreId: string) => void;
  onNudge: (chore: Chore, assignee?: Member) => void;
  onRotateNext: (choreId: string) => void;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  members,
  onToggleComplete,
  onNudge,
  onRotateNext,
}) => {
  const assignee = members.find((m) => m.id === chore.assignedTo);

  // Check if task is overdue
  const isOverdue = (): boolean => {
    if (chore.isCompletedToday) return false;
    const now = new Date();
    const [hours, minutes] = chore.dueTime.split(':').map(Number);
    const due = new Date();
    due.setHours(hours, minutes, 0, 0);
    return now > due;
  };

  const overdue = isOverdue();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        chore.isCompletedToday
          ? 'bg-emerald-50/70 border-emerald-200 text-slate-700 shadow-xs'
          : overdue
          ? 'bg-rose-50/80 border-rose-200 shadow-sm'
          : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="p-4">
        {/* Top Header inside Card */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Task Icon / Emoji */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                chore.isCompletedToday
                  ? 'bg-emerald-100 text-emerald-700'
                  : overdue
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {chore.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h3
                  className={`font-semibold text-base leading-snug truncate ${
                    chore.isCompletedToday ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {chore.title}
                </h3>
              </div>

              {chore.description && (
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {chore.description}
                </p>
              )}

              {/* Badges: Time & Points */}
              <div className="flex items-center space-x-2 mt-2">
                <span
                  className={`inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    chore.isCompletedToday
                      ? 'bg-emerald-100 text-emerald-800'
                      : overdue
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {chore.isCompletedToday
                      ? `Xong lúc ${chore.completedAt || 'hôm nay'}`
                      : overdue
                      ? `Trễ hạn (${chore.dueTime})`
                      : `Hạn: ${chore.dueTime}`}
                  </span>
                </span>

                <span className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>+{chore.points} điểm</span>
                </span>
              </div>
            </div>
          </div>

          {/* Complete Toggle Button */}
          <button
            onClick={() => onToggleComplete(chore.id)}
            className={`shrink-0 p-2 rounded-2xl transition-all transform active:scale-95 ${
              chore.isCompletedToday
                ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100'
                : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            title={chore.isCompletedToday ? 'Bấm để đánh dấu chưa xong' : 'Bấm để hoàn thành!'}
          >
            {chore.isCompletedToday ? (
              <CheckCircle2 className="w-8 h-8 fill-emerald-500 text-white" />
            ) : (
              <Circle className="w-8 h-8 text-slate-300 stroke-[1.7]" />
            )}
          </button>
        </div>

        {/* Bottom footer inside Card: Assignee & Quick Actions */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {/* Assignee pill */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Người làm:</span>
            {assignee ? (
              <div className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-xl transition">
                <span className="text-sm">{assignee.avatar}</span>
                <span className="font-semibold text-slate-800">{assignee.name}</span>
                {assignee.streak > 1 && (
                  <span className="text-[10px] text-amber-600 font-bold ml-1">
                    🔥{assignee.streak}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 italic">Chưa giao</span>
            )}
          </div>

          {/* Action buttons: Nudge via Zalo / Rotate */}
          <div className="flex items-center space-x-1">
            {!chore.isCompletedToday && (
              <button
                onClick={() => onNudge(chore, assignee)}
                title="Nhắc riêng người này qua Zalo"
                className="inline-flex items-center space-x-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition"
              >
                <Send className="w-3 h-3" />
                <span>Nhắc Zalo</span>
              </button>
            )}

            <button
              onClick={() => onRotateNext(chore.id)}
              title="Chuyển việc cho người tiếp theo"
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
