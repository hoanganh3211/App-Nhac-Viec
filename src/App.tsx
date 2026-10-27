import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Share2, 
  UserCheck
} from 'lucide-react';
import { AppState, Chore, Member, TransferRequest, ChoreLog, RoomProposal, AppNotification } from './types';
import { loadState, saveState, getTodayDateString, autoBalanceChores, handleDayRollover, isChoreScheduledToday } from './utils/storage';
import { playSuccessSound, playNudgeSound } from './utils/audio';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  checkAndNotifyMyChores,
  checkAndPushRemoteNotifications
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
import { MenuDrawer } from './components/MenuDrawer';
import { TransferChoreModal } from './components/TransferChoreModal';
import { RoomModal } from './components/RoomModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { 
  getCurrentAuthUser, 
  logoutAccount, 
  updateUserRoom, 
  getPendingRoomInvite, 
  setPendingRoomInvite 
} from './utils/auth';
import { UserAccount } from './types';
import { ChoreRecommendationModal } from './components/ChoreRecommendationModal';
import { ChoreDetailModal } from './components/ChoreDetailModal';
import { RequestRedoModal } from './components/RequestRedoModal';
import { ProposalVoteCard } from './components/ProposalVoteCard';
import { NotificationModal } from './components/NotificationModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { ChoreManagerModal } from './components/ChoreManagerModal';
import { ChoreScheduleModal } from './components/ChoreScheduleModal';
import { shareToZalo } from './utils/zalo';

const HAS_ROOM_KEY = 'app_nhac_viec_has_active_room';

export function App() {
  // 1. Authenticated User State
  const [authUser, setAuthUser] = useState<UserAccount | null>(() => getCurrentAuthUser());

  // 2. Pending room code from URL query (?room=XYZ) or saved invite
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) return roomParam.trim().toUpperCase();
    return getPendingRoomInvite();
  });

  const [hasActiveRoom, setHasActiveRoom] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(HAS_ROOM_KEY));
  });

  const [state, setState] = useState<AppState>(loadState);

  // Authenticated Member in the room (matched by ID or username)
  const currentMember = useMemo(() => {
    if (!authUser) return undefined;
    return state.members.find(
      (m) => m.id === authUser.id || m.name.toLowerCase() === authUser.username.toLowerCase()
    );
  }, [state.members, authUser]);

  const currentUserId = currentMember?.id || authUser?.id || null;

  // Anti-loop and anti-flicker refs
  const stateRef = useRef(state);
  stateRef.current = state;

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const currentMemberRef = useRef(currentMember);
  currentMemberRef.current = currentMember;

  const isRemoteUpdateRef = useRef(false);
  const lastPushedJsonRef = useRef<string>('');

  const [activeTab, setActiveTab] = useState<'my_chores' | 'all' | 'pending' | 'completed'>('my_chores');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );

  // Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isZaloOpen, setIsZaloOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isPWAOpen, setIsPWAOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [transferTargetChore, setTransferTargetChore] = useState<Chore | null>(null);
  const [isChoreRecOpen, setIsChoreRecOpen] = useState(false);
  const [selectedChoreForDetail, setSelectedChoreForDetail] = useState<Chore | null>(null);
  const [selectedChoreForRedo, setSelectedChoreForRedo] = useState<Chore | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isChoreManagerOpen, setIsChoreManagerOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const unreadNotificationsCount = useMemo(() => {
    const unreadNotifs = (state.notifications || []).filter(
      (n) => !currentUserId || !n.readBy.includes(currentUserId)
    ).length;
    const pendingVotes = (state.proposals || []).filter(
      (p) => p.status === 'pending' && (!currentUserId || !p.votes[currentUserId])
    ).length;
    return unreadNotifs + pendingVotes;
  }, [state.notifications, state.proposals, currentUserId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Đảm bảo tài khoản đã đăng nhập luôn tự động có trong danh sách thành viên phòng
  useEffect(() => {
    if (hasActiveRoom && authUser && state.members.length > 0 && !currentMember) {
      const avgPoints = Math.max(
        0,
        Math.round(state.members.reduce((sum, m) => sum + m.points, 0) / state.members.length)
      );
      const newMember: Member = {
        id: authUser.id,
        name: authUser.username,
        avatar: authUser.avatar || '🙋‍♂️',
        color: authUser.color || 'bg-indigo-600 text-white',
        points: avgPoints,
        streak: 0,
        lateViolations: 0,
        zaloName: authUser.username,
      };
      setState((prev) => ({
        ...prev,
        members: [...prev.members, newMember],
      }));
    }
  }, [hasActiveRoom, authUser, currentMember, state.members]);

  // Persist state to localStorage and push silently to Cloud (có cơ chế chống lặp vô hạn)
  useEffect(() => {
    if (!hasActiveRoom) return;
    saveState(state);

    const currentJson = JSON.stringify(state);
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    if (currentJson === lastPushedJsonRef.current) {
      return;
    }

    lastPushedJsonRef.current = currentJson;
    pushStateToCloud(state);
  }, [state, hasActiveRoom]);

  // Realtime subscription via Supabase if configured by dev (có lọc dữ liệu chống giật màn hình)
  useEffect(() => {
    if (!hasActiveRoom) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`room_${state.roomCode}`)
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
            const newJson = JSON.stringify(newState);
            if (newJson === JSON.stringify(stateRef.current) || newJson === lastPushedJsonRef.current) {
              return;
            }
            isRemoteUpdateRef.current = true;
            lastPushedJsonRef.current = newJson;

            // Đẩy thông báo tức thì ra màn hình khóa khi bạn cùng phòng hoàn thành việc/nhượng việc/biểu quyết
            checkAndPushRemoteNotifications(
              stateRef.current.notifications || [],
              newState.notifications || [],
              currentUserIdRef.current
            );

            setState(newState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.roomCode, hasActiveRoom]);

  // Targeted chores for current user (hôm nay có lịch)
  const myChores = useMemo(() => {
    if (!currentUserId) return [];
    return state.chores.filter((c) => c.assignedTo === currentUserId && isChoreScheduledToday(c));
  }, [state.chores, currentUserId]);

  // Incoming transfer requests for current user
  const incomingTransferRequests = useMemo(() => {
    if (!currentUserId) return [];
    return (state.transferRequests || []).filter(
      (req) => req.toMemberId === currentUserId && req.status === 'pending'
    );
  }, [state.transferRequests, currentUserId]);

  // Periodic check (Midnight rollover, notifications cá nhân, và phạt trừ điểm trễ)
  const runPeriodicTasks = useCallback(() => {
    if (!hasActiveRoom) return;
    const currentState = stateRef.current;
    const todayStr = getTodayDateString();

    // 1. Tự động kiểm tra sang ngày mới (Midnight Rollover & Phân chia việc cho người mới)
    if (currentState.lastDateChecked !== todayStr) {
      const rolledOver = handleDayRollover(currentState);
      setState(rolledOver);
      return;
    }

    // 2. Thông báo đẩy: Nhắc việc hôm nay, báo việc ngày mai & cảnh báo nhiều mốc sát hạn chót
    checkAndNotifyMyChores(
      currentState.chores,
      currentUserIdRef.current,
      currentMemberRef.current,
      currentState.members,
      currentState.rebalancePendingTomorrow
    );

    // 3. Kiểm tra quá hạn và trừ điểm
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let hasPenaltyApplied = false;
    let updatedMembers = [...currentState.members];
    let updatedLogs = [...currentState.logs];

    const updatedChores = currentState.chores.map((chore) => {
      if (chore.isCompletedToday || chore.isLatePenalized) return chore;
      if (!isChoreScheduledToday(chore)) return chore; // Không phạt nếu hôm nay không phải ngày làm việc này

      const [dueH, dueM] = chore.dueTime.split(':').map(Number);
      const dueMinutes = dueH * 60 + dueM;

      if (currentMinutes > dueMinutes) {
        const assignee = updatedMembers.find((m) => m.id === chore.assignedTo);
        if (!assignee) return chore;

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
            dateStr: todayStr,
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
  }, [hasActiveRoom]);

  // Định kỳ chạy mỗi 60 giây (không tạo vòng lặp render)
  useEffect(() => {
    if (!hasActiveRoom) return;
    runPeriodicTasks();
    const interval = setInterval(runPeriodicTasks, 60000);
    return () => clearInterval(interval);
  }, [hasActiveRoom, runPeriodicTasks]);

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      showToast('🔔 Đã bật thông báo đẩy thành công!');
      checkAndNotifyMyChores(
        state.chores,
        currentUserId,
        currentMember,
        state.members,
        state.rebalancePendingTomorrow
      );
    } else {
      showToast('⚠️ Bạn chưa cấp quyền thông báo trên trình duyệt.');
    }
  };

  // Toggle chore completed (hoặc hủy tích để có thể hoàn thành lại)
  const handleToggleComplete = (choreId: string) => {
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    // Bảo mật vai trò: Chỉ chính chủ được giao việc mới có quyền tick hoàn thành hoặc hủy tick
    if (targetChore.assignedTo !== currentUserId) {
      showToast('⚠️ Bạn không thể tick việc của người khác! Chỉ người phụ trách mới được tick.');
      return;
    }

    const willBeCompleted = !targetChore.isCompletedToday;
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const assignee = state.members.find((m) => m.id === targetChore.assignedTo);
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
    } else {
      showToast(`↩️ Đã hủy hoàn thành "${targetChore.title}". Số điểm (-${earnedPoints}đ) đã được trừ lại để bạn làm lại.`);
    }

    const updatedMembers = state.members.map((member) => {
      if (member.id === targetChore.assignedTo) {
        return {
          ...member,
          points: willBeCompleted
            ? member.points + earnedPoints
            : Math.max(0, member.points - earnedPoints),
          streak: willBeCompleted ? member.streak + 1 : Math.max(0, member.streak - 1),
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
          // Khi hoàn thành lại, xóa yêu cầu làm lại trước đó
          redoRequest: willBeCompleted ? undefined : chore.redoRequest,
        };
      }
      return chore;
    });

    let updatedLogs = [...state.logs];
    let updatedNotifications = [...(state.notifications || [])];

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
          dateStr: getTodayDateString(),
          note: targetChore.nextBonusPoints ? 'Thưởng hoàn trả (+1đ)' : undefined,
        },
        ...state.logs,
      ];

      const compNotif: AppNotification = {
        id: 'notif_comp_' + Date.now(),
        title: 'Hoàn thành việc nhà',
        message: `${assignee?.name || 'Thành viên'} vừa hoàn thành "${targetChore.title}" (+${earnedPoints}đ)!`,
        type: 'chore_completed',
        createdAt: `Hôm nay ${nowTimeStr}`,
        readBy: currentUserId ? [currentUserId] : [],
        choreId: targetChore.id,
      };
      updatedNotifications = [compNotif, ...updatedNotifications];
    } else {
      updatedLogs = [
        {
          id: 'log_untick_' + Date.now(),
          choreId: targetChore.id,
          choreTitle: targetChore.title,
          memberId: targetChore.assignedTo,
          memberName: assignee?.name || 'Thành viên',
          completedAt: `Hôm nay ${nowTimeStr}`,
          pointsEarned: -earnedPoints,
          type: 'redo_requested',
          dateStr: getTodayDateString(),
          note: 'Hủy đánh dấu hoàn thành để làm lại',
        },
        ...state.logs,
      ];
    }

    setState((prev) => ({
      ...prev,
      members: updatedMembers,
      chores: updatedChores,
      logs: updatedLogs,
      notifications: updatedNotifications,
    }));

    // Cập nhật state modal chi tiết nếu đang mở việc này
    if (selectedChoreForDetail?.id === choreId) {
      setSelectedChoreForDetail((prev) =>
        prev
          ? {
              ...prev,
              isCompletedToday: willBeCompleted,
              completedAt: willBeCompleted ? nowTimeStr : undefined,
              completedBy: willBeCompleted ? prev.assignedTo : undefined,
              redoRequest: willBeCompleted ? undefined : prev.redoRequest,
            }
          : null
      );
    }
  };

  // Người dùng khác yêu cầu làm lại công việc (do chưa sạch / làm chưa tốt)
  const handleConfirmRedo = async (choreId: string, reason: string) => {
    if (!currentMember) return;
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    const assignee = state.members.find((m) => m.id === targetChore.assignedTo);
    if (!assignee) return;

    const earnedPoints = targetChore.nextBonusPoints || targetChore.points;
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Tạm thu hồi điểm đã cộng cho người làm
    const updatedMembers = state.members.map((m) => {
      if (m.id === assignee.id) {
        return {
          ...m,
          points: Math.max(0, m.points - earnedPoints),
          streak: Math.max(0, m.streak - 1),
        };
      }
      return m;
    });

    const updatedChores = state.chores.map((c) => {
      if (c.id === choreId) {
        return {
          ...c,
          isCompletedToday: false,
          completedAt: undefined,
          completedBy: undefined,
          redoRequest: {
            requestedBy: currentMember.id,
            requestedByName: currentMember.name,
            reason,
            requestedAt: nowTimeStr,
          },
        };
      }
      return c;
    });

    const redoLog: ChoreLog = {
      id: 'log_redo_' + Date.now(),
      choreId: targetChore.id,
      choreTitle: targetChore.title,
      memberId: assignee.id,
      memberName: assignee.name,
      completedAt: `Hôm nay ${nowTimeStr}`,
      pointsEarned: -earnedPoints,
      type: 'redo_requested',
      dateStr: getTodayDateString(),
      note: `${currentMember.name} yêu cầu làm lại: "${reason}"`,
    };

    const redoNotif: AppNotification = {
      id: 'notif_redo_' + Date.now(),
      title: '⚠️ Yêu cầu làm lại việc',
      message: `${currentMember.name} yêu cầu ${assignee.name} làm lại "${targetChore.title}" (Lý do: ${reason}).`,
      type: 'chore_redo',
      createdAt: `Hôm nay ${nowTimeStr}`,
      readBy: [currentMember.id],
      choreId: targetChore.id,
    };

    setState((prev) => ({
      ...prev,
      members: updatedMembers,
      chores: updatedChores,
      logs: [redoLog, ...prev.logs],
      notifications: [redoNotif, ...(prev.notifications || [])],
    }));

    setSelectedChoreForRedo(null);
    if (selectedChoreForDetail?.id === choreId) {
      setSelectedChoreForDetail(null);
    }

    showToast(`⚠️ Đã gửi yêu cầu làm lại "${targetChore.title}" tới ${assignee.name}!`);

    // Chuẩn bị tin nhắn nhắc Zalo
    const tag = `@${assignee.zaloName || assignee.name}`;
    const text = `📢 [YÊU CẦU LÀM LẠI] Alo ${tag} ơi!\nBạn ${currentMember.name} vừa kiểm tra việc "${targetChore.title}" và thấy chưa đạt (${reason}).\nBạn làm lại sạch sẽ và tick lại để nhận lại điểm nhé! 🧹\n🔗 Link vào app: ${window.location.origin}?room=${encodeURIComponent(state.roomCode)}\n🔑 Mã phòng: ${state.roomCode}`;
    await shareToZalo(text);
  };

  // Cơ chế nhượng việc
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

    const transferNotif: AppNotification = {
      id: 'notif_trans_' + Date.now(),
      title: '🔄 Lời mời nhượng việc',
      message: `${currentMember.name} muốn nhượng việc "${chore.title}" (+${chore.points}đ) cho ${targetMember.name}.`,
      type: 'chore_transfer',
      createdAt: `Hôm nay ${newRequest.createdAt}`,
      readBy: [currentMember.id],
      choreId: chore.id,
    };

    setState((prev) => ({
      ...prev,
      transferRequests: [newRequest, ...(prev.transferRequests || [])],
      notifications: [transferNotif, ...(prev.notifications || [])],
    }));

    showToast(`Đã gửi lời mời nhượng việc "${chore.title}" cho ${targetMember.name}!`);
  };

  // Người nhận đồng ý
  const handleAcceptTransfer = (requestId: string) => {
    const req = (state.transferRequests || []).find((r) => r.id === requestId);
    if (!req) return;

    const chore = state.chores.find((c) => c.id === req.choreId);
    if (!chore) return;

    const fromMember = state.members.find((m) => m.id === req.fromMemberId);
    const toMember = state.members.find((m) => m.id === req.toMemberId);

    const updatedMembers = state.members.map((m) => {
      if (m.id === req.fromMemberId) {
        return {
          ...m,
          points: m.points - req.chorePoints,
        };
      }
      return m;
    });

    const updatedChores = state.chores.map((c) => {
      if (c.id === req.choreId) {
        return {
          ...c,
          assignedTo: req.toMemberId,
          originalAssignee: req.fromMemberId,
          nextBonusPoints: c.points + 1,
        };
      }
      return c;
    });

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
        dateStr: getTodayDateString(),
        note: `Nhượng việc cho ${toMember?.name || 'bạn cùng phòng'}`,
      },
      ...state.logs,
    ];

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

  // Người nhận từ chối
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

  // Tham gia phòng bằng mã phòng (tự động gắn tài khoản đang đăng nhập vào phòng)
  const handleJoinRoom = async (roomCode: string, userOverride?: UserAccount): Promise<boolean> => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) return false;

    const cloudState = await fetchStateFromCloud(cleanCode);
    const targetState = cloudState || (state.roomCode === cleanCode ? state : null);

    if (!targetState) {
      return false;
    }

    const activeUser = userOverride || authUser;
    let updatedMembers = [...targetState.members];

    if (activeUser) {
      const existingMember = updatedMembers.find(
        (m) => m.id === activeUser.id || m.name.toLowerCase() === activeUser.username.toLowerCase()
      );

      if (!existingMember) {
        const avgPoints = updatedMembers.length > 0
          ? Math.max(0, Math.round(updatedMembers.reduce((sum, m) => sum + m.points, 0) / updatedMembers.length))
          : 0;

        const newMember: Member = {
          id: activeUser.id,
          name: activeUser.username,
          avatar: activeUser.avatar || '🙋‍♂️',
          color: activeUser.color || 'bg-indigo-600 text-white',
          points: avgPoints,
          streak: 0,
          lateViolations: 0,
          zaloName: activeUser.username,
        };
        updatedMembers.push(newMember);

        const joinLog: ChoreLog = {
          id: 'log_join_' + Date.now(),
          choreId: 'join',
          choreTitle: 'Gia nhập phòng',
          memberId: newMember.id,
          memberName: newMember.name,
          completedAt: `Hôm nay ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          pointsEarned: avgPoints,
          type: 'completed',
          dateStr: getTodayDateString(),
          note: avgPoints > 0
            ? `Cấp ${avgPoints}đ khởi đầu (TB phòng). Việc nhà sẽ chia đều cho ${newMember.name} từ ngày mai`
            : `Gia nhập phòng. Việc nhà sẽ chia đều cho ${newMember.name} từ ngày mai`,
        };
        targetState.logs = [joinLog, ...(targetState.logs || [])];
        targetState.rebalancePendingTomorrow = true;
      }

      updateUserRoom(activeUser.id, cleanCode);
    }

    const finalState: AppState = {
      ...targetState,
      members: updatedMembers,
    };

    setState(finalState);
    setHasActiveRoom(true);
    localStorage.setItem(HAS_ROOM_KEY, 'true');

    // Silent push updated room with new member to Supabase
    pushStateToCloud(finalState);

    showToast(`🎉 Chào mừng ${activeUser?.username || ''} đã vào phòng "${finalState.roomName}"!`);
    return true;
  };

  // Tạo phòng mới (tự động lấy người tạo là tài khoản đang đăng nhập)
  const handleCreateRoom = async (roomName: string, creatorName: string): Promise<string> => {
    const newCode = `P-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const activeUser = authUser;
    const authorName = activeUser?.username || creatorName.trim();
    const creatorId = activeUser?.id || 'usr_' + Date.now();
    const creatorAvatar = activeUser?.avatar || '👑';
    const creatorColor = activeUser?.color || 'bg-indigo-600 text-white';

    const creatorMember: Member = {
      id: creatorId,
      name: authorName,
      avatar: creatorAvatar,
      color: creatorColor,
      points: 0,
      streak: 0,
      lateViolations: 0,
      zaloName: authorName,
    };

    const newRoomState: AppState = {
      roomName,
      roomCode: newCode,
      lastDateChecked: getTodayDateString(),
      members: [creatorMember],
      chores: [],
      logs: [],
      transferRequests: [],
      proposals: [],
      notifications: [],
    };

    setState(newRoomState);
    setHasActiveRoom(true);
    localStorage.setItem(HAS_ROOM_KEY, 'true');
    if (activeUser) {
      updateUserRoom(activeUser.id, newCode);
    }

    await pushStateToCloud(newRoomState);

    // Mở popup gợi ý công việc cho người dùng tuỳ chọn
    setIsChoreRecOpen(true);
    showToast(`🎉 Đã tạo phòng "${roomName}"! Hãy chọn các việc mẫu cho phòng.`);
    return newCode;
  };

  // Đăng nhập / Đăng ký thành công từ AuthScreen
  const handleAuthSuccess = async (user: UserAccount) => {
    setAuthUser(user);
    const targetCode = pendingRoomCode || getPendingRoomInvite() || user.lastRoomCode;

    if (targetCode) {
      const success = await handleJoinRoom(targetCode, user);
      if (success) {
        setPendingRoomCode(null);
        setPendingRoomInvite(null);
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('room');
          window.history.replaceState({}, document.title, url.toString());
        } catch {}
        return;
      }
    }

    const userInCurrentState = state.members.some(
      (m) => m.id === user.id || m.name.toLowerCase() === user.username.toLowerCase()
    );

    if (userInCurrentState && state.roomCode) {
      setHasActiveRoom(true);
      localStorage.setItem(HAS_ROOM_KEY, 'true');
      showToast(`Chào mừng ${user.username} trở lại phòng "${state.roomName}"!`);
    } else {
      setHasActiveRoom(false);
      localStorage.removeItem(HAS_ROOM_KEY);
      showToast(`Xin chào ${user.username}! Hãy tạo hoặc tham gia một phòng.`);
    }
  };

  // Đăng xuất tài khoản
  const handleLogout = () => {
    logoutAccount();
    setAuthUser(null);
    setHasActiveRoom(false);
    localStorage.removeItem(HAS_ROOM_KEY);
    showToast('Đã đăng xuất tài khoản thành công.');
  };

  // Áp dụng các việc được gợi ý khi tạo phòng
  const handleApplyRecommendedChores = (
    selectedChores: Omit<Chore, 'id' | 'isCompletedToday' | 'assignedTo'>[]
  ) => {
    if (selectedChores.length === 0) {
      setIsChoreRecOpen(false);
      return;
    }

    const newChores: Chore[] = selectedChores.map((sc, idx) => ({
      ...sc,
      id: `c_${Date.now()}_${idx}`,
      isCompletedToday: false,
      assignedTo: state.members[0]?.id || currentUserId || '',
    }));

    const balancedChores = autoBalanceChores(newChores, state.members);

    setState((prev) => ({
      ...prev,
      chores: balancedChores,
    }));

    setIsChoreRecOpen(false);
    showToast(`🎉 Đã thêm ${selectedChores.length} công việc mẫu vào phòng!`);
  };

  // Bỏ qua gợi ý công việc
  const handleSkipRecommendedChores = () => {
    setIsChoreRecOpen(false);
    showToast('Đã bắt đầu với danh sách việc trống. Bạn có thể tự thêm việc bất kỳ lúc nào!');
  };

  // Rời phòng (Quay về màn hình chào mừng)
  const handleLeaveRoom = () => {
    localStorage.removeItem(HAS_ROOM_KEY);
    setHasActiveRoom(false);
    showToast('Đã quay về màn hình chọn phòng.');
  };

  const handleNudge = async (chore: Chore, assignee?: Member) => {
    playNudgeSound();
    const tag = assignee ? `@${assignee.zaloName || assignee.name}` : 'bạn';
    const text = `📢 [NHẮC VIỆC RIÊNG] Alo ${tag} ơi!\nĐến giờ làm "${chore.title}" rồi nè (${chore.dueTime}). Quá giờ sẽ bị trừ -${chore.points}đ đó nha! 🧹\n🔗 Link vào app: ${window.location.origin}?room=${encodeURIComponent(state.roomCode)}\n🔑 Mã phòng: ${state.roomCode}`;
    
    await shareToZalo(text);
    showToast(`Đã chuẩn bị lời nhắc cho ${assignee?.name}! Hãy dán vào Zalo nhé.`);
  };

  // Thêm công việc (Nếu phòng > 1 người -> Cần biểu quyết quá bán)
  const handleAddChore = (newChoreData: Omit<Chore, 'id' | 'isCompletedToday'>) => {
    if (state.members.length <= 1) {
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
      return;
    }

    const proposalId = 'prop_chore_' + Date.now();
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const creatorName = currentMember?.name || 'Thành viên';
    const creatorId = currentMember?.id || currentUserId || 'm_unknown';

    const isOnce = newChoreData.frequency === 'once';
    const propTitle = isOnce
      ? `⚡ Việc phát sinh (1 lần): ${newChoreData.title} (+${newChoreData.points}đ)`
      : `Thêm việc: ${newChoreData.title} (+${newChoreData.points}đ)`;

    const newProposal: RoomProposal = {
      id: proposalId,
      type: 'add_chore',
      creatorId,
      creatorName,
      title: propTitle,
      description: `${creatorName} đề xuất thêm việc này vào phòng (${isOnce ? 'Làm 1 lần duy nhất' : 'Lặp lại định kỳ'}). Cần quá bán thành viên đồng ý để phê duyệt.`,
      createdAt: nowTimeStr,
      choreData: newChoreData,
      votes: {
        [creatorId]: 'agree', // Người đề xuất tính là 1 phiếu Đồng ý
      },
      status: 'pending',
    };

    const newNotification: AppNotification = {
      id: 'notif_' + Date.now(),
      title: isOnce ? '⚡ Biểu quyết việc phát sinh 1 lần' : '🗳️ Biểu quyết thêm việc mới',
      message: `${creatorName} vừa đề xuất ${isOnce ? 'việc phát sinh 1 lần' : 'thêm việc'} "${newChoreData.title}" (+${newChoreData.points}đ). Hãy tham gia bỏ phiếu!`,
      type: 'proposal_vote',
      createdAt: `Hôm nay ${nowTimeStr}`,
      readBy: [creatorId],
      proposalId,
    };

    setState((prev) => ({
      ...prev,
      proposals: [newProposal, ...(prev.proposals || [])],
      notifications: [newNotification, ...(prev.notifications || [])],
    }));

    showToast(`🗳️ Đã gửi đề xuất thêm "${newChoreData.title}"! Cần quá bán thành viên bỏ phiếu để phê duyệt.`);
  };

  // Đề xuất xóa thành viên (Nếu phòng > 1 người -> Cần biểu quyết quá bán)
  const handleRequestDeleteMember = (targetMemberId: string) => {
    const target = state.members.find((m) => m.id === targetMemberId);
    if (!target) return;

    if (state.members.length <= 1) {
      handleDeleteMember(targetMemberId);
      return;
    }

    const creatorName = currentMember?.name || 'Thành viên';
    const creatorId = currentMember?.id || currentUserId || 'm_unknown';
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const proposalId = 'prop_del_' + Date.now();

    const newProposal: RoomProposal = {
      id: proposalId,
      type: 'delete_member',
      creatorId,
      creatorName,
      title: `Xóa thành viên: ${target.name} ${target.avatar}`,
      description: `${creatorName} đề xuất xóa ${target.name} khỏi phòng. Cần quá bán thành viên đồng ý.`,
      createdAt: nowTimeStr,
      targetMemberId: target.id,
      targetMemberName: target.name,
      votes: {
        [creatorId]: 'agree', // Người đề xuất tính là 1 phiếu Đồng ý
      },
      status: 'pending',
    };

    const newNotification: AppNotification = {
      id: 'notif_' + Date.now(),
      title: '🗳️ Biểu quyết xóa thành viên',
      message: `${creatorName} đề xuất xóa ${target.name} khỏi phòng. Hãy tham gia bỏ phiếu!`,
      type: 'proposal_vote',
      createdAt: `Hôm nay ${nowTimeStr}`,
      readBy: [creatorId],
      proposalId,
    };

    setState((prev) => ({
      ...prev,
      proposals: [newProposal, ...(prev.proposals || [])],
      notifications: [newNotification, ...(prev.notifications || [])],
    }));

    showToast(`🗳️ Đã gửi đề xuất xóa ${target.name}! Cần hơn nửa thành viên đồng ý để phê duyệt.`);
  };

  // Đề xuất sửa công việc (Nếu phòng > 1 người -> Cần biểu quyết quá bán)
  const handleRequestEditChore = (
    choreId: string,
    updatedData: Partial<Omit<Chore, 'id' | 'assignedTo' | 'isCompletedToday'>>
  ) => {
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    if (state.members.length <= 1) {
      const updatedChores = state.chores.map((c) =>
        c.id === choreId
          ? {
              ...c,
              ...updatedData,
              assignedTo: c.assignedTo, // Giữ nguyên người làm theo logic phân chia công việc
              isCompletedToday: c.isCompletedToday,
            }
          : c
      );
      setState((prev) => ({
        ...prev,
        chores: updatedChores,
      }));
      showToast(`Đã cập nhật công việc "${targetChore.title}"!`);
      return;
    }

    const proposalId = 'prop_edit_' + Date.now();
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const creatorName = currentMember?.name || 'Thành viên';
    const creatorId = currentMember?.id || currentUserId || 'm_unknown';

    const newProposal: RoomProposal = {
      id: proposalId,
      type: 'edit_chore',
      creatorId,
      creatorName,
      title: `Sửa việc: ${targetChore.title}${updatedData.title && updatedData.title !== targetChore.title ? ` ➔ ${updatedData.title}` : ''}`,
      description: `${creatorName} đề xuất chỉnh sửa thông tin việc "${targetChore.title}". Người làm vẫn giữ nguyên theo thuật toán xoay việc. Cần quá bán thành viên đồng ý.`,
      createdAt: nowTimeStr,
      targetChoreId: choreId,
      updatedChoreData: updatedData,
      votes: {
        [creatorId]: 'agree',
      },
      status: 'pending',
    };

    const newNotification: AppNotification = {
      id: 'notif_' + Date.now(),
      title: '🗳️ Biểu quyết sửa công việc',
      message: `${creatorName} đề xuất chỉnh sửa việc "${targetChore.title}". Hãy tham gia bỏ phiếu!`,
      type: 'proposal_vote',
      createdAt: `Hôm nay ${nowTimeStr}`,
      readBy: [creatorId],
      proposalId,
      choreId,
    };

    setState((prev) => ({
      ...prev,
      proposals: [newProposal, ...(prev.proposals || [])],
      notifications: [newNotification, ...(prev.notifications || [])],
    }));

    showToast(`🗳️ Đã gửi đề xuất sửa "${targetChore.title}"! Cần quá bán đồng ý để phê duyệt.`);
  };

  // Đề xuất xóa công việc (Nếu phòng > 1 người -> Cần biểu quyết quá bán)
  const handleRequestDeleteChore = (choreId: string) => {
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    if (state.members.length <= 1) {
      setState((prev) => ({
        ...prev,
        chores: prev.chores.filter((c) => c.id !== choreId),
      }));
      showToast(`Đã xóa công việc "${targetChore.title}"!`);
      return;
    }

    const proposalId = 'prop_del_chore_' + Date.now();
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const creatorName = currentMember?.name || 'Thành viên';
    const creatorId = currentMember?.id || currentUserId || 'm_unknown';

    const newProposal: RoomProposal = {
      id: proposalId,
      type: 'delete_chore',
      creatorId,
      creatorName,
      title: `Xóa việc: ${targetChore.title}`,
      description: `${creatorName} đề xuất xóa vĩnh viễn việc "${targetChore.title}" khỏi phòng. Cần quá bán thành viên đồng ý.`,
      createdAt: nowTimeStr,
      targetChoreId: choreId,
      votes: {
        [creatorId]: 'agree',
      },
      status: 'pending',
    };

    const newNotification: AppNotification = {
      id: 'notif_' + Date.now(),
      title: '🗳️ Biểu quyết xóa công việc',
      message: `${creatorName} đề xuất xóa việc "${targetChore.title}" khỏi phòng. Hãy tham gia bỏ phiếu!`,
      type: 'proposal_vote',
      createdAt: `Hôm nay ${nowTimeStr}`,
      readBy: [creatorId],
      proposalId,
      choreId,
    };

    setState((prev) => ({
      ...prev,
      proposals: [newProposal, ...(prev.proposals || [])],
      notifications: [newNotification, ...(prev.notifications || [])],
    }));

    showToast(`🗳️ Đã gửi đề xuất xóa "${targetChore.title}"! Cần quá bán đồng ý để phê duyệt.`);
  };

  // Bỏ phiếu biểu quyết (Dân chủ phòng chung)
  const handleVoteProposal = (proposalId: string, vote: 'agree' | 'reject') => {
    if (!currentUserId) {
      showToast('⚠️ Vui lòng chọn bạn là ai trong phòng trước khi bỏ phiếu!');
      return;
    }

    const proposal = (state.proposals || []).find((p) => p.id === proposalId);
    if (!proposal || proposal.status !== 'pending') return;

    const voterId = currentUserId;
    const voterName = currentMember?.name || 'Thành viên';
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const updatedVotes = {
      ...proposal.votes,
      [voterId]: vote,
    };

    const totalMembers = state.members.length;
    const requiredVotes = Math.floor(totalMembers / 2) + 1; // Quá bán (> 50%)
    const agreeCount = Object.values(updatedVotes).filter((v) => v === 'agree').length;
    const rejectCount = Object.values(updatedVotes).filter((v) => v === 'reject').length;

    let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';
    let updatedChores = [...state.chores];
    let updatedMembers = [...state.members];
    let rebalancePending = state.rebalancePendingTomorrow;

    if (agreeCount >= requiredVotes) {
      // ĐÃ ĐẠT QUÁ BÁN ĐỒNG Ý -> THÔNG QUA
      newStatus = 'approved';

      if (proposal.type === 'add_chore' && proposal.choreData) {
        const newChore: Chore = {
          ...proposal.choreData,
          id: 'chore_' + Date.now(),
          isCompletedToday: false,
        };
        updatedChores = [newChore, ...updatedChores];
      } else if (proposal.type === 'delete_member' && proposal.targetMemberId) {
        const delId = proposal.targetMemberId;
        updatedMembers = updatedMembers.filter((m) => m.id !== delId);
        updatedChores = updatedChores.map((c) =>
          c.assignedTo === delId && updatedMembers.length > 0
            ? { ...c, assignedTo: updatedMembers[0].id }
            : c
        );
        rebalancePending = true;
      } else if (proposal.type === 'edit_chore' && proposal.targetChoreId && proposal.updatedChoreData) {
        // Cập nhật công việc: Không cho phép thay đổi người làm vào ngày hôm sau, vẫn tuân theo logic phân chia công việc
        const choreId = proposal.targetChoreId;
        updatedChores = updatedChores.map((c) => {
          if (c.id === choreId) {
            return {
              ...c,
              ...proposal.updatedChoreData,
              assignedTo: c.assignedTo,
              isCompletedToday: c.isCompletedToday,
            };
          }
          return c;
        });
      } else if (proposal.type === 'delete_chore' && proposal.targetChoreId) {
        // Xóa công việc khỏi phòng chung
        const choreId = proposal.targetChoreId;
        updatedChores = updatedChores.filter((c) => c.id !== choreId);
      }
    } else if (rejectCount >= Math.ceil(totalMembers / 2)) {
      // Số phiếu từ chối đã quá bán -> BÁC BỎ
      newStatus = 'rejected';
    }

    const updatedProposals = (state.proposals || []).map((p) =>
      p.id === proposalId
        ? {
            ...p,
            votes: updatedVotes,
            status: newStatus,
          }
        : p
    );

    let updatedNotifications = [...(state.notifications || [])];
    if (newStatus !== 'pending') {
      const resultNotif: AppNotification = {
        id: 'notif_res_' + Date.now(),
        title: newStatus === 'approved' ? '🎉 Đề xuất đã được thông qua!' : '❌ Đề xuất bị từ chối',
        message:
          newStatus === 'approved'
            ? `Đề xuất "${proposal.title}" đã đạt ${agreeCount}/${totalMembers} phiếu thuận và đã được thực thi!`
            : `Đề xuất "${proposal.title}" không đủ số phiếu thuận (${rejectCount} phiếu chống) và đã bị hủy.`,
        type: 'proposal_result',
        createdAt: `Hôm nay ${nowTimeStr}`,
        readBy: [voterId],
        proposalId: proposal.id,
      };
      updatedNotifications = [resultNotif, ...updatedNotifications];
    }

    const updatedLogs: ChoreLog[] = newStatus !== 'pending'
      ? [
          {
            id: 'log_vote_' + Date.now(),
            choreId: 'vote',
            choreTitle: proposal.title,
            memberId: voterId,
            memberName: voterName,
            completedAt: `Hôm nay ${nowTimeStr}`,
            pointsEarned: 0,
            type: 'completed',
            dateStr: getTodayDateString(),
            note:
              newStatus === 'approved'
                ? `Biểu quyết thông qua: ${proposal.title} (${agreeCount}/${totalMembers} phiếu)`
                : `Biểu quyết bác bỏ: ${proposal.title} (${rejectCount} phiếu chống)`,
          },
          ...state.logs,
        ]
      : state.logs;

    setState((prev) => ({
      ...prev,
      proposals: updatedProposals,
      notifications: updatedNotifications,
      chores: updatedChores,
      members: updatedMembers,
      rebalancePendingTomorrow: rebalancePending,
      logs: updatedLogs,
    }));

    if (newStatus === 'approved') {
      showToast(`🎉 Đề xuất "${proposal.title}" đã được thông qua (${agreeCount}/${totalMembers} phiếu)!`);
    } else if (newStatus === 'rejected') {
      showToast(`❌ Đề xuất "${proposal.title}" đã bị từ chối (${rejectCount} phiếu chống).`);
    } else {
      showToast(`Đã ghi nhận phiếu ${vote === 'agree' ? 'Đồng ý' : 'Từ chối'} của bạn!`);
    }
  };

  // Đánh dấu đã đọc tất cả thông báo
  const handleMarkAllNotificationsAsRead = () => {
    if (!currentUserId) return;
    const updated = (state.notifications || []).map((n) => ({
      ...n,
      readBy: n.readBy.includes(currentUserId) ? n.readBy : [...n.readBy, currentUserId],
    }));
    setState((prev) => ({
      ...prev,
      notifications: updated,
    }));
    showToast('Đã đánh dấu đã đọc tất cả thông báo!');
  };

  const handleAddMember = (name: string, avatar: string, zaloName: string) => {
    // 1. Tính điểm trung bình của các thành viên hiện tại trong phòng
    // Tránh thiệt thòi cho người mới khi phòng đã hoạt động lâu
    const existingMembers = state.members;
    const avgPoints = existingMembers.length > 0
      ? Math.max(0, Math.round(existingMembers.reduce((sum, m) => sum + m.points, 0) / existingMembers.length))
      : 0;

    const newMemberId = 'm_' + Date.now();
    const newMember: Member = {
      id: newMemberId,
      name,
      avatar,
      color: 'bg-indigo-500 text-white',
      points: avgPoints, // Cấp điểm khởi đầu bằng điểm trung bình phòng
      streak: 0,
      lateViolations: 0,
      zaloName,
    };

    const updatedMembers = [...existingMembers, newMember];

    // 2. KHÔNG đảo lộn công việc của ngày hôm nay (giữ nguyên để tránh ảnh hưởng việc đang làm/đã làm)
    // Đánh dấu rebalancePendingTomorrow = true để tự động chia đều cho người mới từ NGÀY MAI
    const joinLog: ChoreLog = {
      id: 'log_join_' + Date.now(),
      choreId: 'join',
      choreTitle: 'Gia nhập phòng',
      memberId: newMember.id,
      memberName: newMember.name,
      completedAt: `Hôm nay ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      pointsEarned: avgPoints,
      type: 'completed',
      dateStr: getTodayDateString(),
      note: avgPoints > 0
        ? `Cấp ${avgPoints}đ khởi đầu (TB phòng). Việc nhà sẽ bắt đầu chia đều cho ${name} từ ngày mai`
        : `Gia nhập phòng. Việc nhà sẽ bắt đầu chia đều cho ${name} từ ngày mai`,
    };

    setState((prev) => ({
      ...prev,
      members: updatedMembers,
      rebalancePendingTomorrow: true,
      logs: [joinLog, ...prev.logs],
    }));

    showToast(
      avgPoints > 0
        ? `🎉 Đã thêm ${name} (Khởi điểm: ${avgPoints}đ)! Việc nhà sẽ bắt đầu chia đều cho ${name} từ ngày mai.`
        : `🎉 Đã thêm ${name}! Việc nhà sẽ bắt đầu chia đều cho ${name} từ ngày mai.`
    );
  };

  const handleDeleteMember = (id: string) => {
    const remainingMembers = state.members.filter((m) => m.id !== id);
    const updatedChores = state.chores.map((chore) => {
      if (chore.assignedTo === id && remainingMembers.length > 0) {
        return {
          ...chore,
          assignedTo: remainingMembers[0].id,
        };
      }
      return chore;
    });

    setState((prev) => ({
      ...prev,
      members: remainingMembers,
      chores: updatedChores,
      rebalancePendingTomorrow: true,
    }));
    if (currentUserId === id) {
      setHasActiveRoom(false);
      localStorage.removeItem(HAS_ROOM_KEY);
    }
    showToast('Đã xóa thành viên. Lịch việc nhà sẽ được cân bằng lại vào ngày mai.');
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

  // 1. Nếu người dùng chưa đăng nhập: HIỆN MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ
  if (!authUser) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        pendingRoomCode={pendingRoomCode}
      />
    );
  }

  // 2. Nếu đã đăng nhập nhưng chưa có phòng: HIỆN GIAO DIỆN CHÀO MỪNG
  if (!hasActiveRoom) {
    return (
      <WelcomeScreen
        currentUser={authUser}
        onLogout={handleLogout}
        onJoinByCode={handleJoinRoom}
        onJoinByLink={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    );
  }

  return (
    <div 
      className="min-h-screen max-w-md mx-auto relative bg-slate-50 flex flex-col font-sans"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 5rem)',
      }}
    >
      {/* Sleek Top Header (Bấm tên phòng để mở quản lý mã phòng) */}
      <Navbar
        roomName={state.roomName}
        uncompletedCount={uncompletedCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenAddChore={() => setIsAddChoreOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
      />

      {/* Main Content */}
      <main className="p-3.5 space-y-3.5 flex-1">
        {/* Democratic Proposal Voting Banner */}
        <ProposalVoteCard
          proposals={state.proposals || []}
          members={state.members}
          currentUserId={currentUserId}
          onVote={handleVoteProposal}
        />

        {/* Personalized Task Highlight Banner & Incoming Transfer Alert */}
        <PersonalTaskBanner
          currentMember={currentMember}
          myChores={myChores}
          incomingRequests={incomingTransferRequests}
          onToggleComplete={handleToggleComplete}
          onRequestNotification={handleRequestNotification}
          notificationPermission={notificationPermission}
          onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
          onOpenTransfer={(chore) => setTransferTargetChore(chore)}
          onAcceptTransfer={handleAcceptTransfer}
          onDeclineTransfer={handleDeclineTransfer}
          onOpenDetail={(chore) => setSelectedChoreForDetail(chore)}
        />

        {/* Date & Quick Progress / Schedule trigger */}
        <div 
          onClick={() => setIsScheduleOpen(true)}
          className="flex items-center justify-between text-xs text-slate-600 px-3 py-2 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100/80 rounded-xl cursor-pointer transition shadow-xs group"
          title="Bấm để xem lịch tuần, tháng & bảng hoạt động đóng góp"
        >
          <div className="flex items-center space-x-1.5 font-medium truncate">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="capitalize truncate font-semibold text-slate-700">{todayFormatted}</span>
            <span className="text-[10px] text-indigo-700 bg-indigo-100/90 font-bold px-1.5 py-0.5 rounded-md ml-1 shrink-0">
              Lịch & Bảng hoạt động →
            </span>
          </div>

          <div className="flex items-center space-x-1 font-semibold text-slate-700 shrink-0 whitespace-nowrap ml-2">
            <span>Tiến độ:</span>
            <span className="text-indigo-600 font-bold">
              {completedCount}/{state.chores.length}
            </span>
          </div>
        </div>

        {/* Fairness & Karma Board */}
        <FairnessBoard 
          members={state.members} 
        />

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
                onOpenTransfer={(c) => setTransferTargetChore(c)}
                onOpenDetail={(c) => setSelectedChoreForDetail(c)}
                onOpenRequestRedo={(c) => setSelectedChoreForRedo(c)}
              />
            ))
          )}
        </div>
      </main>

      {/* Compact Floating Bottom-Right Quick Zalo Reminder Trigger */}
      <div 
        className="fixed z-20 pointer-events-auto"
        style={{
          bottom: 'max(env(safe-area-inset-bottom), 1.25rem)',
          right: 'max(calc((100vw - 28rem) / 2 + 1rem), 1rem)',
        }}
      >
        <button
          onClick={() => setIsZaloOpen(true)}
          title="Gửi bảng nhắc việc vào nhóm Zalo"
          className="py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/30 flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95 border border-white/25 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">Nhắc Zalo</span>
        </button>
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
        onOpenMembers={() => setIsMembersOpen(true)}
        onOpenChoreManager={() => setIsChoreManagerOpen(true)}
        onOpenSchedule={() => setIsScheduleOpen(true)}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenPWA={() => setIsPWAOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        onLogout={handleLogout}
      />

      {/* Room Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        state={state}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />

      {/* Transfer Chore Modal */}
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
        onDeleteMember={handleRequestDeleteMember}
      />

      {/* Zalo Reminder Modal */}
      <ZaloReminderModal
        isOpen={isZaloOpen}
        onClose={() => setIsZaloOpen(false)}
        roomName={state.roomName}
        roomCode={state.roomCode}
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

      {/* Chore Recommendation Modal for New Room */}
      <ChoreRecommendationModal
        isOpen={isChoreRecOpen}
        roomName={state.roomName}
        onApplyChores={handleApplyRecommendedChores}
        onSkip={handleSkipRecommendedChores}
      />

      {/* Chore Detail Modal */}
      <ChoreDetailModal
        isOpen={Boolean(selectedChoreForDetail)}
        onClose={() => setSelectedChoreForDetail(null)}
        chore={selectedChoreForDetail}
        members={state.members}
        currentUserId={currentUserId}
        onToggleComplete={handleToggleComplete}
        onOpenTransfer={(chore) => setTransferTargetChore(chore)}
        onNudge={handleNudge}
        onOpenRequestRedo={(chore) => setSelectedChoreForRedo(chore)}
        onOpenChoreManager={() => {
          setSelectedChoreForDetail(null);
          setIsChoreManagerOpen(true);
        }}
      />

      {/* Request Redo Modal */}
      <RequestRedoModal
        isOpen={Boolean(selectedChoreForRedo)}
        onClose={() => setSelectedChoreForRedo(null)}
        chore={selectedChoreForRedo}
        currentMember={currentMember || null}
        members={state.members}
        onConfirmRedo={handleConfirmRedo}
      />

      {/* Notification & Democratic Voting Center Modal */}
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={state.notifications || []}
        proposals={state.proposals || []}
        members={state.members}
        currentUserId={currentUserId}
        onMarkAllRead={handleMarkAllNotificationsAsRead}
        onVoteProposal={handleVoteProposal}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
      />

      {/* Push Notification Custom Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        onSettingsChanged={() => {
          showToast('🔔 Đã lưu cài đặt thông báo thành công!');
        }}
      />

      {/* Chore Manager Modal (Quản lý, chỉnh sửa, xóa việc) */}
      <ChoreManagerModal
        isOpen={isChoreManagerOpen}
        onClose={() => setIsChoreManagerOpen(false)}
        chores={state.chores}
        members={state.members}
        onRequestEditChore={handleRequestEditChore}
        onRequestDeleteChore={handleRequestDeleteChore}
      />

      {/* Chore Schedule & GitHub Activity Heatmap Modal */}
      <ChoreScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        chores={state.chores}
        members={state.members}
        logs={state.logs}
        currentUserId={currentUserId}
      />
    </div>
  );
}

export default App;
