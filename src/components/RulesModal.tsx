import React from 'react';
import { X, Scale, AlertTriangle, ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white/20 rounded-xl">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Quy Ước Điểm & Nhượng Việc</h3>
              <p className="text-[10px] text-indigo-100">Luật chơi công bằng phòng chung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700 leading-relaxed flex-1">
          {/* Rule 1: Point Weight */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Trọng số điểm theo độ nặng</span>
            </div>
            <p className="text-[11px] text-slate-600 pl-5">
              Việc nhẹ (đổ rác) = 1đ, việc vừa (rửa bát, quét nhà) = 2-3đ, việc nặng (cọ toilet, lau bếp) = 4-5đ.
            </p>
          </div>

          {/* Rule 2: Late Penalties */}
          <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-1 text-rose-950">
            <div className="font-bold flex items-center space-x-1.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>2. Trừ điểm trễ hạn & Tái phạm</span>
            </div>
            <ul className="text-[11px] text-rose-900/90 pl-5 space-y-1 list-disc">
              <li>
                <strong>Trễ hạn lần đầu:</strong> Bị trừ đúng bằng số điểm của việc đó (ví dụ việc 3đ $\rightarrow$ trừ 3đ).
              </li>
              <li>
                <strong>Tái phạm trễ:</strong> Điểm bị trừ nặng hơn = <strong>(điểm việc + 2)</strong>!
              </li>
            </ul>
          </div>

          {/* Rule 3: Chore Transfer */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1.5 text-amber-950">
            <div className="font-bold flex items-center space-x-1.5 text-amber-900">
              <ArrowRightLeft className="w-4 h-4 text-amber-600" />
              <span>3. Cơ chế nhượng việc nhà</span>
            </div>
            <ul className="text-[11px] text-amber-950 pl-5 space-y-1 list-disc">
              <li>
                <strong>Người nhượng:</strong> Mất ngay số điểm của việc đó để nhượng cho bạn cùng phòng.
              </li>
              <li>
                <strong>Người nhận:</strong> Có quyền <strong>Đồng ý</strong> hoặc <strong>Từ chối</strong> nếu bận.
              </li>
              <li>
                <strong>Thưởng làm hộ:</strong> Người nhận làm xong sẽ được <strong>hưởng trọn số điểm</strong> của việc đó.
              </li>
              <li className="font-semibold text-indigo-900 flex items-start space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 inline shrink-0 mt-0.5" />
                <span>
                  <strong>Hoàn trả & Thưởng:</strong> Lượt tới việc sẽ quay lại cho người nhượng, và khi hoàn thành sẽ được <strong>(điểm việc + 1)</strong> để bù đắp điểm!
                </span>
              </li>
            </ul>
          </div>

          {/* Rule 4: Newcomer Protection & Auto Rebalancing */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1.5 text-emerald-950">
            <div className="font-bold flex items-center space-x-1.5 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>4. Bảo vệ người mới (Chống dồn việc)</span>
            </div>
            <ul className="text-[11px] text-emerald-950 pl-5 space-y-1 list-disc">
              <li>
                <strong>Cấp điểm khởi đầu:</strong> Thành viên mới gia nhập phòng lâu ngày sẽ được cấp ngay số điểm bằng <strong>Điểm trung bình của phòng</strong>, không sợ bị 0 điểm hay bị ép gánh việc.
              </li>
              <li>
                <strong>Chia đều lại việc nhà:</strong> Toàn bộ công việc trong phòng được hệ thống <strong>tự động phân chia lại</strong> đồng đều giữa tất cả mọi người ngay khi có người mới.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
          >
            Đã hiểu quy ước
          </button>
        </div>
      </div>
    </div>
  );
};
