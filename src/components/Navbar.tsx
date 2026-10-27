import React from 'react';
import { Share2, Plus, Users, Sparkles, History, Smartphone, Cloud, UserCheck } from 'lucide-react';
import { Member } from '../types';

interface NavbarProps {
  roomName: string;
  currentMember?: Member;
  onOpenUserSelect: () => void;
  onOpenAddChore: () => void;
  onOpenMembers: () => void;
  onOpenZaloReminder: () => void;
  onOpenHistory: () => void;
  onOpenPWA: () => void;
  onOpenCloudSync: () => void;
  isCloudConnected: boolean;
  uncompletedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomName,
  currentMember,
  onOpenUserSelect,
  onOpenAddChore,
  onOpenMembers,
  onOpenZaloReminder,
  onOpenHistory,
  onOpenPWA,
  onOpenCloudSync,
  isCloudConnected,
  uncompletedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 py-2.5 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Room & Identity info */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-slate-800 text-sm leading-tight truncate">
                {roomName}
              </h1>
              {uncompletedCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                  {uncompletedCount} việc
                </span>
              )}
            </div>

            {/* Current user badge */}
            <button
              onClick={onOpenUserSelect}
              className="flex items-center space-x-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {currentMember ? (
                <>
                  <span>{currentMember.avatar}</span>
                  <span className="truncate max-w-[100px]">{currentMember.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Đổi)</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3 h-3" />
                  <span className="underline">Chọn tôi là ai</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={onOpenCloudSync}
            title={isCloudConnected ? 'Cloud đã kết nối' : 'Đồng bộ Cloud'}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition relative"
          >
            <Cloud className="w-4 h-4" />
            <span
              className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                isCloudConnected ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
          </button>

          <button
            onClick={onOpenPWA}
            title="Cài app ra màn hình"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenHistory}
            title="Lịch sử làm việc"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenMembers}
            title="Thành viên phòng"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
          >
            <Users className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenZaloReminder}
            title="Bắn nhắc việc qua Zalo"
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm shadow-blue-200 transition"
          >
            <Share2 className="w-3 h-3" />
            <span>Zalo</span>
          </button>

          <button
            onClick={onOpenAddChore}
            title="Thêm việc mới"
            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-200 transition ml-0.5"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
