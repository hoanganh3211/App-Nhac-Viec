import React from 'react';
import { 
  X, 
  Users, 
  History, 
  Smartphone, 
  ChevronRight,
  Sparkles,
  Scale,
  Home,
  LogOut,
  Bell,
  ClipboardList,
  Calendar,
  BookOpen,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Member } from '../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomCode: string;
  currentMember?: Member;
  isAdmin?: boolean;
  onOpenAdminDashboard?: () => void;
  onOpenMembers: () => void;
  onOpenChoreManager: () => void;
  onOpenSchedule: () => void;
  onOpenNotificationSettings: () => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
  onOpenTutorial: () => void;
  onOpenPWA: () => void;
  onOpenRoomModal: () => void;
  onLeaveRoom: () => void;
  onLogout: () => void;
  syncStatus?: 'idle' | 'syncing' | 'connected' | 'error' | 'offline';
  lastSyncTime?: Date | null;
  onManualSync?: () => void;
  onRebalance?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  roomName,
  roomCode,
  currentMember,
  isAdmin,
  onOpenAdminDashboard,
  onOpenMembers,
  onOpenChoreManager,
  onOpenSchedule,
  onOpenNotificationSettings,
  onOpenHistory,
  onOpenRules,
  onOpenTutorial,
  onOpenPWA,
  onOpenRoomModal,
  onLeaveRoom,
  onLogout,
  syncStatus = 'connected',
  lastSyncTime,
  onManualSync,
  onRebalance,
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

        {/* Header with Room Info */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">{roomName}</h3>
            <p className="text-[11px] text-slate-400 font-mono">Mã phòng: <strong className="text-indigo-600">{roomCode}</strong></p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user & Logout button */}
        <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 mr-2">
            <span className="text-2xl shrink-0">{currentMember?.avatar || '👤'}</span>
            <div className="min-w-0">
              <div className="text-[10px] text-indigo-900/70 font-semibold uppercase">Đang đăng nhập:</div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {currentMember ? currentMember.name : 'Người dùng'}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleAction(onLogout)}
            className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 shadow-2xs transition shrink-0 whitespace-nowrap flex items-center space-x-1 cursor-pointer"
            title="Đăng xuất khỏi tài khoản"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-3 space-y-1 overflow-y-auto">
          {/* Cloud Realtime Sync Status & Manual Sync Button */}
          {onManualSync && (
            <button
              onClick={() => handleAction(onManualSync)}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-violet-50/50 hover:from-indigo-100 hover:to-violet-100 border border-indigo-100 flex items-center justify-between text-left transition group cursor-pointer mb-2"
              title="Bấm để đồng bộ dữ liệu đám mây ngay lập tức"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
                  syncStatus === 'syncing' ? 'bg-indigo-600 text-white animate-spin' :
                  syncStatus === 'offline' || syncStatus === 'error' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>Đồng bộ Cloud Realtime</span>
                    {syncStatus === 'connected' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                        Đang kết nối
                      </span>
                    )}
                    {(syncStatus === 'offline' || syncStatus === 'error') && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                        Chưa kết nối
                      </span>
                    )}
                    {syncStatus === 'syncing' && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-md border border-indigo-200 animate-pulse">
                        Đang đồng bộ...
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {syncStatus === 'syncing' ? 'Đang tải dữ liệu từ máy chủ...' :
                     lastSyncTime ? `Lần cuối: ${lastSyncTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` :
                     'Bấm để ép làm mới & kéo dữ liệu mới nhất'}
                  </div>
                </div>
              </div>
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition shrink-0" />
            </button>
          )}

          {/* Admin Dashboard (chỉ hiện khi là tài khoản Admin) */}
          {isAdmin && onOpenAdminDashboard && (
            <button
              onClick={() => handleAction(onOpenAdminDashboard)}
              className="w-full p-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-between text-left transition group cursor-pointer shadow-md mb-1.5"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Bảng Quản Trị Hệ Thống (Admin)</span>
                  </div>
                  <div className="text-[11px] text-slate-300">Quản lý các phòng & tất cả thành viên</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
            </button>
          )}

          {/* Room Management (Mã phòng / Link mời / Tạo phòng) */}
          <button
            onClick={() => handleAction(onOpenRoomModal)}
            className="w-full p-2.5 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/80 flex items-center justify-between text-left transition group border border-indigo-100"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                  <span>Mã phòng & Mời bạn ({roomCode})</span>
                </div>
                <div className="text-[11px] text-indigo-700/80">Copy link mời hoặc tạo phòng mới</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition" />
          </button>

          {/* Members manager */}
          <button
            onClick={() => handleAction(onOpenMembers)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Thành viên & Cài đặt phòng</div>
                <div className="text-[11px] text-slate-400">Xem danh sách, thêm/xóa người ở chung</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* Chore Manager */}
          <button
            onClick={() => handleAction(onOpenChoreManager)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Quản lý danh sách việc</div>
                <div className="text-[11px] text-slate-400">Xem danh sách, sửa hoặc xóa việc phòng</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* Rebalance Chores */}
          {onRebalance && (
            <button
              onClick={() => handleAction(onRebalance)}
              className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
                    <span>Tự động chia đều lại việc</span>
                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-full">
                      Thuật toán
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Cân bằng lại tải trọng việc cho mọi người</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
            </button>
          )}

          {/* Schedule & Activity Timeline */}
          <button
            onClick={() => handleAction(onOpenSchedule)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Lịch & Tiến độ làm việc</div>
                <div className="text-[11px] text-slate-400">Xem theo tuần, tháng & bảng hoạt động</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* Push Notification Settings */}
          <button
            onClick={() => handleAction(onOpenNotificationSettings)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Cài đặt thông báo đẩy</div>
                <div className="text-[11px] text-slate-400">Giờ nhắc hôm nay, mai & cảnh báo sát hạn</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* History */}
          <button
            onClick={() => handleAction(onOpenHistory)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Lịch sử làm việc & Điểm</div>
                <div className="text-[11px] text-slate-400">Nhật ký hoàn thành, trừ điểm trễ</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* Rules */}
          <button
            onClick={() => handleAction(onOpenRules)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Quy tắc điểm & Nhượng việc</div>
                <div className="text-[11px] text-slate-400">Trừ điểm trễ, nhượng việc, hoàn trả +1đ</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* Tutorial */}
          <button
            onClick={() => handleAction(onOpenTutorial)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Hướng dẫn sử dụng (Tutorial)</div>
                <div className="text-[11px] text-slate-400">Xem lại các tính năng & mẹo dùng app</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* PWA guide */}
          <button
            onClick={() => handleAction(onOpenPWA)}
            className="w-full p-2.5 rounded-2xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Cài app ra màn hình</div>
                <div className="text-[11px] text-slate-400">Hướng dẫn cho iPhone & Android</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
          </button>

          {/* Leave / Switch Room */}
          <button
            onClick={() => handleAction(onLeaveRoom)}
            className="w-full p-2.5 rounded-2xl hover:bg-rose-50 text-rose-700 flex items-center justify-between text-left transition group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-800">Đổi sang phòng khác</div>
                <div className="text-[11px] text-rose-500/80">Quay về trang chào mừng / nhập mã</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-300 group-hover:text-rose-500 transition" />
          </button>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 flex items-center justify-center space-x-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>ViệcNhà • Tự động đồng bộ Realtime</span>
        </div>
      </div>
    </div>
  );
};
