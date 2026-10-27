import { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AppState, Chore, Member } from './types';
import { loadState, saveState, getNextAssignee } from './utils/storage';
import { playSuccessSound, playNudgeSound } from './utils/audio';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  checkAndNotifyMyChores 
} from './utils/notifications';
import { 
  getSupabaseConfig, 
  getSupabaseClient, 
  pushStateToCloud, 
  fetchStateFromCloud 
} from './utils/supabase';
import { Navbar } from './components/Navbar';
import { PersonalTaskBanner } from './components/PersonalTaskBanner';
import { ChoreCard } from './components/ChoreCard';
import { FairnessBoard } from './components/FairnessBoard';
import { AddChoreModal } from './components/AddChoreModal';
import { MemberManagerModal } from './components/MemberManagerModal';
import { ZaloReminderModal } from './components/ZaloReminderModal';
import { HistoryModal } from './components/HistoryModal';
import { PenaltyModal } from './components/PenaltyModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { UserSelectModal } from './components/UserSelectModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { shareToZalo } from './utils/zalo';

const CURRENT_USER_KEY = 'app_nhac_viec_current_user_id';

export function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_USER_KEY);
  });
  const [activeTab, setActiveTab] = useState<'my_chores' | 'all' | 'pending' | 'completed'>('my_chores');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );

  // Modals
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isZaloOpen, setIsZaloOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPenaltyOpen, setIsPenaltyOpen] = useState(false);
  const [isPWAOpen, setIsPWAOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  // Check URL query for room code (?room=xyz) on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam !== state.roomCode) {
      setState((prev) => ({ ...prev, roomCode: roomParam }));
      fetchStateFromCloud(roomParam).then((cloudState) => {
        if (cloudState) {
          setState(cloudState);
          showToast(`Đã kết nối vào phòng "${cloudState.roomName}"!`);
        }
      });
    }
  }, []);

  // Show user selection modal on first launch if not picked
  useEffect(() => {
    if (!currentUserId && state.members.length > 0) {
      setIsUserSelectOpen(true);
    }
  }, [currentUserId, state.members]);

  // Persist state to localStorage and push to Cloud
  useEffect(() => {
    saveState(state);
    pushStateToCloud(state);
  }, [state]);

  // Realtime subscription via Supabase if configured
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('room_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_states',
          filter: `room_code=eq.${state.roomCode}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).state_data) {
            const newState = (payload.new as any).state_data as AppState;
            setState(newState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.roomCode]);

  // Current logged in member
  const currentMember = useMemo(() => {
    return state.members.find((m) => m.id === currentUserId);
  }, [state.members, currentUserId]);

  // Targeted chores for current user
  const myChores = useMemo(() => {
    if (!currentUserId) return [];
    return state.chores.filter((c) => c.assignedTo === currentUserId);
  }, [state.chores, currentUserId]);

  // Periodic notification check (runs every 60s for current user's tasks ONLY)
  useEffect(() => {
    checkAndNotifyMyChores(state.chores, currentUserId, currentMember);
    const interval = setInterval(() => {
      checkAndNotifyMyChores(state.chores, currentUserId, currentMember);
    }, 60000);
    return () => clearInterval(interval);
  }, [state.chores, currentUserId, currentMember]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSelectUser = (id: string) => {
    setCurrentUserId(id);
    localStorage.setItem(CURRENT_USER_KEY, id);
    const member = state.members.find((m) => m.id === id);
    showToast(`Đã chọn bạn là: ${member?.name || 'Thành viên'}`);
  };

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      showToast('🔔 Đã bật thông báo nhắc việc của bạn thành công!');
      checkAndNotifyMyChores(state.chores, currentUserId, currentMember);
    } else {
      showToast('⚠️ Bạn chưa cấp quyền thông báo trên trình duyệt.');
    }
  };

  // Toggle chore completed
  const handleToggleComplete = (choreId: string) => {
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    const willBeCompleted = !targetChore.isCompletedToday;
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const assignee = state.members.find((m) => m.id === targetChore.assignedTo);

    if (willBeCompleted) {
      playSuccessSound();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });

      showToast(`🎉 Tuyệt vời! +${targetChore.points} điểm cho ${assignee?.name || 'bạn'}!`);
    }

    const updatedMembers = state.members.map((member) => {
      if (member.id === targetChore.assignedTo) {
        return {
          ...member,
          points: willBeCompleted
            ? member.points + targetChore.points
            : Math.max(0, member.points - targetChore.points),
          streak: willBeCompleted ? member.streak + 1 : Math.max(0, member.streak - 1),
        };
      }
      return member;
    });

    const updatedChores = state.chores.map((chore) => {
      if (chore.id === choreId) {
        return {
          ...chore,
          isCompletedToday: willBeCompleted,
          completedAt: willBeCompleted ? nowTimeStr : undefined,
          completedBy: willBeCompleted ? chore.assignedTo : undefined,
        };
      }
      return chore;
    });

    let updatedLogs = [...state.logs];
    if (willBeCompleted) {
      updatedLogs = [
        {
          id: 'log_' + Date.now(),
          choreId: targetChore.id,
          choreTitle: targetChore.title,
          memberId: targetChore.assignedTo,
          memberName: assignee?.name || 'Thành viên',
          completedAt: `Hôm nay lúc ${nowTimeStr}`,
          pointsEarned: targetChore.points,
        },
        ...state.logs,
      ];
    }

    setState((prev) => ({
      ...prev,
      members: updatedMembers,
      chores: updatedChores,
      logs: updatedLogs,
    }));
  };

  const handleRotateNext = (choreId: string) => {
    const chore = state.chores.find((c) => c.id === choreId);
    if (!chore) return;

    const nextId = getNextAssignee(chore.assignedTo, chore.rotationRule, state.members);
    const nextMember = state.members.find((m) => m.id === nextId);

    const updatedChores = state.chores.map((c) =>
      c.id === choreId ? { ...c, assignedTo: nextId } : c
    );

    setState((prev) => ({ ...prev, chores: updatedChores }));
    showToast(`Đã chuyển lượt "${chore.title}" cho ${nextMember?.name || 'người tiếp theo'}`);
  };

  const handleNudge = async (chore: Chore, assignee?: Member) => {
    playNudgeSound();
    const tag = assignee ? `@${assignee.zaloName || assignee.name}` : 'bạn';
    const text = `📢 [NHẮC VIỆC RIÊNG] Alo ${tag} ơi!\nĐến giờ làm việc "${chore.title}" rồi nè (${chore.dueTime}). Làm xong nhớ mở app tick nhé! 🧹\n🔗 ${window.location.origin}`;
    
    await shareToZalo(text);
    showToast(`Đã chuẩn bị lời nhắc cho ${assignee?.name}! Hãy dán vào Zalo nhé.`);
  };

  const handleAddChore = (newChoreData: Omit<Chore, 'id' | 'isCompletedToday'>) => {
    const newChore: Chore = {
      ...newChoreData,
      id: 'chore_' + Date.now(),
      isCompletedToday: false,
    };
    setState((prev) => ({
      ...prev,
      chores: [newChore, ...prev.chores],
    }));
    showToast(`Đã thêm việc "${newChore.title}" thành công!`);
  };

  const handleAddMember = (name: string, avatar: string, zaloName: string) => {
    const newMember: Member = {
      id: 'm_' + Date.now(),
      name,
      avatar,
      color: 'bg-indigo-500 text-white',
      points: 0,
      streak: 0,
      zaloName,
    };
    setState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
    handleSelectUser(newMember.id);
    showToast(`Đã thêm ${name} và chọn danh tính thành công!`);
  };

  const handleDeleteMember = (id: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
    if (currentUserId === id) {
      setCurrentUserId(null);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    showToast('Đã xóa thành viên khỏi phòng.');
  };

  const handleUpdateRoomName = (name: string) => {
    setState((prev) => ({ ...prev, roomName: name }));
    showToast('Đã cập nhật tên phòng!');
  };

  const handleAddPenalty = (memberId: string, amount: number, reason: string) => {
    const member = state.members.find((m) => m.id === memberId);
    const newPenalty = {
      id: 'pen_' + Date.now(),
      memberId,
      memberName: member?.name || 'Thành viên',
      amount,
      reason,
      date: new Date().toLocaleDateString('vi-VN'),
      status: 'pending' as const,
    };
    setState((prev) => ({
      ...prev,
      penalties: [newPenalty, ...prev.penalties],
    }));
    showToast(`Đã ghi phạt ${amount.toLocaleString('vi-VN')}đ vào quỹ phòng!`);
  };

  const handleMarkPaid = (id: string) => {
    setState((prev) => ({
      ...prev,
      penalties: prev.penalties.map((p) => (p.id === id ? { ...p, status: 'paid' } : p)),
    }));
    showToast('Đã ghi nhận nộp phạt vào quỹ phòng.');
  };

  // Filter chores
  const filteredChores = useMemo(() => {
    return state.chores.filter((chore) => {
      if (activeTab === 'my_chores') return chore.assignedTo === currentUserId;
      if (activeTab === 'pending') return !chore.isCompletedToday;
      if (activeTab === 'completed') return chore.isCompletedToday;
      return true; // 'all'
    });
  }, [state.chores, activeTab, currentUserId]);

  const uncompletedCount = state.chores.filter((c) => !c.isCompletedToday).length;
  const completedCount = state.chores.filter((c) => c.isCompletedToday).length;
  const myPendingCount = myChores.filter((c) => !c.isCompletedToday).length;

  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  const isCloudConnected = Boolean(getSupabaseConfig()?.url);

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        roomName={state.roomName}
        currentMember={currentMember}
        uncompletedCount={uncompletedCount}
        isCloudConnected={isCloudConnected}
        onOpenUserSelect={() => setIsUserSelectOpen(true)}
        onOpenAddChore={() => setIsAddChoreOpen(true)}
        onOpenMembers={() => setIsMembersOpen(true)}
        onOpenZaloReminder={() => setIsZaloOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPWA={() => setIsPWAOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
      />

      {/* Main Container */}
      <main className="p-4 space-y-4 flex-1">
        {/* Personal Task Highlight Banner (Targeted for THIS user) */}
        <PersonalTaskBanner
          currentMember={currentMember}
          myChores={myChores}
          onToggleComplete={handleToggleComplete}
          onRequestNotification={handleRequestNotification}
          notificationPermission={notificationPermission}
          onOpenUserSelect={() => setIsUserSelectOpen(true)}
        />

        {/* Date & Motivation */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center space-x-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="capitalize">{todayFormatted}</span>
          </div>

          <div className="flex items-center space-x-1 font-semibold text-slate-700">
            <span>Tiến độ chung:</span>
            <span className="text-indigo-600 font-bold">
              {completedCount}/{state.chores.length}
            </span>
            <span>việc</span>
          </div>
        </div>

        {/* Fairness & Karma Board */}
        <FairnessBoard
          members={state.members}
          penalties={state.penalties}
          onOpenPenaltyModal={() => setIsPenaltyOpen(true)}
        />

        {/* Filter Pills */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('my_chores')}
              className={`px-2.5 py-1.5 rounded-xl transition flex items-center space-x-1 shrink-0 ${
                activeTab === 'my_chores'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Của tôi ({myChores.length})</span>
              {myPendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1.5 rounded-xl transition shrink-0 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả phòng ({state.chores.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2.5 py-1.5 rounded-xl transition shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa xong ({uncompletedCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-2.5 py-1.5 rounded-xl transition shrink-0 ${
                activeTab === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã xong ({completedCount})
            </button>
          </div>

          <button
            onClick={() => setIsAddChoreOpen(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 shrink-0 ml-1"
          >
            <span>+ Việc</span>
          </button>
        </div>

        {/* Chores List */}
        <div className="space-y-3">
          {filteredChores.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-3xl border border-slate-200/80 space-y-2">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Không có việc nào ở mục này</h4>
              <p className="text-[11px] text-slate-500">
                {activeTab === 'my_chores'
                  ? 'Hôm nay bạn không có lịch việc nhà, hoặc đã hoàn thành hết!'
                  : 'Tất cả công việc đã được xử lý.'}
              </p>
            </div>
          ) : (
            filteredChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                members={state.members}
                onToggleComplete={handleToggleComplete}
                onNudge={handleNudge}
                onRotateNext={handleRotateNext}
              />
            ))
          )}
        </div>

        {/* PWA Promotion Callout */}
        <div
          onClick={() => setIsPWAOpen(true)}
          className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center justify-between cursor-pointer hover:border-indigo-200 transition"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Cài app trực tiếp không tốn phí</div>
              <div className="text-[11px] text-slate-500">
                Ghim ra màn hình iPhone / Android dùng mượt mà
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-600" />
        </div>
      </main>

      {/* Floating Bottom Quick Zalo Trigger */}
      <div className="fixed bottom-3 inset-x-0 max-w-md mx-auto px-4 z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={() => setIsZaloOpen(true)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            <span>Gửi Bảng Nhắc Việc Vào Nhóm Zalo</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 inset-x-0 max-w-xs mx-auto z-50 animate-in slide-in-from-top duration-200">
          <div className="p-3 bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium rounded-2xl shadow-xl text-center border border-white/10 flex items-center justify-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <UserSelectModal
        isOpen={isUserSelectOpen}
        onClose={() => setIsUserSelectOpen(false)}
        members={state.members}
        currentUserId={currentUserId}
        onSelectUser={handleSelectUser}
        onAddNewMember={handleAddMember}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        state={state}
        onApplyCloudState={(newState) => setState(newState)}
      />

      <AddChoreModal
        isOpen={isAddChoreOpen}
        onClose={() => setIsAddChoreOpen(false)}
        onAddChore={handleAddChore}
        members={state.members}
      />

      <MemberManagerModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        members={state.members}
        roomName={state.roomName}
        onUpdateRoomName={handleUpdateRoomName}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
      />

      <ZaloReminderModal
        isOpen={isZaloOpen}
        onClose={() => setIsZaloOpen(false)}
        roomName={state.roomName}
        chores={state.chores}
        members={state.members}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={state.logs}
      />

      <PenaltyModal
        isOpen={isPenaltyOpen}
        onClose={() => setIsPenaltyOpen(false)}
        penalties={state.penalties}
        members={state.members}
        onAddPenalty={handleAddPenalty}
        onMarkPaid={handleMarkPaid}
      />

      <PWAInstallModal
        isOpen={isPWAOpen}
        onClose={() => setIsPWAOpen(false)}
      />
    </div>
  );
}

export default App;
