import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle, Sparkles, Send } from 'lucide-react';
import { Chore, Member } from '../types';

interface TransferChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore: Chore | null;
  currentMember?: Member;
  members: Member[];
  onConfirmTransfer: (chore: Chore, targetMemberId: string) => void;
}

export const TransferChoreModal: React.FC<TransferChoreModalProps> = ({
  isOpen,
  onClose,
  chore,
  currentMember,
  members,
  onConfirmTransfer,
}) => {
  const eligibleMembers = members.filter((m) => m.id !== currentMember?.id);
  const [targetMemberId, setTargetMemberId] = useState(eligibleMembers[0]?.id || '');

  if (!isOpen || !chore) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemberId) return;
    onConfirmTransfer(chore, targetMemberId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Nhượng Lại Việc Nhà</h3>
              <p className="text-[10px] text-amber-100">Cơ chế trao đổi & bảo lưu điểm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs text-slate-700">
          {/* Chore Info */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">{chore.icon}</span>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">{chore.title}</h4>
                <p className="text-[10px] text-slate-400">Hạn chót: {chore.dueTime}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-bold text-xs">
              {chore.points} điểm
            </span>
          </div>

          {/* Rules Breakdown */}
          <div className="space-y-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-[11px] leading-relaxed text-indigo-950">
            <div className="font-bold flex items-center space-x-1 text-indigo-900">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Quy tắc nhượng việc:</span>
            </div>
            <ul className="space-y-1 text-indigo-900/90 pl-1 list-disc list-inside">
              <li>
                Bạn sẽ <strong>mất {chore.points} điểm</strong> để nhượng việc này.
              </li>
              <li>
                Người được chọn <strong>có quyền từ chối</strong> nếu họ bận.
              </li>
              <li>
                Nếu nhận và làm xong, họ được <strong>hưởng trọn +{chore.points} điểm</strong>.
              </li>
              <li className="text-amber-800 font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-600 inline shrink-0" />
                <span>
                  Lượt tới việc trả lại bạn và bạn được thưởng <strong>+{chore.points + 1} điểm</strong>!
                </span>
              </li>
            </ul>
          </div>

          {/* Target Member Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chọn người bạn muốn nhượng việc:
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {eligibleMembers.map((m) => {
                const isSelected = m.id === targetMemberId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTargetMemberId(m.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{m.avatar}</span>
                      <span>{m.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {m.points}đ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-1 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!targetMemberId}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100 transition text-xs flex items-center justify-center space-x-1"
            >
              <Send className="w-3 h-3" />
              <span>Gửi lời mời (-{chore.points}đ)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
