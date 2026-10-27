import React, { useState } from 'react';
import { X, Coins, Plus, Check } from 'lucide-react';
import { Member, PenaltyRecord } from '../types';

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  penalties: PenaltyRecord[];
  members: Member[];
  onAddPenalty: (memberId: string, amount: number, reason: string) => void;
  onMarkPaid: (id: string) => void;
}

export const PenaltyModal: React.FC<PenaltyModalProps> = ({
  isOpen,
  onClose,
  penalties,
  members,
  onAddPenalty,
  onMarkPaid,
}) => {
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [amount, setAmount] = useState(10000);
  const [reason, setReason] = useState('Trễ hạn việc nhà quá 23:00');

  if (!isOpen) return null;

  const totalFund = penalties.reduce((sum, p) => sum + p.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || amount <= 0) return;
    onAddPenalty(memberId, amount, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-base">Quỹ Phạt Vui Vẻ Của Phòng</h3>
              <p className="text-[11px] text-amber-100">Dùng để uống trà sữa / ăn lẩu cuối tháng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Total Fund Card */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-center space-y-1">
            <div className="text-xs text-amber-800 font-semibold uppercase tracking-wider">
              Tổng quỹ hiện có
            </div>
            <div className="text-3xl font-black text-amber-900">
              {totalFund.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-amber-700">
              Quy ước: Quên việc phạt nhẹ 10.000đ để cùng nhau giữ nhà sạch!
            </p>
          </div>

          {/* List of penalties */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Lịch sử nộp phạt:</div>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {penalties.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Chưa có ai bị phạt! Mọi người làm việc rất gương mẫu.
                </div>
              ) : (
                penalties.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {item.memberName}: +{item.amount.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-slate-500 text-[11px]">{item.reason} • {item.date}</div>
                    </div>
                    {item.status === 'paid' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" />
                        <span>Đã nộp</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onMarkPaid(item.id)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-emerald-100 hover:text-emerald-800 transition"
                      >
                        Chưa nộp
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add penalty form */}
          <form onSubmit={handleSubmit} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ghi phạt trễ hạn:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar} {m.name}
                  </option>
                ))}
              </select>

              <select
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold text-amber-800"
              >
                <option value={5000}>5.000 đ</option>
                <option value={10000}>10.000 đ</option>
                <option value={20000}>20.000 đ</option>
                <option value={50000}>50.000 đ</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Lý do phạt (vd: Quên rửa bát 23h)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
            />

            <button
              type="submit"
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition"
            >
              + Ghi Vào Quỹ Phạt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
