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
        className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl text-white shadow-md cursor-pointer hover:opacity-95 transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👤</span>
            <div>
              <div className="font-bold text-sm">Bạn chưa chọn mình là ai!</div>
              <div className="text-xs text-indigo-100">
                Bấm vào đây để chọn tên bạn và xem việc được giao riêng cho bạn.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-white text-indigo-700 text-xs font-bold rounded-xl shadow-xs">
            Chọn ngay
          </span>
        </div>
      </div>
    );
  }

  const pendingChores = myChores.filter((c) => !c.isCompletedToday);
  const completedChores = myChores.filter((c) => c.isCompletedToday);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-4 shadow-lg shadow-indigo-950/20 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl">{currentMember.avatar}</span>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-indigo-200">Xin chào,</span>
              <h3 className="font-extrabold text-sm text-white">{currentMember.name}</h3>
              <button
                onClick={onOpenUserSelect}
                className="text-[10px] text-indigo-300 hover:text-white underline ml-1"
              >
                (Đổi)
              </button>
            </div>
            <div className="text-[11px] text-indigo-200/80">
              Điểm của bạn: <strong className="text-amber-300">{currentMember.points}đ</strong> • Chuỗi: 🔥{currentMember.streak} ngày
            </div>
          </div>
        </div>

        {/* Notification bell trigger */}
        {notificationPermission !== 'granted' ? (
          <button
            onClick={onRequestNotification}
            title="Bật chuông thông báo cá nhân khi đến giờ việc của bạn"
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold shadow-xs transition animate-pulse"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Bật chuông</span>
          </button>
        ) : (
          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <Bell className="w-3 h-3 text-emerald-400" />
            <span>Chuông Bật</span>
          </span>
        )}
      </div>

      {/* Task status */}
      <div className="pt-1">
        {pendingChores.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-indigo-200 flex items-center justify-between">
              <span>🎯 Việc bạn cần làm hôm nay ({pendingChores.length}):</span>
            </div>

            <div className="space-y-1.5">
              {pendingChores.map((chore) => (
                <div
                  key={chore.id}
                  className="p-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-between border border-white/10 transition"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-xl shrink-0">{chore.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">{chore.title}</div>
                      <div className="flex items-center space-x-2 text-[10px] text-indigo-200 mt-0.5">
                        <span className="flex items-center space-x-0.5">
                          <Clock className="w-3 h-3 text-amber-300" />
                          <span>Hạn: {chore.dueTime}</span>
                        </span>
                        <span className="flex items-center space-x-0.5 text-amber-300">
                          <Flame className="w-3 h-3 fill-amber-300" />
                          <span>+{chore.points}đ</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleComplete(chore.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md transition transform active:scale-95 shrink-0"
                  >
                    <Circle className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Xong rồi</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : myChores.length > 0 && completedChores.length === myChores.length ? (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center space-x-3 text-xs text-emerald-200">
            <CheckCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Bạn đã xong toàn bộ việc hôm nay!</div>
              <div>Cảm ơn sự đóng góp của bạn. Cả phòng rất biết ơn bạn! ✨</div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-white/10 rounded-2xl flex items-center space-x-3 text-xs text-indigo-200">
            <Smile className="w-5 h-5 text-indigo-300 shrink-0" />
            <div>
              <div className="font-semibold text-white">Hôm nay bạn không có lịch việc nhà</div>
              <div className="text-[11px] text-indigo-200/80">Tận hưởng ngày nghỉ hoặc giúp đỡ bạn cùng phòng nhé!</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
