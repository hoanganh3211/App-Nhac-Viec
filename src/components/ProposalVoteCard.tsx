import React from 'react';
import { Vote, Check, X, Users, Sparkles } from 'lucide-react';
import { RoomProposal, Member } from '../types';

interface ProposalVoteCardProps {
  proposals: RoomProposal[];
  members: Member[];
  currentUserId: string | null;
  onVote: (proposalId: string, vote: 'agree' | 'reject') => void;
}

export const ProposalVoteCard: React.FC<ProposalVoteCardProps> = ({
  proposals,
  members,
  currentUserId,
  onVote,
}) => {
  // Chỉ hiển thị các biểu quyết đang chờ (pending) mà người dùng này CHƯA BỎ PHIẾU.
  // Những biểu quyết đã vote rồi sẽ tự động ẩn đi tránh làm phiền,
  // người dùng có thể theo dõi kết quả cụ thể trong Trung tâm Thông báo (icon Chuông).
  const safeProposals = proposals || [];
  const safeMembers = members || [];
  const pendingProposalsToVote = safeProposals.filter((p) => {
    if (!p || p.status !== 'pending') return false;
    const votes = p.votes || {};
    if (currentUserId && votes[currentUserId]) return false;
    return true;
  });

  if (pendingProposalsToVote.length === 0) return null;

  const totalMembers = Math.max(1, safeMembers.length);
  const requiredVotes = Math.floor(totalMembers / 2) + 1;

  return (
    <div className="space-y-2.5">
      {pendingProposalsToVote.map((proposal) => {
        const votes = proposal.votes || {};
        const agreeVotes = Object.values(votes).filter((v) => v === 'agree').length;
        const rejectVotes = Object.values(votes).filter((v) => v === 'reject').length;
        const totalVotesCast = Object.keys(votes).length;

        const myVote = currentUserId && votes ? votes[currentUserId] : undefined;
        const hasVoted = Boolean(myVote);

        const agreePercentage = Math.round((agreeVotes / totalMembers) * 100);

        return (
          <div
            key={proposal.id}
            className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border-2 border-amber-300 rounded-2xl shadow-xs space-y-2.5 animate-in slide-in-from-top duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Vote className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-900 shrink-0">
                      Cần biểu quyết ({agreeVotes}/{requiredVotes} phiếu)
                    </span>
                    <span className="text-[10px] text-slate-400">lúc {proposal.createdAt}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mt-1 leading-snug">
                    {proposal.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                    {proposal.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Voting Progress bar */}
            <div className="space-y-1 bg-white/70 p-2 rounded-xl border border-amber-200/70">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                <span className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-amber-600" />
                  <span>Tiến độ biểu quyết:</span>
                </span>
                <span>
                  {agreeVotes} Thuận • {rejectVotes} Chống ({totalVotesCast}/{totalMembers} người đã vote)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${agreePercentage}%` }}
                />
                <div
                  className="bg-rose-400 h-full transition-all duration-300"
                  style={{ width: `${Math.round((rejectVotes / totalMembers) * 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-500 italic">
                *Cần tối thiểu <strong>{requiredVotes}/{totalMembers}</strong> phiếu thuận (&gt;50%) để phê duyệt tự động.
              </div>
            </div>

            {/* Action buttons or Vote Status */}
            {hasVoted ? (
              <div className="p-2 bg-white/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>
                    Bạn đã bỏ phiếu: <strong>{myVote === 'agree' ? '✅ Đồng ý' : '❌ Từ chối'}</strong>
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 italic">Đang đợi đủ phiếu...</span>
              </div>
            ) : (
              <div className="flex space-x-2 pt-0.5">
                <button
                  onClick={() => onVote(proposal.id, 'reject')}
                  className="flex-1 py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-300 flex items-center justify-center space-x-1 transition shadow-2xs"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Từ Chối</span>
                </button>

                <button
                  onClick={() => onVote(proposal.id, 'agree')}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center space-x-1 transition"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Đồng Ý</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
