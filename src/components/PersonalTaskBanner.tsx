import React from 'react';
import { Bell, Circle, Clock, Flame, Smile, CheckCheck } from 'lucide-react';
import { Chore, Member } from '../types';

interface PersonalTaskBannerProps {
  currentMember?: Member;
  myChores: Chore[];
  onToggleComplete: (choreId: string) => void;
  onRequestNotification: () => void;
  notificationPermission: NotificationPermission;
  onOpenUserSelect: () => void;
}

export const PersonalTaskBanner: React.FC<PersonalTaskBannerProps> = ({
  currentMember,
  myChores,
  onToggleComplete,
  onRequestNotification,
  notificationPermission,
  onOpenUserSelect,
}) => {
  if (!currentMember) {
    return (
      <div
        onClick={onOpenUserSelect}
        className="p-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl text-white shadow-sm cursor-pointer hover:opacity-95 transition"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="text-2xl shrink-0">👤</span>
            <div className="min-w-0">
              <div className="font-bold text-xs truncate">Bạn chưa chọn mình là ai!</div>
              <div className="text-[11px] text-indigo-100 truncate">
                Bấm vào đây để chọn tên bạn và nhận việc riêng.
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white text-indigo-700 text-xs font-bold rounded-xl shadow-2xs shrink-0 whitespace-nowrap">
            Chọn ngay
          </span>
        </div>
      </div>
    );
  }

  const pendingChores = myChores.filter((c) => !c.isCompletedToday);
  const completedChores = myChores.filter((c) => c.isCompletedToday);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-3.5 shadow-md shadow-indigo-950/15 space-y-2.5">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="text-xl shrink-0">{currentMember.avatar}</span>
          <div className="min-w-0">
            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-indigo-200">Chào,</span>
              <h3 className="font-bold text-xs text-white truncate max-w-[150px]">
                {currentMember.name}
              </h3>
            </div>
            <div className="text-[10px] text-indigo-200/90 whitespace-nowrap">
              Điểm: <strong className="text-amber-300">{currentMember.points}đ</strong> • Chuỗi: 🔥{currentMember.streak}
            </div>
          </div>
        </div>

        {/* Notification bell trigger */}
        {notificationPermission !== 'granted' ? (
          <button
            onClick={onRequestNotification}
            title="Bật chuông thông báo cá nhân khi đến giờ việc của bạn"
            className="flex items-center space-x-1 px-2 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl text-[11px] font-bold shadow-2xs transition shrink-0 whitespace-nowrap animate-pulse"
          >
            <Bell className="w-3 h-3" />
            <span>Bật chuông</span>
          </button>
        ) : (
          <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0 whitespace-nowrap">
            <Bell className="w-2.5 h-2.5 text-emerald-400" />
            <span>Chuông Bật</span>
          </span>
        )}
      </div>

      {/* Task status */}
      <div>
        {pendingChores.length > 0 ? (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-indigo-200 flex items-center justify-between">
              <span>🎯 Việc của bạn ({pendingChores.length}):</span>
            </div>

            <div className="space-y-1.5">
              {pendingChores.map((chore) => (
                <div
                  key={chore.id}
                  className="p-2 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-between border border-white/10 transition gap-2"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="text-lg shrink-0">{chore.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">{chore.title}</div>
                      <div className="flex items-center space-x-2 text-[10px] text-indigo-200 mt-0.5">
                        <span className="flex items-center space-x-0.5 shrink-0 whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5 text-amber-300" />
                          <span>{chore.dueTime}</span>
                        </span>
                        <span className="flex items-center space-x-0.5 text-amber-300 shrink-0 whitespace-nowrap font-semibold">
                          <Flame className="w-2.5 h-2.5 fill-amber-300" />
                          <span>+{chore.points}đ</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleComplete(chore.id)}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-sm transition transform active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <Circle className="w-3 h-3 stroke-[2.5]" />
                    <span>Xong rồi</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : myChores.length > 0 && completedChores.length === myChores.length ? (
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-200">
            <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-white text-xs truncate">Đã hoàn thành 100% việc hôm nay!</div>
              <div className="text-[10px] text-emerald-200/90 truncate">Cả phòng rất biết ơn bạn! ✨</div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-white/10 rounded-xl flex items-center space-x-2 text-xs text-indigo-200">
            <Smile className="w-4 h-4 text-indigo-300 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-white text-xs truncate">Hôm nay bạn không có lịch việc nhà</div>
              <div className="text-[10px] text-indigo-200/80 truncate">Tận hưởng ngày nghỉ nhé!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
