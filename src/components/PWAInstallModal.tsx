import React from 'react';
import { X, Smartphone, Share, PlusSquare, ArrowRight } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base">Cài Đặt App Ra Màn Hình Chính</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-700 text-xs leading-relaxed">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-900 font-medium">
            💡 Ứng dụng là <strong>Progressive Web App (PWA)</strong>: Bạn không cần tải từ App Store hay Google Play mà vẫn có biểu tượng app riêng biệt, mở lên tràn viền 100%!
          </div>

          {/* iOS Instructions */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center space-x-2 font-bold text-slate-800 text-sm">
              <span>🍎 Dành cho iPhone (iOS Safari):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-indigo-600 shrink-0">1.</span>
                <span>Mở link web này bằng trình duyệt <strong>Safari</strong>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-indigo-600 shrink-0">2.</span>
                <span className="flex items-center flex-wrap gap-1">
                  Bấm vào nút <strong>Chia sẻ (Share)</strong>
                  <Share className="w-3.5 h-3.5 inline text-blue-600" /> ở thanh dưới cùng Safari.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-indigo-600 shrink-0">3.</span>
                <span className="flex items-center flex-wrap gap-1">
                  Cuộn xuống chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>
                  <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-indigo-600 shrink-0">4.</span>
                <span>Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải. Xong! 🎉</span>
              </li>
            </ol>
          </div>

          {/* Android Instructions */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center space-x-2 font-bold text-slate-800 text-sm">
              <span>🤖 Dành cho Android (Google Chrome / Cốc Cốc):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-indigo-600 shrink-0">1.</span>
                <span>Mở link web này bằng trình duyệt <strong>Chrome</strong>.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-indigo-600 shrink-0">2.</span>
                <span>Bấm vào dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải màn hình.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-indigo-600 shrink-0">3.</span>
                <span>Chọn <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong>.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition flex items-center justify-center space-x-1.5 text-xs"
          >
            <span>Đã hiểu, quay lại màn hình chính</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
