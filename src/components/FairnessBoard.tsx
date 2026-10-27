import React from 'react';
import { Award, Scale, AlertTriangle, Sparkles, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { Member } from '../types';

interface FairnessBoardProps {
  members: Member[];
  onAutoBalance?: () => void;
}

export const FairnessBoard: React.FC<FairnessBoardProps> = ({ members, onAutoBalance }) => {
  const sortedMembers = [...members].sort((a, b) => b.points - a.points);
  const maxPoints = Math.max(...members.map((m) => m.points), 1);
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);

  const averagePoints = totalPoints / (members.length || 1);
  const variance =
    members.reduce((acc, m) => acc + Math.pow(m.points - averagePoints, 2), 0) /
    (members.length || 1);
  const stdDev = Math.sqrt(variance);
  const fairnessRatio =
    averagePoints === 0
      ? 100
      : Math.max(50, Math.min(100, Math.round(100 - (stdDev / (averagePoints + 1)) * 50)));

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 text-xs truncate">Bảng Điểm Đóng Góp & Công Bằng</h2>
            <p className="text-[10px] text-slate-400 truncate">
              Làm việc nặng được điểm cao • Trễ hạn bị trừ điểm
            </p>
          </div>
        </div>

        {/* Fairness Ratio Pill */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {onAutoBalance && (
            <button
              onClick={onAutoBalance}
              title="Phân chia lại việc công bằng cho các thành viên"
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 whitespace-nowrap ${
              fairnessRatio >= 80
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80'
            }`}
          >
            <span>{fairnessRatio}% công bằng</span>
          </span>
        </div>
      </div>

      {/* Members Points Bars */}
      <div className="space-y-2 pt-0.5">
        {sortedMembers.map((member, index) => {
          const percentage = Math.round((member.points / maxPoints) * 100);
          const isLeader = index === 0 && member.points > 0;

          return (
            <div key={member.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 min-w-0 flex-1 mr-2">
                  <span className="text-sm shrink-0">{member.avatar}</span>
                  <span className="font-semibold text-slate-800 text-xs truncate">
                    {member.name}
                  </span>
                  {isLeader && (
                    <Award className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  {member.streak > 1 && (
                    <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded-sm font-bold shrink-0">
                      🔥{member.streak}d
                    </span>
                  )}
                  {member.lateViolations > 0 && (
                    <span className="text-[9px] text-rose-700 bg-rose-50 px-1 rounded-sm font-bold shrink-0 flex items-center space-x-0.5 border border-rose-200/60">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Trễ {member.lateViolations} lần</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-0.5 font-bold text-xs shrink-0 whitespace-nowrap">
                  <span className={member.points < 0 ? 'text-rose-600' : 'text-slate-800'}>
                    {member.points}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">điểm</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    member.points < 0
                      ? 'bg-rose-400'
                      : index === 0
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                      : index === 1
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      : 'bg-gradient-to-r from-slate-300 to-slate-400'
                  }`}
                  style={{ width: `${Math.max(percentage, 6)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules Banner */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 p-2.5 rounded-xl text-[10px] text-slate-600 leading-tight">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Trễ: <strong>-điểm việc</strong> • Tái phạm: <strong>-(điểm + 2)</strong>
          </span>
        </div>
        <div className="flex items-center space-x-1 font-semibold text-amber-700 shrink-0">
          <ArrowRightLeft className="w-3 h-3" />
          <span>Nhượng việc để nhờ</span>
        </div>
      </div>
    </div>
  );
};
