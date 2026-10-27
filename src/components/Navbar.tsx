import React from 'react';
import { Plus, Sparkles, Menu } from 'lucide-react';

interface NavbarProps {
  roomName: string;
  onOpenAddChore: () => void;
  onOpenMenu: () => void;
  uncompletedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomName,
  onOpenAddChore,
  onOpenMenu,
  uncompletedCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 shadow-2xs">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: App Logo + Room Title + Badge */}
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

        {/* Right: Add Chore + Menu Drawer (All settings & user-switching inside Menu) */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={onOpenAddChore}
            title="Thêm việc mới"
            className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center space-x-1 text-xs font-bold shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[11px]">Thêm việc</span>
          </button>

          <button
            onClick={onOpenMenu}
            title="Menu chức năng"
            className="h-8 w-8 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
