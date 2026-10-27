import React from 'react';
import { 
  X, 
  Users, 
  History, 
  Coins, 
  Cloud, 
  Smartphone, 
  ChevronRight
} from 'lucide-react';
import { Member } from '../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomCode: string;
  currentMember?: Member;
  isCloudConnected: boolean;
  onOpenUserSelect: () => void;
  onOpenMembers: () => void;
  onOpenHistory: () => void;
  onOpenPenalty: () => void;
  onOpenCloudSync: () => void;
  onOpenPWA: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  roomName,
  roomCode,
  currentMember,
  isCloudConnected,
  onOpenUserSelect,
  onOpenMembers,
  onOpenHistory,
  onOpenPenalty,
  onOpenCloudSync,
  onOpenPWA,
}) => {
  if (!isOpen) return null;

  const handleAction = (callback: () => void) => {
    onClose();
    callback();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">{roomName}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Mã phòng: {roomCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user chip banner */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">{currentMember?.avatar || '👤'}</span>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tài khoản trên máy này</div>
              <div className="text-xs font-bold text-slate-800">
                {currentMember ? currentMember.name : 'Chưa chọn danh tính'}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleAction(onOpenUserSelect)}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200/80 rounded-xl hover:bg-indigo-50 transition"
          >
            Đổi
          </button>
        </div>

        {/* Menu list */}
        <div className="p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => handleAction(onOpenMembers)}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Thành viên phòng</div>
                <div className="text-[11px] text-slate-400">Xem và thêm bớt bạn cùng phòng</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          <button
            onClick={() => handleAction(onOpenHistory)}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Lịch sử làm việc</div>
                <div className="text-[11px] text-slate-400">Nhật ký ai đã làm gì, lúc mấy giờ</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          <button
            onClick={() => handleAction(onOpenPenalty)}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Quỹ phạt vui vẻ</div>
                <div className="text-[11px] text-slate-400">Xem quỹ trà sữa từ tiền trễ hạn</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          <button
            onClick={() => handleAction(onOpenCloudSync)}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center relative">
                <Cloud className="w-4 h-4" />
                {isCloudConnected && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                  <span>Đồng bộ Cloud & Chia sẻ</span>
                  {isCloudConnected && (
                    <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full font-bold">
                      Đã nối
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">Gửi link phòng & Supabase Database</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          <button
            onClick={() => handleAction(onOpenPWA)}
            className="w-full p-3 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Cài app ra màn hình</div>
                <div className="text-[11px] text-slate-400">Hướng dẫn iPhone & Android</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>
        </div>
      </div>
    </div>
  );
};
