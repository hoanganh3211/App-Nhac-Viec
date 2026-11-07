import { Plus, Menu, Bell, BellOff } from 'lucide-react';

interface NavbarProps {
  roomName: string;
  onOpenAddChore: () => void;
  onOpenMenu: () => void;
  isNotificationEnabled?: boolean;
  onToggleNotification?: () => void;
}

export function Navbar({
  roomName,
  onOpenAddChore,
  onOpenMenu,
  isNotificationEnabled = false,
  onToggleNotification,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-slate-200 shadow-2xs">
      <div className="max-w-md mx-auto flex items-center justify-between px-3.5 h-14">
        <h1 className="text-base font-bold text-slate-800 truncate pr-2">
          {roomName}
        </h1>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleNotification && (
            <button
              onClick={onToggleNotification}
              className={`p-2 rounded-xl transition cursor-pointer relative ${
                isNotificationEnabled
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={
                isNotificationEnabled
                  ? 'Đã bật chuông & thông báo đẩy (Bấm để thử chuông)'
                  : 'Bấm để bật chuông & thông báo nhắc việc'
              }
              aria-label="Thông báo và chuông"
            >
              {isNotificationEnabled ? (
                <>
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenAddChore}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer"
            aria-label="Thêm việc"
            title="Thêm việc mới"
          >
            <Plus className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            onClick={onOpenMenu}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer"
            aria-label="Menu"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
