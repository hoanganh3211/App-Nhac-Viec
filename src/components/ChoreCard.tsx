import { Check, Trash2 } from 'lucide-react';
import { Chore, Member } from '../types';

interface ChoreCardProps {
  chore: Chore;
  members: Member[];
  currentUserId: string | null;
  onToggleComplete: (choreId: string) => void;
  onDeleteChore?: (choreId: string) => void;
}

export function ChoreCard({ chore, members, currentUserId, onToggleComplete, onDeleteChore }: ChoreCardProps) {
  const assignedMember = members.find(m => m.id === chore.assignedTo);
  const isCompleted = chore.isCompletedToday;
  const canToggle = chore.assignedTo === currentUserId;

  const completedTime = chore.completedAt || null;

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-2xl border transition-colors ${
        isCompleted
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}
    >
      {/* Left: Icon + Title + Assigned member */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl flex-shrink-0">{chore.icon}</span>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <p className={`font-semibold text-sm truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {chore.title}
            </p>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
              +{chore.points}đ
            </span>
          </div>
          {assignedMember && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {assignedMember.avatar} {assignedMember.name}
            </p>
          )}
        </div>
      </div>

      {/* Right: Time + Delete + Tick button */}
      <div className="flex items-center gap-2.5 flex-shrink-0 ml-3">
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500">{chore.dueTime}</p>
          {isCompleted && completedTime && (
            <p className="text-[10px] text-emerald-600 font-semibold">✓ {completedTime}</p>
          )}
        </div>

        {onDeleteChore && (
          <button
            onClick={() => onDeleteChore(chore.id)}
            className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Xóa công việc này"
            aria-label="Xóa việc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => canToggle && onToggleComplete(chore.id)}
          disabled={!canToggle}
          title={canToggle ? (isCompleted ? 'Bấm để hủy hoàn thành' : 'Bấm để hoàn thành') : 'Chỉ người phụ trách mới được tick'}
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
            isCompleted
              ? 'bg-emerald-500 text-white shadow-xs'
              : canToggle
                ? 'border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'
                : 'border-2 border-slate-200 opacity-40 cursor-not-allowed'
          }`}
        >
          {isCompleted && <Check className="w-4 h-4 stroke-[2.5]" />}
        </button>
      </div>
    </div>
  );
}
