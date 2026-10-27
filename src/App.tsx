import { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Share2, 
  UserCheck
} from 'lucide-react';
import { AppState, Chore, Member, TransferRequest } from './types';
import { loadState, saveState, getNextAssignee } from './utils/storage';
import { playSuccessSound, playNudgeSound } from './utils/audio';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  checkAndNotifyMyChores 
} from './utils/notifications';
import { 
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
import { RulesModal } from './components/RulesModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { UserSelectModal } from './components/UserSelectModal';
import { MenuDrawer } from './components/MenuDrawer';
import { TransferChoreModal } from './components/TransferChoreModal';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isZaloOpen, setIsZaloOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isPWAOpen, setIsPWAOpen] = useState(false);
  const [transferTargetChore, setTransferTargetChore] = useState<Chore | null>(null);

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

  // Persist state to localStorage and push silently to Cloud
  useEffect(() => {
    saveState(state);
    pushStateToCloud(state);
  }, [state]);

  // Realtime subscription via Supabase if configured by dev
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

  // Incoming transfer requests for current user
  const incomingTransferRequests = useMemo(() => {
    if (!currentUserId) return [];
    return (state.transferRequests || []).filter(
      (req) => req.toMemberId === currentUserId && req.status === 'pending'
    );
  }, [state.transferRequests, currentUserId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Check Overdue and Apply Late Penalties (Quy tắc trừ điểm trễ & tái phạm)
  const checkOverduePenalties = useCallback(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let hasPenaltyApplied = false;
    let updatedMembers = [...state.members];
    let updatedLogs = [...state.logs];

    const updatedChores = state.chores.map((chore) => {
      if (chore.isCompletedToday || chore.isLatePenalized) return chore;

      const [dueH, dueM] = chore.dueTime.split(':').map(Number);
      const dueMinutes = dueH * 60 + dueM;

      // Past due
      if (currentMinutes > dueMinutes) {
        const assignee = updatedMembers.find((m) => m.id === chore.assignedTo);
        if (!assignee) return chore;

        // Deduction rule:
        // Lần đầu: trừ số điểm của việc.
        // Tái phạm: trừ (điểm hiện tại của việc + 2)!
        const penaltyPoints =
          assignee.lateViolations > 0 ? chore.points + 2 : chore.points;

        updatedMembers = updatedMembers.map((m) =>
          m.id === assignee.id
            ? {
                ...m,
                points: m.points - penaltyPoints,
                lateViolations: m.lateViolations + 1,
                streak: 0,
              }
            : m
        );

        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        updatedLogs = [
          {
            id: 'log_late_' + Date.now() + '_' + chore.id,
            choreId: chore.id,
            choreTitle: chore.title,
            memberId: assignee.id,
            memberName: assignee.name,
            completedAt: `Hôm nay ${timeStr}`,
            pointsEarned: -penaltyPoints,
            type: 'late_penalty',
            note:
              assignee.lateViolations > 0
                ? `Tái phạm trễ hạn (-(điểm việc + 2))`
                : `Trễ hạn việc nhà`,
          },
          ...updatedLogs,
        ];

        hasPenaltyApplied = true;
        showToast(`⚠️ ${assignee.name} bị trừ ${penaltyPoints}đ do trễ "${chore.title}"!`);

        return {
          ...chore,
          isLatePenalized: true,
        };
      }
      return chore;
    });

    if (hasPenaltyApplied) {
      setState((prev) => ({
        ...prev,
        members: updatedMembers,
        chores: updatedChores,
        logs: updatedLogs,
      }));
    }
  }, [state.chores, state.members, state.logs]);

  // Periodic checks (notifications + late penalty checks every 60s)
  useEffect(() => {
    checkAndNotifyMyChores(state.chores, currentUserId, currentMember);
    checkOverduePenalties();
    const interval = setInterval(() => {
      checkAndNotifyMyChores(state.chores, currentUserId, currentMember);
      checkOverduePenalties();
    }, 60000);
    return () => clearInterval(interval);
  }, [state.chores, currentUserId, currentMember, checkOverduePenalties]);

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
      showToast('🔔 Đã bật thông báo việc của bạn thành công!');
      checkAndNotifyMyChores(state.chores, currentUserId, currentMember);
    } else {
      showToast('⚠️ Bạn chưa cấp quyền thông báo trên trình duyệt.');
    }
  };

  // Toggle chore completed (Hoàn thành việc & Cộng điểm / Thưởng hoàn trả)
  const handleToggleComplete = (choreId: string) => {
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    const willBeCompleted = !targetChore.isCompletedToday;
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const assignee = state.members.find((m) => m.id === targetChore.assignedTo);

    // Calculate reward points:
    // If nextBonusPoints exists (do trước đó từng nhượng việc): thưởng (điểm việc + 1)
    const earnedPoints = targetChore.nextBonusPoints || targetChore.points;

    if (willBeCompleted) {
      playSuccessSound();
      confetti({
        particleCount: 65,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });

      const bonusMsg = targetChore.nextBonusPoints
        ? ` (Đã cộng thêm +1đ thưởng hoàn trả!)`
        : '';
      showToast(`🎉 +${earnedPoints} điểm cho ${assignee?.name || 'bạn'}!${bonusMsg}`);
    }

    const updatedMembers = state.members.map((member) => {
      if (member.id === targetChore.assignedTo) {
        return {
          ...member,
          points: willBeCompleted
            ? member.points + earnedPoints
            : member.points - earnedPoints,
          streak: willBeCompleted ? member.streak + 1 : Math.max(0, member.streak - 1),
          // Giảm vi phạm trễ nếu làm đúng hạn
          lateViolations: willBeCompleted
            ? Math.max(0, member.lateViolations - 1)
            : member.lateViolations,
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
          nextBonusPoints: willBeCompleted ? undefined : chore.nextBonusPoints,
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
          completedAt: `Hôm nay ${nowTimeStr}`,
          pointsEarned: earnedPoints,
          type: targetChore.nextBonusPoints ? 'recovery_bonus' : 'completed',
          note: targetChore.nextBonusPoints ? 'Thưởng hoàn trả (+1đ)' : undefined,
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

  // Cơ chế nhượng việc: Khởi tạo gửi lời mời nhượng việc
  const handleInitiateTransfer = (chore: Chore, targetMemberId: string) => {
    if (!currentMember) return;
    const targetMember = state.members.find((m) => m.id === targetMemberId);
    if (!targetMember) return;

    const newRequest: TransferRequest = {
      id: 'req_' + Date.now(),
      choreId: chore.id,
      choreTitle: chore.title,
      choreIcon: chore.icon,
      chorePoints: chore.points,
      fromMemberId: currentMember.id,
      fromMemberName: currentMember.name,
      toMemberId: targetMember.id,
      toMemberName: targetMember.name,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setState((prev) => ({
      ...prev,
      transferRequests: [newRequest, ...(prev.transferRequests || [])],
    }));

    showToast(`Đã gửi lời mời nhượng việc "${chore.title}" cho ${targetMember.name}!`);
  };

  // Người nhận: Đồng ý nhận việc (Người nhượng mất điểm, Người nhận được gán việc)
  const handleAcceptTransfer = (requestId: string) => {
    const req = (state.transferRequests || []).find((r) => r.id === requestId);
    if (!req) return;

    const chore = state.chores.find((c) => c.id === req.choreId);
    if (!chore) return;

    const fromMember = state.members.find((m) => m.id === req.fromMemberId);
    const toMember = state.members.find((m) => m.id === req.toMemberId);

    // 1. Trừ điểm người nhượng (mất cơ số điểm đó)
    const updatedMembers = state.members.map((m) => {
      if (m.id === req.fromMemberId) {
        return {
          ...m,
          points: m.points - req.chorePoints,
        };
      }
      return m;
    });

    // 2. Chuyển việc cho người nhận, lưu originalAssignee để chu kỳ sau hoàn trả lại
    const updatedChores = state.chores.map((c) => {
      if (c.id === req.choreId) {
        return {
          ...c,
          assignedTo: req.toMemberId,
          originalAssignee: req.fromMemberId, // Lưu để hoàn trả ở lượt sau
          nextBonusPoints: c.points + 1, // Lượt sau người nhượng làm lại được (điểm + 1)
        };
      }
      return c;
    });

    // 3. Ghi log phí nhượng việc
    const updatedLogs: typeof state.logs = [
      {
        id: 'log_trans_' + Date.now(),
        choreId: req.choreId,
        choreTitle: req.choreTitle,
        memberId: req.fromMemberId,
        memberName: fromMember?.name || 'Người nhượng',
        completedAt: `Hôm nay ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        pointsEarned: -req.chorePoints,
        type: 'transfer_fee',
        note: `Nhượng việc cho ${toMember?.name || 'bạn cùng phòng'}`,
      },
      ...state.logs,
    ];

    // 4. Cập nhật request status
    const updatedRequests = (state.transferRequests || []).map((r) =>
      r.id === requestId ? { ...r, status: 'accepted' as const } : r
    );

    setState((prev) => ({
      ...prev,
      members: updatedMembers,
      chores: updatedChores,
      logs: updatedLogs,
      transferRequests: updatedRequests,
    }));

    showToast(`Bạn đã nhận việc "${req.choreTitle}". Hoàn thành sẽ được +${req.chorePoints}đ!`);
  };

  // Người nhận: Từ chối nhận việc
  const handleDeclineTransfer = (requestId: string) => {
    const req = (state.transferRequests || []).find((r) => r.id === requestId);
    const updatedRequests = (state.transferRequests || []).map((r) =>
      r.id === requestId ? { ...r, status: 'declined' as const } : r
    );

    setState((prev) => ({
      ...prev,
      transferRequests: updatedRequests,
    }));

    showToast(`Đã từ chối nhận việc "${req?.choreTitle}".`);
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
    showToast(`Đã chuyển việc cho ${nextMember?.name || 'người tiếp theo'}`);
  };

  const handleNudge = async (chore: Chore, assignee?: Member) => {
    playNudgeSound();
    const tag = assignee ? `@${assignee.zaloName || assignee.name}` : 'bạn';
    const text = `📢 [NHẮC VIỆC RIÊNG] Alo ${tag} ơi!\nĐến giờ làm "${chore.title}" rồi nè (${chore.dueTime}). Quá giờ sẽ bị trừ -${chore.points}đ đó nha! 🧹\n🔗 ${window.location.origin}`;
    
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
    showToast(`Đã thêm việc "${newChore.title}" (+${newChore.points}đ)!`);
  };

  const handleAddMember = (name: string, avatar: string, zaloName: string) => {
    const newMember: Member = {
      id: 'm_' + Date.now(),
      name,
      avatar,
      color: 'bg-indigo-500 text-white',
      points: 0,
      streak: 0,
      lateViolations: 0,
      zaloName,
    };
    setState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
    }));
    handleSelectUser(newMember.id);
    showToast(`Đã thêm ${name} vào phòng!`);
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
    showToast('Đã xóa thành viên.');
  };

  const handleUpdateRoomName = (name: string) => {
    setState((prev) => ({ ...prev, roomName: name }));
    showToast('Đã cập nhật tên phòng!');
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

  return (
    <div 
      className="min-h-screen max-w-md mx-auto relative bg-slate-50 flex flex-col font-sans"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 5rem)',
      }}
    >
      {/* Sleek Top Header */}
      <Navbar
        roomName={state.roomName}
        uncompletedCount={uncompletedCount}
        onOpenAddChore={() => setIsAddChoreOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* Main Content */}
      <main className="p-3.5 space-y-3.5 flex-1">
        {/* Personalized Task Highlight Banner & Incoming Transfer Alert */}
        <PersonalTaskBanner
          currentMember={currentMember}
          myChores={myChores}
          incomingRequests={incomingTransferRequests}
          onToggleComplete={handleToggleComplete}
          onRequestNotification={handleRequestNotification}
          notificationPermission={notificationPermission}
          onOpenUserSelect={() => setIsUserSelectOpen(true)}
          onOpenTransfer={(chore) => setTransferTargetChore(chore)}
          onAcceptTransfer={handleAcceptTransfer}
          onDeclineTransfer={handleDeclineTransfer}
        />

        {/* Date & Quick Progress */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center space-x-1.5 font-medium truncate">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="capitalize truncate">{todayFormatted}</span>
          </div>

          <div className="flex items-center space-x-1 font-semibold text-slate-700 shrink-0 whitespace-nowrap">
            <span>Tiến độ:</span>
            <span className="text-indigo-600 font-bold">
              {completedCount}/{state.chores.length}
            </span>
          </div>
        </div>

        {/* Fairness & Karma Board (Điểm tích lũy & Quy tắc trừ điểm) */}
        <FairnessBoard members={state.members} />

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-200/70 p-1 rounded-2xl text-xs font-semibold overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('my_chores')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1 shrink-0 whitespace-nowrap ${
              activeTab === 'my_chores'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Của tôi ({myChores.length})</span>
            {myPendingCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cả phòng ({state.chores.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chưa xong ({uncompletedCount})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-xl transition shrink-0 whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã xong ({completedCount})
          </button>
        </div>

        {/* Chores List */}
        <div className="space-y-2.5">
          {filteredChores.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Không có việc nào ở mục này</h4>
              <p className="text-[11px] text-slate-500">
                {activeTab === 'my_chores'
                  ? 'Hôm nay bạn không có việc nhà, hoặc đã hoàn thành hết!'
                  : 'Tất cả công việc đã được hoàn tất.'}
              </p>
            </div>
          ) : (
            filteredChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                members={state.members}
                currentUserId={currentUserId}
                onToggleComplete={handleToggleComplete}
                onNudge={handleNudge}
                onRotateNext={handleRotateNext}
                onOpenTransfer={(c) => setTransferTargetChore(c)}
              />
            ))
          )}
        </div>
      </main>

      {/* Floating Bottom Quick Zalo Trigger */}
      <div 
        className="fixed inset-x-0 max-w-md mx-auto px-4 z-20 pointer-events-none"
        style={{ bottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        <div className="pointer-events-auto">
          <button
            onClick={() => setIsZaloOpen(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            <span>Gửi Bảng Nhắc Việc Vào Nhóm Zalo</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 inset-x-0 max-w-xs mx-auto z-50 animate-in slide-in-from-top duration-200">
          <div className="p-2.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium rounded-xl shadow-xl text-center border border-white/10 flex items-center justify-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        roomName={state.roomName}
        roomCode={state.roomCode}
        currentMember={currentMember}
        onOpenUserSelect={() => setIsUserSelectOpen(true)}
        onOpenMembers={() => setIsMembersOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenPWA={() => setIsPWAOpen(true)}
      />

      {/* Transfer Chore Modal (Nhượng việc) */}
      <TransferChoreModal
        isOpen={Boolean(transferTargetChore)}
        onClose={() => setTransferTargetChore(null)}
        chore={transferTargetChore}
        currentMember={currentMember}
        members={state.members}
        onConfirmTransfer={handleInitiateTransfer}
      />

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* User Select Modal */}
      <UserSelectModal
        isOpen={isUserSelectOpen}
        onClose={() => setIsUserSelectOpen(false)}
        members={state.members}
        currentUserId={currentUserId}
        onSelectUser={handleSelectUser}
        onAddNewMember={handleAddMember}
      />

      {/* Add Chore Modal */}
      <AddChoreModal
        isOpen={isAddChoreOpen}
        onClose={() => setIsAddChoreOpen(false)}
        onAddChore={handleAddChore}
        members={state.members}
      />

      {/* Member Manager Modal */}
      <MemberManagerModal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        members={state.members}
        roomName={state.roomName}
        onUpdateRoomName={handleUpdateRoomName}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
      />

      {/* Zalo Reminder Modal */}
      <ZaloReminderModal
        isOpen={isZaloOpen}
        onClose={() => setIsZaloOpen(false)}
        roomName={state.roomName}
        chores={state.chores}
        members={state.members}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={state.logs}
      />

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAOpen}
        onClose={() => setIsPWAOpen(false)}
      />
    </div>
  );
}

export default App;
