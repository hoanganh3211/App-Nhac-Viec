import React from 'react';
import { Share2, Plus, Users, Sparkles, History, Smartphone } from 'lucide-react';

interface NavbarProps {
  roomName: string;
  onOpenAddChore: () => void;
  onOpenMembers: () => void;
  onOpenZaloReminder: () => void;
  onOpenHistory: () => void;
  onOpenPWA: () => void;
  uncompletedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomName,
  onOpenAddChore,
  onOpenMembers,
  onOpenZaloReminder,
  onOpenHistory,
  onOpenPWA,
  uncompletedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-slate-800 text-base leading-tight tracking-tight">
                {roomName}
              </h1>
              {uncompletedCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-bounce">
                  {uncompletedCount} việc
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Xoay việc công bằng • Sống hoà thuận
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenPWA}
            title="Cài app ra màn hình"
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
          >
            <Smartphone className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenHistory}
            title="Lịch sử làm việc"
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
          >
            <History className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenMembers}
            title="Thành viên phòng"
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenZaloReminder}
            title="Bắn nhắc việc qua Zalo"
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm shadow-blue-200 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Zalo</span>
          </button>

          <button
            onClick={onOpenAddChore}
            title="Thêm việc mới"
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-200 transition ml-1"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
