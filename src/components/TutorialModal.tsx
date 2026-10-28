import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  ArrowRightLeft, 
  Vote, 
  Calendar, 
  Send, 
  ArrowRight, 
  ArrowLeft,
  Flame,
  Award,
  AlertTriangle,
  RotateCcw,
  Check,
  ThumbsUp,
  Clock,
  Home
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface TutorialStep {
  id: number;
  title: string;
  badge: string;
  badgeColor: string;
  headline: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (userId) {
      try {
        localStorage.setItem(`app_nhac_viec_tutorial_seen_${userId}`, 'true');
      } catch {}
    }
    onClose();
  };

  const steps: TutorialStep[] = [
    {
      id: 0,
      badge: 'Bắt đầu',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      title: 'Chào mừng bạn đến với ViệcNhà 🎉',
      headline: 'Phân chia việc nhà công bằng & Tự động',
      description: 'Không còn cảnh tị nạnh, quên việc hay ấm ức khi ở chung phòng. ViệcNhà giúp mọi người sống vui vẻ, ngăn nắp!',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Sparkles className="w-8 h-8" />
        </div>
      ),
      content: (
        <div className="space-y-3">
          <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-xs text-indigo-950 flex items-start space-x-3">
            <div className="p-1.5 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-indigo-900 mb-0.5">Thuật toán xoay tua công bằng</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Hệ thống luôn ưu tiên giao việc cho thành viên đang có <strong>ít điểm nhất</strong>. Ai chăm chỉ sẽ được nghỉ ngơi nhiều hơn ở chu kỳ sau!
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-xs text-emerald-950 flex items-start space-x-3">
            <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-900 mb-0.5">Đồng bộ tức thì cả phòng</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Chỉ cần 1 người hoàn thành việc hoặc nhượng việc, toàn bộ thành viên trong phòng đều nhìn thấy ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      badge: 'Việc mỗi ngày',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      title: 'Xem việc hôm nay & Tick hoàn thành ✅',
      headline: 'Làm việc đúng hạn, nhận ngay điểm thưởng',
      description: 'Mỗi sáng mở app, danh sách công việc của riêng bạn sẽ được hiển thị ngay tại tab đầu tiên.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
      ),
      content: (
        <div className="space-y-3">
          {/* Mock Chore Card */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🍽️</span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Rửa chén bát sau bữa tối</div>
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Hạn chót: 21:00 hôm nay</span>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                +2 điểm
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">Chạm để tick xong:</span>
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
                <Check className="w-3.5 h-3.5" />
                <span>Hoàn thành</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <p className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Chính chủ mới tick được:</span>
            </p>
            <p className="pl-5 text-slate-600">
              Chỉ người được giao việc mới có quyền tick hoàn thành việc của mình để tránh người khác tick nhầm hoặc gian lận.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: 'Quy ước điểm',
      badgeColor: 'bg-amber-100 text-amber-800',
      title: 'Bảng điểm & Luật phạt trễ hạn ⚖️',
      headline: 'Đảm bảo sự công bằng tuyệt đối',
      description: 'Mỗi công việc có mức điểm tương xứng với độ vất vả, kèm cơ chế nhắc nhở và phạt vi phạm rõ ràng.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
          <Award className="w-8 h-8" />
        </div>
      ),
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Độ nặng công việc (1 - 5 điểm)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              • Việc nhẹ (đổ rác): <strong>1 điểm</strong><br />
              • Việc vừa (quét nhà, rửa bát): <strong>2 - 3 điểm</strong><br />
              • Việc nặng (cọ toilet, lau bếp): <strong>4 - 5 điểm</strong>
            </p>
          </div>

          <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-1 text-rose-950">
            <div className="font-bold flex items-center space-x-1.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Trừ điểm khi để trễ hạn</span>
            </div>
            <p className="text-[11px] text-rose-900/90 leading-relaxed">
              • <strong>Trễ lần đầu:</strong> Bị trừ đúng bằng số điểm của việc đó.<br />
              • <strong>Tái phạm nhiều lần:</strong> Bị trừ nặng hơn = <strong>(Điểm việc + 2đ)</strong>!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: 'Nhượng việc',
      badgeColor: 'bg-violet-100 text-violet-700',
      title: 'Bận đột xuất? Nhượng việc thông minh 🔄',
      headline: 'Hỗ trợ bạn cùng phòng & Nhận thưởng làm bù',
      description: 'Hôm nay bạn bận thi cử, làm thêm về muộn hay về quê? Đừng lo, tính năng nhượng việc sẽ cứu cánh cho bạn.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
          <ArrowRightLeft className="w-8 h-8" />
        </div>
      ),
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-violet-50/70 rounded-2xl border border-violet-100 space-y-1.5">
            <div className="font-bold text-violet-900 flex items-center space-x-1.5">
              <ArrowRightLeft className="w-4 h-4 text-violet-600" />
              <span>1. Gửi yêu cầu nhượng cho bạn phòng</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Chọn người bạn muốn nhờ làm hộ. Người đó bấm <strong>Đồng ý</strong> thì việc mới được chuyển giao chính thức.
            </p>
          </div>

          <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100 space-y-1.5 text-emerald-950">
            <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>2. Cơ chế làm bù công bằng (+1đ thưởng)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              • Người làm hộ nhận điểm việc hôm nay.<br />
              • Ở chu kỳ tới, hệ thống sẽ xếp bạn <strong>làm bù lại</strong> cho bạn ấy và thưởng thêm <strong>+1 điểm</strong> tinh thần!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      badge: 'Dân chủ',
      badgeColor: 'bg-blue-100 text-blue-700',
      title: 'Dân chủ phòng & Biểu quyết công khai 🗳️',
      headline: 'Không ai tự ý áp đặt luật lên người khác',
      description: 'Mọi thay đổi quan trọng trong phòng đều cần sự đồng thuận của tập thể qua cơ chế bỏ phiếu dân chủ.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Vote className="w-8 h-8" />
        </div>
      ),
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center space-x-1.5">
                <Vote className="w-4 h-4 text-indigo-600" />
                <span>Quy tắc biểu quyết quá bán</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                &gt; 50% tán thành
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Khi ai đó <strong>thêm việc mới</strong>, <strong>sửa lịch</strong> hoặc <strong>xóa việc</strong>, hệ thống sẽ mở biểu quyết để các thành viên cùng phòng bấm Đồng ý / Từ chối.
            </p>
          </div>

          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center space-x-3 text-[11px] text-blue-900">
            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-blue-950">Thông báo biểu quyết tức thì</div>
              <p className="text-slate-600">Khi có đề xuất mới, bạn sẽ nhận được thông báo để vào biểu quyết ngay.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      badge: 'Tính năng hay',
      badgeColor: 'bg-purple-100 text-purple-700',
      title: 'Lịch làm việc, Bảng nhiệt & Gửi Zalo 🚀',
      headline: 'Đầy đủ tiện ích cho cuộc sống tiện nghi',
      description: 'Theo dõi tiến độ dài hạn và gửi lời nhắc nhở nhẹ nhàng vào nhóm chat Zalo của phòng.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-200">
          <Calendar className="w-8 h-8" />
        </div>
      ),
      content: (
        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-start space-x-3">
            <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-950">Bảng nhiệt chăm chỉ (Heatmap)</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Xem ai chăm làm việc nhất qua từng ô màu xanh đậm nhạt tương tự GitHub.
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-start space-x-3">
            <div className="p-1.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-blue-950">1 chạm gửi nhắc việc vào Zalo</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Bấm nút "Gửi Zalo" ở trang chủ để tự động tạo tin nhắn phân công kèm mã phòng gửi vào nhóm chat!
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${currentStepData.badgeColor}`}>
              {currentStepData.badge} • {currentStep + 1}/{steps.length}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition flex items-center space-x-1 cursor-pointer"
            title="Đóng / Bỏ qua hướng dẫn"
          >
            <span>Bỏ qua</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Illustration & Title */}
          <div className="flex flex-col items-center text-center space-y-2">
            {currentStepData.icon}
            <div className="space-y-1 mt-1">
              <h3 className="text-base font-bold text-slate-900">
                {currentStepData.title}
              </h3>
              <p className="text-xs font-medium text-indigo-600">
                {currentStepData.headline}
              </p>
              <p className="text-[12px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Step Dynamic Content */}
          <div className="pt-1">
            {currentStepData.content}
          </div>
        </div>

        {/* Step Dots Indicator */}
        <div className="flex items-center justify-center space-x-1.5 py-2 border-t border-slate-100 bg-slate-50/50">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'w-6 bg-indigo-600'
                  : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Đi tới bước ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between space-x-3">
          {isFirstStep ? (
            <div className="text-[11px] text-slate-400 font-medium">
              Hướng dẫn nhanh 2 phút
            </div>
          ) : (
            <button
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center space-x-1.5 cursor-pointer shadow-md ${
              isLastStep
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200 flex-1 justify-center'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 ml-auto'
            }`}
          >
            <span>{isLastStep ? 'Bắt đầu trải nghiệm ngay! 🚀' : 'Tiếp tục'}</span>
            {!isLastStep && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
