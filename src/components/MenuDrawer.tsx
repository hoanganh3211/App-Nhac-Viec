import { X, Users, Home, LogOut, ChevronRight, Scale } from 'lucide-react';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomCode: string;
  currentMember?: { name: string; avatar: string };
  onOpenMembers: () => void;
  onOpenRoomModal: () => void;
  onRebalance?: () => void;
  onLeaveRoom: () => void;
  onLogout: () => void;
}

export function MenuDrawer({
  isOpen,
  onClose,
  roomName,
  currentMember,
  onOpenMembers,
  onOpenRoomModal,
  onRebalance,
  onLeaveRoom,
  onLogout,
}: MenuDrawerProps) {
  if (!isOpen) return null;

  const menuItems = [
    { label: 'Thành viên & Điểm số', icon: Users, onClick: onOpenMembers },
    ...(onRebalance ? [{ label: 'Tự động chia đều lại việc', icon: Scale, onClick: onRebalance }] : []),
    { label: 'Mã phòng & Mời bạn', icon: Home, onClick: onOpenRoomModal },
    { label: 'Đổi phòng', icon: LogOut, onClick: onLeaveRoom, danger: true },
    { label: 'Đăng xuất', icon: LogOut, onClick: onLogout, danger: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl pb-safe animate-in slide-in-from-bottom">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {currentMember && (
              <>
                <span className="text-2xl flex-shrink-0">{currentMember.avatar || '👤'}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{currentMember.name}</p>
                  <p className="text-xs text-slate-500">{roomName}</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Menu items */}
        <div className="px-3 pb-6 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); onClose(); }}
              className="flex items-center w-full gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <item.icon className={`w-5 h-5 ${item.danger ? 'text-rose-500' : 'text-slate-600'}`} />
              <span className={`flex-1 text-left text-sm font-medium ${item.danger ? 'text-rose-600' : 'text-slate-700'}`}>
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
