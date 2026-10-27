import React from 'react';
import { Award, Scale, Coins, TrendingUp } from 'lucide-react';
import { Member, PenaltyRecord } from '../types';

interface FairnessBoardProps {
  members: Member[];
  penalties: PenaltyRecord[];
  onOpenPenaltyModal: () => void;
}

export const FairnessBoard: React.FC<FairnessBoardProps> = ({
  members,
  penalties,
  onOpenPenaltyModal,
}) => {
  // Sort members by points descending
  const sortedMembers = [...members].sort((a, b) => b.points - a.points);
  const maxPoints = Math.max(...members.map((m) => m.points), 1);
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);

  // Calculate fairness index (Gini/Standard deviation simplified)
  const averagePoints = totalPoints / (members.length || 1);
  const variance =
    members.reduce((acc, m) => acc + Math.pow(m.points - averagePoints, 2), 0) /
    (members.length || 1);
  const stdDev = Math.sqrt(variance);
  // Fairness ratio (0 - 100%): lower stdDev relative to average means higher fairness
  const fairnessRatio =
    averagePoints === 0
      ? 100
      : Math.max(50, Math.min(100, Math.round(100 - (stdDev / (averagePoints + 1)) * 50)));

  // Calculate total penalty fund
  const totalFund = penalties.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Chỉ Số Công Bằng & Đóng Góp</h2>
            <p className="text-[11px] text-slate-500">
              Điểm Karma tích lũy khi hoàn thành việc nhà
            </p>
          </div>
        </div>

        {/* Fairness Pill */}
        <div className="text-right">
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              fairnessRatio >= 80
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <span>{fairnessRatio}% công bằng</span>
          </span>
        </div>
      </div>

      {/* Members Points Bars */}
      <div className="space-y-3 pt-1">
        {sortedMembers.map((member, index) => {
          const percentage = Math.round((member.points / maxPoints) * 100);
          const isLeader = index === 0 && member.points > 0;

          return (
            <div key={member.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{member.avatar}</span>
                  <span className="font-semibold text-slate-800 flex items-center space-x-1">
                    <span>{member.name}</span>
                    {isLeader && (
                      <Award className="w-3.5 h-3.5 text-amber-500 inline fill-amber-500" />
                    )}
                  </span>
                  {member.streak > 1 && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md font-bold">
                      Chuỗi {member.streak} ngày
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 font-bold">
                  <span className="text-slate-800">{member.points}</span>
                  <span className="text-[10px] text-slate-400 font-normal">điểm</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                      : index === 1
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      : 'bg-gradient-to-r from-slate-400 to-slate-500'
                  }`}
                  style={{ width: `${Math.max(percentage, 8)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Fun Penalty Fund Banner */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 p-3 rounded-2xl">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Quỹ phạt vui trễ hạn</div>
            <div className="text-sm font-extrabold text-amber-800">
              {totalFund.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <button
          onClick={onOpenPenaltyModal}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center space-x-1"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Chi tiết quỹ</span>
        </button>
      </div>
    </div>
  );
};
