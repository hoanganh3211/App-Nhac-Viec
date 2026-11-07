import { Plus, Menu } from 'lucide-react';

interface NavbarProps {
  roomName: string;
  onOpenAddChore: () => void;
  onOpenMenu: () => void;
}

export function Navbar({ roomName, onOpenAddChore, onOpenMenu }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-slate-800 truncate">
          {roomName}
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenAddChore}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="Thêm việc"
          >
            <Plus className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={onOpenMenu}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>
    </nav>
  );
}
