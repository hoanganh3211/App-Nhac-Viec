import React from 'react';
import { Plus, Sparkles, Menu } from 'lucide-react';
import { Member } from '../types';

interface NavbarProps {
  roomName: string;
  currentMember?: Member;
  onOpenUserSelect: () => void;
  onOpenAddChore: () => void;
  onOpenMenu: () => void;
  isCloudConnected: boolean;
  uncompletedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomName,
  currentMember,
  onOpenUserSelect,
  onOpenAddChore,
  onOpenMenu,
  isCloudConnected,
  uncompletedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 shadow-2xs">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: App Logo + Single-line Room Title + Compact Badge */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="flex items-center space-x-1.5 min-w-0">
            <h1 className="font-bold text-slate-800 text-sm truncate whitespace-nowrap">
              {roomName}
            </h1>
            {uncompletedCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 shrink-0 whitespace-nowrap leading-none">
                {uncompletedCount} việc
              </span>
            )}
          </div>
        </div>

        {/* Right: User Chip + Add Chore + Menu Drawer */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* User selector chip */}
          <button
            onClick={onOpenUserSelect}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 transition max-w-[110px]"
            title="Bấm để đổi người dùng"
          >
            <span className="text-sm shrink-0">{currentMember?.avatar || '👤'}</span>
            <span className="truncate text-[11px]">
              {currentMember ? currentMember.name.split(' ').pop() : 'Chọn tôi'}
            </span>
          </button>

          {/* Add Chore Button */}
          <button
            onClick={onOpenAddChore}
            title="Thêm việc mới"
            className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1 text-xs font-bold shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline text-[11px]">Thêm</span>
          </button>

          {/* More Menu Drawer Trigger */}
          <button
            onClick={onOpenMenu}
            title="Menu cài đặt & chức năng"
            className="h-8 w-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition relative shrink-0"
          >
            <Menu className="w-4 h-4" />
            {isCloudConnected && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
