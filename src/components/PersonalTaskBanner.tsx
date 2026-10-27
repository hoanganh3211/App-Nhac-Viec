import React from 'react';
import { Bell, Circle, Clock, Flame, Smile, CheckCheck, ArrowRightLeft, Check, X, Sparkles } from 'lucide-react';
import { Chore, Member, TransferRequest } from '../types';

interface PersonalTaskBannerProps {
  currentMember?: Member;
  myChores: Chore[];
  incomingRequests: TransferRequest[];
  onToggleComplete: (choreId: string) => void;
  onRequestNotification: () => void;
  notificationPermission: NotificationPermission;
  onOpenUserSelect: () => void;
  onOpenTransfer: (chore: Chore) => void;
  onAcceptTransfer: (requestId: string) => void;
  onDeclineTransfer: (requestId: string) => void;
  onOpenDetail?: (chore: Chore) => void;
}

export const PersonalTaskBanner: React.FC<PersonalTaskBannerProps> = ({
  currentMember,
  myChores,
  incomingRequests,
  onToggleComplete,
  onRequestNotification,
  notificationPermission,
  onOpenUserSelect,
  onOpenTransfer,
  onAcceptTransfer,
  onDeclineTransfer,
  onOpenDetail,
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
    <div className="space-y-2.5">
      {/* Incoming Transfer Requests Alert (Người khác mời nhượng việc cho bạn) */}
      {incomingRequests.length > 0 && (
        <div className="space-y-2">
          {incomingRequests.map((req) => (
            <div
              key={req.id}
              className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl text-slate-800 shadow-sm animate-in slide-in-from-top duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center text-base shrink-0">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-amber-950 flex items-center space-x-1">
                      <span>Lời mời nhượng việc:</span>
                      <span className="text-amber-800 font-extrabold">+{req.chorePoints} điểm</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      <strong>{req.fromMemberName}</strong> muốn nhượng việc <strong>{req.choreIcon} {req.choreTitle}</strong> cho bạn. Bạn có muốn nhận không?
                    </p>
                  </div>
                </div>
              </div>

              {/* Accept / Decline buttons */}
              <div className="mt-2.5 flex space-x-2 pt-2 border-t border-amber-200/60">
                <button
                  onClick={() => onDeclineTransfer(req.id)}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center justify-center space-x-1 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </button>

                <button
                  onClick={() => onAcceptTransfer(req.id)}
                  className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center space-x-1 transition"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Đồng ý (+{req.chorePoints}đ)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Personal Banner */}
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
                Điểm: <strong className={currentMember.points < 0 ? "text-rose-400" : "text-amber-300"}>{currentMember.points}đ</strong> • Chuỗi: 🔥{currentMember.streak}
                {currentMember.lateViolations > 0 && (
                  <span className="text-rose-300 font-semibold ml-1.5">
                    (Trễ {currentMember.lateViolations} lần)
                  </span>
                )}
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
                <span>🎯 Việc của bạn hôm nay ({pendingChores.length}):</span>
              </div>

              <div className="space-y-1.5">
                {pendingChores.map((chore) => {
                  const rewardPoints = chore.nextBonusPoints || chore.points;
                  return (
                    <div
                      key={chore.id}
                      onClick={() => onOpenDetail?.(chore)}
                      className="p-2 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-between border border-white/10 transition gap-2 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-lg shrink-0">{chore.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate flex items-center space-x-1">
                            <span>{chore.title}</span>
                            {chore.nextBonusPoints && (
                              <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-indigo-200 mt-0.5">
                            <span className="flex items-center space-x-0.5 shrink-0 whitespace-nowrap">
                              <Clock className="w-2.5 h-2.5 text-amber-300" />
                              <span>{chore.dueTime}</span>
                            </span>
                            <span className="flex items-center space-x-0.5 text-amber-300 shrink-0 whitespace-nowrap font-semibold">
                              <Flame className="w-2.5 h-2.5 fill-amber-300" />
                              <span>+{rewardPoints}đ</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Nhượng việc button */}
                        <button
                          onClick={() => onOpenTransfer(chore)}
                          title="Nhượng lại việc cho người khác"
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-[10px] font-semibold border border-amber-400/30 flex items-center space-x-0.5 transition"
                        >
                          <ArrowRightLeft className="w-2.5 h-2.5" />
                          <span>Nhượng</span>
                        </button>

                        {/* Complete button */}
                        <button
                          onClick={() => onToggleComplete(chore.id)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-sm transition transform active:scale-95 shrink-0 whitespace-nowrap"
                        >
                          <Circle className="w-3 h-3 stroke-[2.5]" />
                          <span>Xong</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
    </div>
  );
};
