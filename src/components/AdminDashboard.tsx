import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Home, 
  Users, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  KeyRound, 
  ExternalLink, 
  AlertTriangle, 
  ClipboardList, 
  Database,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { UserAccount } from '../types';
import { 
  getAllUsersForAdmin, 
  deleteUserAccount, 
  adminResetUserPin 
} from '../utils/auth';
import { 
  fetchAllRoomsForAdmin, 
  deleteRoomFromCloud, 
  deleteMemberFromCloudRoom, 
  clearAllCloudData, 
  CloudRoomData, 
  getSupabaseConfig 
} from '../utils/supabase';

interface AdminDashboardProps {
  adminUser: UserAccount;
  onLogout: () => void;
  onSwitchToApp: (targetRoomCode?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
  onSwitchToApp,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'users' | 'system'>('rooms');
  const [rooms, setRooms] = useState<CloudRoomData[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoomCode, setExpandedRoomCode] = useState<string | null>(null);

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit PIN modal
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Danger wipe
  const [isWiping, setIsWiping] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRooms, fetchedUsers] = await Promise.all([
        fetchAllRoomsForAdmin(),
        getAllUsersForAdmin(),
      ]);
      setRooms(fetchedRooms);
      setUsers(fetchedUsers);
    } catch (e) {
      console.error('Failed to load admin data', e);
      showToast('❌ Không thể tải dữ liệu từ Cloud Database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const q = searchQuery.toLowerCase().trim();
    return rooms.filter(
      (r) =>
        r.roomName.toLowerCase().includes(q) ||
        r.roomCode.toLowerCase().includes(q) ||
        r.members.some((m) => m.name.toLowerCase().includes(q))
    );
  }, [rooms, searchQuery]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.lastRoomCode && u.lastRoomCode.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  // Delete Room
  const handleDeleteRoom = async (roomCode: string, roomName: string) => {
    if (
      !window.confirm(
        `⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN phòng "${roomName}" (Mã: ${roomCode})?\n\nTất cả công việc và tiến độ trong phòng này sẽ bị xóa khỏi cơ sở dữ liệu.`
      )
    ) {
      return;
    }

    const res = await deleteRoomFromCloud(roomCode);
    if (res.success) {
      setRooms((prev) => prev.filter((r) => r.roomCode !== roomCode));
      showToast(`✓ Đã xóa phòng "${roomName}" thành công!`);
    } else {
      showToast(`❌ Xóa phòng thất bại: ${res.error || 'Lỗi kết nối'}`);
    }
  };

  // Delete Member from Room
  const handleDeleteMemberFromRoom = async (
    roomCode: string,
    memberId: string,
    memberName: string
  ) => {
    if (
      !window.confirm(
        `Xóa thành viên "${memberName}" khỏi phòng ${roomCode}? Các công việc của người này sẽ được chuyển cho người khác.`
      )
    ) {
      return;
    }

    const res = await deleteMemberFromCloudRoom(roomCode, memberId);
    if (res.success) {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.roomCode !== roomCode) return r;
          const updatedMembers = r.members.filter((m) => m.id !== memberId);
          return {
            ...r,
            members: updatedMembers,
            memberCount: updatedMembers.length,
          };
        })
      );
      showToast(`✓ Đã xóa "${memberName}" khỏi phòng ${roomCode}!`);
    } else {
      showToast(`❌ Xóa thành viên thất bại: ${res.error}`);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (user: UserAccount) => {
    if (user.role === 'admin' || user.username.toLowerCase() === 'admin') {
      alert('Không thể xóa tài khoản Quản trị viên!');
      return;
    }

    if (
      !window.confirm(
        `⚠️ Bạn có chắc muốn xóa tài khoản người dùng "${user.username}"?\nNgười này sẽ không thể đăng nhập được nữa.`
      )
    ) {
      return;
    }

    const res = await deleteUserAccount(user.id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`✓ Đã xóa tài khoản "${user.username}" thành công!`);
    } else {
      showToast(`❌ Xóa tài khoản thất bại: ${res.error}`);
    }
  };

  // Submit PIN change
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setPinError(null);

    if (!/^\d{6}$/.test(newPin.trim())) {
      setPinError('Mật khẩu PIN mới phải gồm đúng 6 chữ số!');
      return;
    }

    const res = await adminResetUserPin(editingUser.id, newPin.trim());
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, passwordPin: newPin.trim() } : u
        )
      );
      showToast(`✓ Đã đổi mật khẩu cho "${editingUser.username}" thành công!`);
      setEditingUser(null);
      setNewPin('');
    } else {
      setPinError(res.error || 'Đổi mật khẩu thất bại!');
    }
  };

  // Wipe Data for Release
  const handleWipeData = async () => {
    if (
      !window.confirm(
        '⚠️ NGUY HIỂM: Thao tác này sẽ xóa sạch TOÀN BỘ các phòng thử nghiệm và tài khoản (chỉ giữ lại admin) để release app!\n\nBạn có chắc chắn 100% muốn thực hiện?'
      )
    ) {
      return;
    }

    setIsWiping(true);
    try {
      const res = await clearAllCloudData();
      setIsWiping(false);
      if (res.success) {
        showToast('✓ Đã xóa sạch dữ liệu Cloud thành công!');
        loadAllData();
      } else {
        showToast(`❌ Xóa dữ liệu thất bại: ${res.error}`);
      }
    } catch (e: any) {
      setIsWiping(false);
      showToast(`❌ Lỗi: ${e?.message}`);
    }
  };

  const totalChoresCount = useMemo(() => {
    return rooms.reduce((sum, r) => sum + r.choreCount, 0);
  }, [rooms]);

  const supabaseCfg = getSupabaseConfig();
  const isCloudConnected = Boolean(supabaseCfg?.url && supabaseCfg?.anonKey);

  return (
    <div 
      className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)',
      }}
    >
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-2xl shadow-xl animate-in fade-in slide-in-from-top duration-150">
          {toastMessage}
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">Admin Dashboard</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  HỆ THỐNG
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Quản lý phòng trọ & tài khoản • Đang đăng nhập: <strong className="text-indigo-400">{adminUser.username}</strong>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={() => onSwitchToApp()}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              title="Vào giao diện ứng dụng phòng trọ"
            >
              <span>Vào App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
              title="Đăng xuất khỏi tài khoản Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full p-4 space-y-4 flex-1">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Rooms */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Tổng số phòng</div>
              <div className="text-xl font-extrabold text-white">{rooms.length}</div>
            </div>
          </div>

          {/* Card 2: Users */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Tài khoản</div>
              <div className="text-xl font-extrabold text-white">{users.length}</div>
            </div>
          </div>

          {/* Card 3: Chores */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">Công việc</div>
              <div className="text-xl font-extrabold text-white">{totalChoresCount}</div>
            </div>
          </div>

          {/* Card 4: Database Status */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-400">Database</div>
              <div className="text-xs font-bold flex items-center space-x-1.5 truncate">
                <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="truncate">{isCloudConnected ? 'Supabase' : 'Chỉ Local'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Phòng ({rooms.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Thành viên ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Hệ thống</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'system' && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'rooms' ? 'Tìm tên phòng, mã phòng...' : 'Tìm tên người dùng...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          )}
        </div>

        {/* TAB 1: ROOMS MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2 bg-slate-800/40 rounded-3xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Đang đồng bộ danh sách phòng từ Cloud...</span>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-3xl border border-slate-800 text-xs text-slate-400">
                {searchQuery ? 'Không tìm thấy phòng nào khớp với tìm kiếm.' : 'Chưa có phòng nào trong cơ sở dữ liệu.'}
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isExpanded = expandedRoomCode === room.roomCode;

                return (
                  <div
                    key={room.roomCode}
                    className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 transition space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm">{room.roomName}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[11px] font-bold flex items-center space-x-1">
                            <span>{room.roomCode}</span>
                            <button
                              onClick={() => handleCopyCode(room.roomCode)}
                              className="hover:text-white transition"
                              title="Copy mã phòng"
                            >
                              {copiedCode === room.roomCode ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                          <span>👥 {room.memberCount} thành viên</span>
                          <span>•</span>
                          <span>📋 {room.choreCount} công việc</span>
                          <span>•</span>
                          <span>🕒 {new Date(room.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onSwitchToApp(room.roomCode)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                          title="Vào phòng này"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Vào</span>
                        </button>

                        <button
                          onClick={() => setExpandedRoomCode(isExpanded ? null : room.roomCode)}
                          className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteRoom(room.roomCode, room.roomName)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                          title="Xóa vĩnh viễn phòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Members Avatar Preview Bar */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-700/50">
                      <span className="text-[11px] text-slate-400">Thành viên:</span>
                      <div className="flex items-center -space-x-1.5 overflow-hidden">
                        {room.members.map((m) => (
                          <div
                            key={m.id}
                            className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs"
                            title={m.name}
                          >
                            {m.avatar || '👤'}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-300 font-medium">
                        {room.members.map((m) => m.name).join(', ') || 'Chưa có thành viên'}
                      </span>
                    </div>

                    {/* Expanded Details Drawer */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-700/60 space-y-3 animate-in fade-in duration-150">
                        {/* Member Detailed List */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Danh sách thành viên chi tiết ({room.members.length}):</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {room.members.map((member) => (
                              <div
                                key={member.id}
                                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <span className="text-xl shrink-0">{member.avatar || '👤'}</span>
                                  <div className="min-w-0">
                                    <div className="font-bold text-white truncate">{member.name}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {member.points} điểm • {member.streak} ngày • trễ: {member.lateViolations} lần
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    handleDeleteMemberFromRoom(room.roomCode, member.id, member.name)
                                  }
                                  className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                  title="Xóa người này khỏi phòng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Chores Detailed List */}
                        <div className="space-y-2 pt-1">
                          <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                            <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                            <span>Danh sách công việc trong phòng ({room.chores.length}):</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {room.chores.map((chore) => {
                              const assignee = room.members.find((m) => m.id === chore.assignedTo);
                              return (
                                <div
                                  key={chore.id}
                                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between font-bold text-white">
                                    <span className="truncate">
                                      {chore.icon} {chore.title}
                                    </span>
                                    <span className="text-amber-400 shrink-0 text-[10px] font-bold">
                                      +{chore.points}đ
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                                    <span>Giao: {assignee?.name || 'Chưa gán'}</span>
                                    <span>Hạn: {chore.dueTime}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2 bg-slate-800/40 rounded-3xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Đang tải danh sách người dùng...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-3xl border border-slate-800 text-xs text-slate-400">
                Không tìm thấy người dùng nào.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredUsers.map((user) => {
                  const isAdmin = user.role === 'admin' || user.username.toLowerCase() === 'admin';

                  return (
                    <div
                      key={user.id}
                      className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0 mr-2">
                        <span className="text-2xl shrink-0">{user.avatar || '👤'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs truncate">
                              {user.username}
                            </span>
                            {isAdmin && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-2 pt-0.5">
                            <span>PIN: ••••••</span>
                            {user.lastRoomCode && (
                              <>
                                <span>•</span>
                                <span>Phòng: <strong className="text-indigo-400">{user.lastRoomCode}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setNewPin('');
                            setPinError(null);
                          }}
                          className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Đổi mã PIN 6 số"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {!isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                            title="Xóa tài khoản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SYSTEM SETTINGS & DANGER ZONE */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            {/* Supabase Status Card */}
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-white text-sm">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Cơ Sở Dữ Liệu Supabase Cloud</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isCloudConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {isCloudConnected ? '✓ Đang Kết Nối' : 'Chưa Cấu Hình'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supabase giúp đồng bộ realtime tất cả các phòng và tài khoản giữa điện thoại Android, iPhone và máy tính web.
              </p>
              {supabaseCfg?.url && (
                <div className="p-2 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-300 truncate">
                  URL: {supabaseCfg.url}
                </div>
              )}
            </div>

            {/* Danger Zone: Wipe for Release */}
            <div className="p-4 bg-rose-950/30 rounded-2xl border border-rose-800/50 space-y-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Khu Vực Nguy Hiểm (Reset / Release App)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Xóa sạch toàn bộ các phòng và dữ liệu người dùng thử nghiệm trên Cloud Database để chuẩn bị phát hành ứng dụng (Release) cho người dùng thật. Tài khoản Admin gốc sẽ được bảo lưu.
              </p>
              <button
                type="button"
                disabled={isWiping}
                onClick={handleWipeData}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isWiping ? 'Đang xóa sạch dữ liệu...' : 'Xóa Toàn Bộ Dữ Liệu Thử Nghiệm Để Release'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Edit PIN Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-800 w-full max-w-sm rounded-3xl p-5 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Đổi Mật Khẩu PIN</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Đặt lại mã PIN 6 số mới cho tài khoản <strong className="text-white">{editingUser.username}</strong>:
            </p>

            <form onSubmit={handleSavePin} className="space-y-3">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="Nhập 6 số mới (VD: 123456)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {pinError && (
                <div className="text-rose-400 text-xs text-center font-medium">
                  {pinError}
                </div>
              )}

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Lưu PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
