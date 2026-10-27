import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  Vote, 
  RotateCcw, 
  ArrowRightLeft, 
  Sparkles, 
  CheckCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { AppNotification, RoomProposal, Member } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  proposals: RoomProposal[];
  members: Member[];
  currentUserId: string | null;
  onMarkAllRead: () => void;
  onVoteProposal: (proposalId: string, vote: 'agree' | 'reject') => void;
  onOpenNotificationSettings?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications = [],
  proposals = [],
  members = [],
  currentUserId,
  onMarkAllRead,
  onVoteProposal,
  onOpenNotificationSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'proposals'>('notifications');
  const [showVotedHistory, setShowVotedHistory] = useState(false);

  if (!isOpen) return null;

  const safeNotifications = notifications || [];
  const safeProposals = proposals || [];
  const safeMembers = members || [];
  const totalMembers = Math.max(1, safeMembers.length);
  const requiredVotes = Math.floor(totalMembers / 2) + 1;

  const unreadCount = safeNotifications.filter(
    (n) => !currentUserId || !(Array.isArray(n.readBy) && n.readBy.includes(currentUserId))
  ).length;

  // Biểu quyết đang chờ mà người dùng CHƯA bỏ phiếu
  const pendingProposalsToVote = safeProposals.filter((p) => {
    if (p.status !== 'pending') return false;
    const votes = p.votes || {};
    if (currentUserId && votes[currentUserId]) return false;
    return true;
  });

  // Biểu quyết mà người dùng ĐÃ bỏ phiếu hoặc đã hoàn thành
  const completedOrVotedProposals = safeProposals.filter((p) => {
    const votes = p.votes || {};
    if (p.status !== 'pending') return true;
    if (currentUserId && votes[currentUserId]) return true;
    return false;
  });

  const pendingProposalsCount = pendingProposalsToVote.length;

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'chore_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'proposal_vote':
        return <Vote className="w-4 h-4 text-amber-600" />;
      case 'proposal_result':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'chore_redo':
        return <RotateCcw className="w-4 h-4 text-orange-600" />;
      case 'chore_transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const renderProposalItem = (proposal: RoomProposal) => {
    const votes = proposal.votes || {};
    const agreeVotes = Object.values(votes).filter((v) => v === 'agree').length;
    const rejectVotes = Object.values(votes).filter((v) => v === 'reject').length;
    const totalVotesCast = Object.keys(votes).length;

    const myVote = currentUserId && votes ? votes[currentUserId] : undefined;
    const isPending = proposal.status === 'pending';

    return (
      <div
        key={proposal.id}
        className={`p-3 rounded-2xl border space-y-2.5 transition ${
          isPending
            ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
            : proposal.status === 'approved'
            ? 'bg-emerald-50/40 border-emerald-200'
            : 'bg-rose-50/40 border-rose-200'
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <div>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                  isPending
                    ? 'bg-amber-200 text-amber-900'
                    : proposal.status === 'approved'
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-rose-200 text-rose-900'
                }`}
              >
                {isPending
                  ? 'Đang bỏ phiếu'
                  : proposal.status === 'approved'
                  ? 'Đã thông qua'
                  : 'Bị từ chối'}
              </span>
              <span className="text-[10px] text-slate-400">{proposal.createdAt}</span>
            </div>
            <h4 className="font-bold text-xs text-slate-800 mt-1">{proposal.title}</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">{proposal.description}</p>
          </div>
        </div>

        {/* Vote tally */}
        <div className="text-[10px] text-slate-500 flex items-center justify-between font-semibold pt-1 border-t border-slate-200/50">
          <span>
            {agreeVotes} Thuận • {rejectVotes} Chống (Cần {requiredVotes} phiếu)
          </span>
          <span>{totalVotesCast}/{totalMembers} đã vote</span>
        </div>

        {/* Action buttons or status */}
        {isPending ? (
          <div>
            {myVote ? (
              <div className="p-1.5 bg-white/80 rounded-xl border border-slate-200 text-center text-[10px] font-semibold text-slate-600">
                Bạn đã bỏ phiếu: <strong className={myVote === 'agree' ? 'text-emerald-700' : 'text-rose-700'}>
                  {myVote === 'agree' ? 'Đồng ý' : 'Từ chối'}
                </strong>
              </div>
            ) : (
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => onVoteProposal(proposal.id, 'reject')}
                  className="flex-1 py-1.5 bg-white text-rose-700 hover:bg-rose-50 border border-rose-300 font-bold rounded-xl text-[11px] transition text-center cursor-pointer"
                >
                  Từ Chối
                </button>
                <button
                  onClick={() => onVoteProposal(proposal.id, 'agree')}
                  className="flex-1 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-xl text-[11px] transition text-center shadow-xs cursor-pointer"
                >
                  Đồng Ý
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-1.5 bg-white/70 rounded-xl border border-slate-200/60 text-center text-[10px] font-medium text-slate-500">
            {proposal.status === 'approved' ? '✓ Đã hoàn tất và thực thi' : '✗ Đề xuất đã bị hủy'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Trung Tâm Thông Báo</h3>
              <p className="text-[10px] text-slate-400">Tin tức & Biểu quyết phòng</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onOpenNotificationSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNotificationSettings();
                }}
                title="Cài đặt thông báo đẩy"
                className="p-1.5 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="p-2 bg-slate-100/70 flex items-center space-x-1 border-b border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-extrabold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'proposals'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Biểu quyết</span>
            {pendingProposalsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-extrabold">
                {pendingProposalsCount}
              </span>
            )}
          </button>
        </div>

        {/* Body content */}
        <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {activeTab === 'notifications' ? (
            <>
              {safeNotifications.length > 0 && (
                <div className="flex justify-end pb-1">
                  <button
                    onClick={onMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đánh dấu đã đọc tất cả</span>
                  </button>
                </div>
              )}

              {safeNotifications.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-xs">Chưa có thông báo nào</h4>
                  <p className="text-[11px] text-slate-400">
                    Khi có người xong việc, nhượng việc hoặc có kết quả biểu quyết, thông tin sẽ hiện ở đây!
                  </p>
                </div>
              ) : (
                safeNotifications.map((notif) => {
                  const readByList = Array.isArray(notif.readBy) ? notif.readBy : [];
                  const isUnread = Boolean(currentUserId && !readByList.includes(currentUserId));
                  return (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-2xl border transition ${
                        isUnread
                          ? 'bg-indigo-50/50 border-indigo-200/90 shadow-2xs'
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <div className="p-1.5 rounded-xl bg-white border border-slate-100 shadow-2xs shrink-0 mt-0.5">
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-bold text-xs text-slate-800 truncate">{notif.title}</h5>
                            <span className="text-[10px] text-slate-400 shrink-0">{notif.createdAt}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <>
              {/* PHẦN BIỂU QUYẾT */}
              {safeProposals.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <Vote className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-xs">Chưa có đề xuất nào</h4>
                  <p className="text-[11px] text-slate-400">
                    Các thao tác quan trọng (thêm việc, sửa việc, xóa việc) sẽ cần phòng biểu quyết ở đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Danh sách đang chờ bạn biểu quyết */}
                  {pendingProposalsToVote.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-amber-800 flex items-center space-x-1">
                        <Vote className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cần bạn bỏ phiếu ({pendingProposalsToVote.length}):</span>
                      </div>
                      {pendingProposalsToVote.map((p) => renderProposalItem(p))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center space-y-1">
                      <div className="flex items-center justify-center space-x-1 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Không có biểu quyết nào đang chờ bạn</span>
                      </div>
                      <p className="text-[10px] text-emerald-600">
                        Bạn đã tham gia biểu quyết đầy đủ các đề xuất hiện hành!
                      </p>
                    </div>
                  )}

                  {/* Mục đã biểu quyết & lịch sử (Tự động ẩn tránh làm phiền, có toggle mở xem lại) */}
                  {completedOrVotedProposals.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => setShowVotedHistory((prev) => !prev)}
                        className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 flex items-center justify-between text-[11px] font-semibold transition cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <History className="w-3.5 h-3.5 text-slate-400" />
                          <span>Đã biểu quyết & Đã chốt kết quả ({completedOrVotedProposals.length})</span>
                        </span>
                        {showVotedHistory ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {showVotedHistory && (
                        <div className="space-y-2 animate-in fade-in duration-150">
                          {completedOrVotedProposals.map((p) => renderProposalItem(p))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
