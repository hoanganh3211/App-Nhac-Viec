import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, Scale } from 'lucide-react';
import { AppState, Chore, Member, ChoreLog } from './types';
import {
  loadState,
  saveState,
  getTodayDateString,
  autoBalanceChores,
  handleDayRollover,
  isChoreScheduledToday,
  getCanonicalStateSignature,
  mergeStates,
} from './utils/storage';
import { playSuccessSound } from './utils/audio';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
  checkUpcomingChoresAndNotify,
  checkDailyTimeSlotsAndNotify,
  sendInstantChoreSummary,
} from './utils/notifications';
import {
  getSupabaseClient,
  pushStateToCloud,
  fetchStateFromCloud,
} from './utils/supabase';
import { Navbar } from './components/Navbar';
import { ChoreCard } from './components/ChoreCard';
import { AddChoreModal } from './components/AddChoreModal';
import { MemberManagerModal } from './components/MemberManagerModal';
import { MenuDrawer } from './components/MenuDrawer';
import { RoomModal } from './components/RoomModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthScreen } from './components/AuthScreen';
import {
  getCurrentAuthUser,
  logoutAccount,
  updateUserRoom,
  getPendingRoomInvite,
  setPendingRoomInvite,
} from './utils/auth';
import { UserAccount } from './types';

const HAS_ROOM_KEY = 'app_nhac_viec_has_active_room';

export function App() {
  // Auth
  const [authUser, setAuthUser] = useState<UserAccount | null>(() => getCurrentAuthUser());

  // Pending room code from URL (?room=XYZ)
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

  // Current member in room
  const currentMember = useMemo(() => {
    if (!authUser) return undefined;
    return state.members.find(
      (m) => m.id === authUser.id || m.name.toLowerCase() === authUser.username.toLowerCase()
    );
  }, [state.members, authUser]);

  const currentUserId = currentMember?.id || authUser?.id || null;

  // Refs
  const stateRef = useRef(state);
  stateRef.current = state;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );

  const [clientId] = useState<string>(() => {
    try {
      let cid = sessionStorage.getItem('app_nhac_viec_client_id');
      if (!cid) {
        cid = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        sessionStorage.setItem('app_nhac_viec_client_id', cid);
      }
      return cid;
    } catch {
      return 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    }
  });
  const clientIdRef = useRef<string>(clientId);
  clientIdRef.current = clientId;

  const isCloudInitializedRef = useRef<boolean>(false);
  const isRemoteUpdateRef = useRef(false);
  const lastCanonicalSigRef = useRef<string>('');

  const [activeTab, setActiveTab] = useState<'today' | 'done'>('today');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals (only 4)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Auto-add authenticated user to room if not already present
  useEffect(() => {
    if (hasActiveRoom && authUser && state.members.length > 0 && !currentMember) {
      const alreadyIn = state.members.some(
        (m) => m.id === authUser.id || m.name.toLowerCase() === authUser.username.toLowerCase()
      );
      if (alreadyIn) return;

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

  // Cloud sync
  const syncWithCloud = useCallback(async (targetRoomCode?: string, forceToast = false) => {
    const code = (targetRoomCode || stateRef.current.roomCode || '').trim().toUpperCase();
    if (!code || code === 'PHONG-302') return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      isCloudInitializedRef.current = true;
      return;
    }

    try {
      const cloudState = await fetchStateFromCloud(code);
      if (cloudState) {
        const merged = mergeStates(stateRef.current, cloudState);
        const mergedSig = getCanonicalStateSignature(merged);
        const cloudSig = getCanonicalStateSignature(cloudState);

        lastCanonicalSigRef.current = mergedSig;
        isRemoteUpdateRef.current = true;
        setState(merged);
        saveState(merged);

        if (mergedSig !== cloudSig) {
          await pushStateToCloud({
            ...merged,
            lastUpdatedBy: clientIdRef.current,
            updatedAt: new Date().toISOString(),
            version: (merged.version || 0) + 1,
          });
        }
      } else {
        await pushStateToCloud({
          ...stateRef.current,
          lastUpdatedBy: clientIdRef.current,
          updatedAt: new Date().toISOString(),
          version: (stateRef.current.version || 0) + 1,
        });
      }

      isCloudInitializedRef.current = true;
      if (forceToast) showToast('✅ Đã đồng bộ dữ liệu!');
    } catch (err) {
      console.error('Sync failed:', err);
      isCloudInitializedRef.current = true;
      if (forceToast) showToast('⚠️ Không thể kết nối Cloud.');
    }
  }, [showToast]);

  // Initial cloud sync
  useEffect(() => {
    if (hasActiveRoom && authUser && state.roomCode && state.roomCode !== 'PHONG-302') {
      syncWithCloud(state.roomCode);
    } else {
      isCloudInitializedRef.current = true;
    }
  }, [hasActiveRoom, authUser, syncWithCloud]);

  // Auto-push changes to cloud
  useEffect(() => {
    if (!hasActiveRoom || !authUser) return;
    saveState(state);

    if (!isCloudInitializedRef.current) return;
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const currentSig = getCanonicalStateSignature(state);
    if (currentSig === lastCanonicalSigRef.current) return;
    lastCanonicalSigRef.current = currentSig;

    const timer = setTimeout(async () => {
      await pushStateToCloud({
        ...stateRef.current,
        lastUpdatedBy: clientIdRef.current,
        updatedAt: new Date().toISOString(),
        version: (stateRef.current.version || 0) + 1,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [state, hasActiveRoom, authUser]);

  // Realtime subscription
  useEffect(() => {
    if (!hasActiveRoom || !authUser || !state.roomCode || state.roomCode === 'PHONG-302') return;
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
            const incomingState = (payload.new as any).state_data as AppState;
            if (incomingState.lastUpdatedBy === clientIdRef.current) return;

            const incomingSig = getCanonicalStateSignature(incomingState);
            const currentSig = getCanonicalStateSignature(stateRef.current);
            if (incomingSig === currentSig || incomingSig === lastCanonicalSigRef.current) return;

            // Báo chuông & thông báo đẩy khi bạn cùng phòng hoàn thành việc
            const oldChores = stateRef.current.chores || [];
            (incomingState.chores || []).forEach((newChore) => {
              const oldChore = oldChores.find((c) => c.id === newChore.id);
              if (oldChore && !oldChore.isCompletedToday && newChore.isCompletedToday) {
                const completer = (incomingState.members || []).find((m) => m.id === newChore.assignedTo);
                const completerName = completer?.name || 'Bạn cùng phòng';
                sendBrowserNotification(`🎉 ${completerName} vừa làm xong!`, {
                  body: `Đã hoàn thành "${newChore.title}" (+${newChore.points}đ).`,
                  tag: `comp_${newChore.id}`,
                  soundType: 'pop',
                });
              }
            });

            const merged = mergeStates(stateRef.current, incomingState);
            lastCanonicalSigRef.current = getCanonicalStateSignature(merged);
            isRemoteUpdateRef.current = true;

            setState(merged);
            saveState(merged);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.roomCode, hasActiveRoom, authUser]);

  // Resume/online sync
  useEffect(() => {
    if (!hasActiveRoom || !authUser || !state.roomCode || state.roomCode === 'PHONG-302') return;

    const handleResume = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncWithCloud(stateRef.current.roomCode);
      }
    };

    window.addEventListener('focus', handleResume);
    window.addEventListener('online', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncWithCloud(stateRef.current.roomCode);
      }
    }, 25000);

    return () => {
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('online', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      clearInterval(heartbeat);
    };
  }, [hasActiveRoom, authUser, state.roomCode, syncWithCloud]);

  // Day rollover check
  useEffect(() => {
    if (!hasActiveRoom || !authUser) return;

    const check = () => {
      const todayStr = getTodayDateString();
      if (stateRef.current.lastDateChecked !== todayStr) {
        const rolledOver = handleDayRollover(stateRef.current);
        setState(rolledOver);
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [hasActiveRoom, authUser]);

  // Tự động kiểm tra thời hạn và nhắc việc đều đặn theo khung giờ trong ngày
  useEffect(() => {
    if (!hasActiveRoom || !authUser || !currentUserId) return;
    const memberName = currentMember?.name || authUser.username || 'bạn';

    const runChecks = () => {
      checkUpcomingChoresAndNotify(stateRef.current.chores, currentUserIdRef.current);
      checkDailyTimeSlotsAndNotify(stateRef.current.chores, currentUserIdRef.current, memberName);
    };

    runChecks();
    const interval = setInterval(runChecks, 30000);
    return () => clearInterval(interval);
  }, [hasActiveRoom, authUser, currentUserId, currentMember?.name]);

  // Bật/tắt hoặc gửi thông báo tóm tắt các việc chưa làm ngay lập tức
  const handleToggleNotification = async () => {
    const memberName = currentMember?.name || authUser?.username || 'bạn';
    if (notificationPermission === 'granted') {
      sendInstantChoreSummary(state.chores, currentUserId, memberName);
      showToast('🔔 Đã gửi thông báo tóm tắt các việc chưa làm & phát chuông!');
    } else {
      const granted = await requestNotificationPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
      if (granted) {
        showToast('🔔 Đã bật chuông & thông báo nhắc việc thành công!');
        sendInstantChoreSummary(state.chores, currentUserId, memberName);
      } else {
        showToast('⚠️ Vui lòng cho phép quyền thông báo trên trình duyệt của bạn.');
      }
    }
  };

  // Toggle chore complete
  const handleToggleComplete = (choreId: string) => {
    const targetChore = state.chores.find((c) => c.id === choreId);
    if (!targetChore) return;

    if (targetChore.assignedTo !== currentUserId) {
      showToast('⚠️ Chỉ người phụ trách mới được tick!');
      return;
    }

    const willBeCompleted = !targetChore.isCompletedToday;
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const assignee = state.members.find((m) => m.id === targetChore.assignedTo);
    const earnedPoints = targetChore.points;

    if (willBeCompleted) {
      playSuccessSound();
      confetti({
        particleCount: 65,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
      showToast(`🎉 +${earnedPoints} điểm cho ${assignee?.name || 'bạn'}!`);
    } else {
      showToast(`↩️ Đã hủy hoàn thành "${targetChore.title}".`);
    }

    const updatedMembers = state.members.map((member) => {
      if (member.id === targetChore.assignedTo) {
        return {
          ...member,
          points: willBeCompleted
            ? member.points + earnedPoints
            : Math.max(0, member.points - earnedPoints),
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

    const newLog: ChoreLog = {
      id: 'log_' + Date.now(),
      choreId: targetChore.id,
      choreTitle: targetChore.title,
      memberId: targetChore.assignedTo,
      memberName: assignee?.name || 'Thành viên',
      completedAt: `Hôm nay ${nowTimeStr}`,
      pointsEarned: willBeCompleted ? earnedPoints : -earnedPoints,
      type: willBeCompleted ? 'completed' : 'redo_requested',
      dateStr: getTodayDateString(),
    };

    setState((prev) => ({
      ...prev,
      members: updatedMembers,
      chores: updatedChores,
      logs: [newLog, ...prev.logs],
    }));
  };

  // Join room
  const handleJoinRoom = async (roomCode: string, userOverride?: UserAccount): Promise<boolean> => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) return false;

    const cloudState = await fetchStateFromCloud(cleanCode);
    const targetState = cloudState || (state.roomCode === cleanCode ? state : null);
    if (!targetState) return false;

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

        updatedMembers.push({
          id: activeUser.id,
          name: activeUser.username,
          avatar: activeUser.avatar || '🙋‍♂️',
          color: activeUser.color || 'bg-indigo-600 text-white',
          points: avgPoints,
          streak: 0,
          lateViolations: 0,
          zaloName: activeUser.username,
        });
        targetState.rebalancePendingTomorrow = true;
      }

      updateUserRoom(activeUser.id, cleanCode);
    }

    const finalState: AppState = {
      ...targetState,
      members: updatedMembers,
      lastUpdatedBy: clientIdRef.current,
      updatedAt: new Date().toISOString(),
      version: (targetState.version || 0) + 1,
    };

    lastCanonicalSigRef.current = getCanonicalStateSignature(finalState);
    isCloudInitializedRef.current = true;
    isRemoteUpdateRef.current = true;

    setState(finalState);
    setHasActiveRoom(true);
    localStorage.setItem(HAS_ROOM_KEY, 'true');

    await pushStateToCloud(finalState);
    showToast(`🎉 Chào mừng vào phòng "${finalState.roomName}"!`);
    return true;
  };

  // Auto-join from pending room code
  useEffect(() => {
    if (!authUser || !pendingRoomCode) return;
    let isMounted = true;

    const process = async () => {
      const targetRoom = pendingRoomCode.trim().toUpperCase();
      if (!hasActiveRoom || state.roomCode !== targetRoom) {
        await handleJoinRoom(targetRoom, authUser);
      } else {
        await syncWithCloud(targetRoom, true);
      }
      if (isMounted) {
        setPendingRoomCode(null);
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('room');
          window.history.replaceState({}, document.title, url.pathname);
        } catch {}
      }
    };

    process();
    return () => { isMounted = false; };
  }, [authUser, pendingRoomCode]);

  // Create room
  const handleCreateRoom = async (roomName: string, creatorName: string): Promise<string> => {
    const newCode = `P-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const activeUser = authUser;
    const authorName = activeUser?.username || creatorName.trim();
    const creatorId = activeUser?.id || 'usr_' + Date.now();

    const creatorMember: Member = {
      id: creatorId,
      name: authorName,
      avatar: activeUser?.avatar || '👑',
      color: activeUser?.color || 'bg-indigo-600 text-white',
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
      lastUpdatedBy: clientIdRef.current,
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    lastCanonicalSigRef.current = getCanonicalStateSignature(newRoomState);
    isCloudInitializedRef.current = true;
    isRemoteUpdateRef.current = true;

    setState(newRoomState);
    setHasActiveRoom(true);
    localStorage.setItem(HAS_ROOM_KEY, 'true');
    if (activeUser) updateUserRoom(activeUser.id, newCode);

    await pushStateToCloud(newRoomState);
    showToast(`🎉 Đã tạo phòng "${roomName}"!`);
    return newCode;
  };

  // Auth success
  const handleAuthSuccess = async (user: UserAccount) => {
    setAuthUser(user);

    const targetCode = pendingRoomCode || getPendingRoomInvite() || user.lastRoomCode;
    if (targetCode) {
      const success = await handleJoinRoom(targetCode, user);
      if (success) {
        setPendingRoomCode(null);
        setPendingRoomInvite(null);
        return;
      }
    }

    const userInRoom = state.members.some(
      (m) => m.id === user.id || m.name.toLowerCase() === user.username.toLowerCase()
    );

    if (userInRoom && state.roomCode) {
      setHasActiveRoom(true);
      localStorage.setItem(HAS_ROOM_KEY, 'true');
      showToast(`Chào mừng ${user.username} trở lại!`);
      syncWithCloud(state.roomCode);
    } else {
      setHasActiveRoom(false);
      localStorage.removeItem(HAS_ROOM_KEY);
      showToast(`Xin chào ${user.username}! Hãy tạo hoặc tham gia một phòng.`);
    }
  };

  // Logout
  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try { supabase.removeAllChannels(); } catch {}
    }
    logoutAccount();
    setAuthUser(null);
    setHasActiveRoom(false);
    localStorage.removeItem(HAS_ROOM_KEY);
    showToast('Đã đăng xuất.');
  };

  // Leave room
  const handleLeaveRoom = () => {
    localStorage.removeItem(HAS_ROOM_KEY);
    setHasActiveRoom(false);
    showToast('Đã quay về màn hình chọn phòng.');
  };

  // Add chore
  const handleAddChore = (newChoreData: Omit<Chore, 'id' | 'isCompletedToday'>) => {
    const newChore: Chore = {
      ...newChoreData,
      id: 'chore_' + Date.now(),
      isCompletedToday: false,
    };

    const combinedChores = [newChore, ...state.chores];
    const balancedChores = autoBalanceChores(combinedChores, state.members, {
      preserveCompleted: true,
    });

    const assignedChore = balancedChores.find((c) => c.id === newChore.id) || newChore;
    const assignedMember = state.members.find((m) => m.id === assignedChore.assignedTo);

    setState((prev) => ({ ...prev, chores: balancedChores }));
    showToast(`🎉 Đã thêm "${assignedChore.title}" — giao cho ${assignedMember?.name || 'thành viên'}!`);
  };

  // Delete chore
  const handleDeleteChore = (choreId: string) => {
    const target = state.chores.find((c) => c.id === choreId);
    if (!target) return;
    if (window.confirm(`Xóa công việc "${target.title}"?`)) {
      setState((prev) => ({
        ...prev,
        chores: prev.chores.filter((c) => c.id !== choreId),
      }));
      showToast(`Đã xóa việc "${target.title}".`);
    }
  };

  // Add member
  const handleAddMember = (name: string, avatar: string, zaloName: string) => {
    const avgPoints = state.members.length > 0
      ? Math.max(0, Math.round(state.members.reduce((sum, m) => sum + m.points, 0) / state.members.length))
      : 0;

    const newMember: Member = {
      id: 'm_' + Date.now(),
      name,
      avatar,
      color: 'bg-indigo-500 text-white',
      points: avgPoints,
      streak: 0,
      lateViolations: 0,
      zaloName,
    };

    setState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
      rebalancePendingTomorrow: true,
    }));
    showToast(`🎉 Đã thêm ${name}!`);
  };

  // Delete member
  const handleDeleteMember = (id: string) => {
    const remainingMembers = state.members.filter((m) => m.id !== id);
    const updatedChores = state.chores.map((chore) => {
      if (chore.assignedTo === id && remainingMembers.length > 0) {
        return { ...chore, assignedTo: remainingMembers[0].id };
      }
      return chore;
    });

    setState((prev) => ({
      ...prev,
      members: remainingMembers,
      chores: updatedChores,
    }));
    if (currentUserId === id) {
      setHasActiveRoom(false);
      localStorage.removeItem(HAS_ROOM_KEY);
    }
    showToast('Đã xóa thành viên.');
  };

  const handleUpdateRoomName = (name: string) => {
    setState((prev) => ({ ...prev, roomName: name }));
    showToast('Đã cập nhật tên phòng!');
  };

  // Tự động phân chia lại công việc công bằng theo thuật toán tải trọng điểm
  const handleRebalanceChores = async () => {
    const realMembers = (state.members || []).filter(
      (m) => m.id !== 'usr_admin_root' && m.name.toLowerCase() !== 'admin'
    );

    if (realMembers.length === 0 || state.chores.length === 0) {
      showToast('⚠️ Chưa có đủ công việc hoặc thành viên để phân chia.');
      return;
    }

    const balancedChores = autoBalanceChores(state.chores, realMembers, {
      preserveCompleted: true,
    });

    const isAlreadyFair = state.chores.every((c) => {
      const b = balancedChores.find((bc) => bc.id === c.id);
      return b && b.assignedTo === c.assignedTo;
    });

    if (isAlreadyFair) {
      showToast('✨ Công việc đã được phân chia công bằng tối ưu rồi!');
      return;
    }

    const newState: AppState = {
      ...state,
      members: realMembers,
      chores: balancedChores,
      updatedAt: new Date().toISOString(),
      version: (state.version || 0) + 1,
      lastUpdatedBy: clientIdRef.current,
    };

    lastCanonicalSigRef.current = getCanonicalStateSignature(newState);
    setState(newState);
    saveState(newState);
    await pushStateToCloud(newState);

    showToast('⚖️ Đã tự động chia đều lại việc cho mọi người!');
  };

  // Filtered chores
  const todayScheduledChores = useMemo(() => {
    return state.chores.filter((c) => isChoreScheduledToday(c));
  }, [state.chores]);

  const filteredChores = useMemo(() => {
    if (activeTab === 'done') return todayScheduledChores.filter((c) => c.isCompletedToday);
    return todayScheduledChores.filter((c) => !c.isCompletedToday);
  }, [todayScheduledChores, activeTab]);

  const todayCompletedCount = todayScheduledChores.filter((c) => c.isCompletedToday).length;
  const todayPendingCount = todayScheduledChores.filter((c) => !c.isCompletedToday).length;

  // === RENDER ===

  // 1. Auth screen
  if (!authUser) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        pendingRoomCode={pendingRoomCode}
      />
    );
  }

  // 2. Welcome screen (no room)
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

  // 3. Main app
  return (
    <div
      className="min-h-screen max-w-md mx-auto relative bg-slate-50 flex flex-col font-sans"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 5rem)',
      }}
    >
      <Navbar
        roomName={state.roomName}
        onOpenAddChore={() => setIsAddChoreOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        isNotificationEnabled={notificationPermission === 'granted'}
        onToggleNotification={handleToggleNotification}
      />

      <main className="p-3.5 space-y-3.5 flex-1">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <span className="font-semibold text-slate-700 capitalize">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
          </span>
          <span className="font-semibold">
            Tiến độ: <span className="text-indigo-600 font-bold">{todayCompletedCount}/{todayScheduledChores.length}</span>
          </span>
        </div>

        {/* Compact Fairness & Points Bar */}
        {state.members.length > 0 && (
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chia việc công bằng</span>
              </div>
              <button
                type="button"
                onClick={handleRebalanceChores}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer transition hover:underline"
                title="Tự động phân bổ lại việc chưa hoàn thành theo điểm số"
              >
                <span>Tự động chia đều →</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              {[...state.members]
                .sort((a, b) => a.points - b.points)
                .map((member, idx, arr) => {
                  const isLowest = idx === 0 && arr.length > 1;
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs shrink-0 border transition ${
                        isLowest
                          ? 'bg-amber-50/90 border-amber-200 text-amber-950 font-medium'
                          : 'bg-slate-50 border-slate-200/80 text-slate-700'
                      }`}
                    >
                      <span className="text-sm">{member.avatar}</span>
                      <span className="font-semibold">{member.name}</span>
                      <span className="font-bold text-indigo-600 ml-0.5">{member.points}đ</span>
                      {isLowest && (
                        <span className="text-[9px] px-1 py-0.2 bg-amber-200 text-amber-900 rounded font-bold ml-1">
                          Ưu tiên việc tới
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-200/70 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'today'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cần làm ({todayPendingCount})
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`flex-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'done'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã xong ({todayCompletedCount})
          </button>
        </div>

        {/* Chore List */}
        <div className="space-y-2.5">
          {filteredChores.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
              <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">
                {activeTab === 'today' ? 'Tất cả đã xong! 🎉' : 'Chưa có việc nào hoàn thành'}
              </h4>
            </div>
          ) : (
            filteredChores.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                members={state.members}
                currentUserId={currentUserId}
                onToggleComplete={handleToggleComplete}
                onDeleteChore={handleDeleteChore}
              />
            ))
          )}
        </div>
      </main>

      {/* Toast */}
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
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        onRebalance={handleRebalanceChores}
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
    </div>
  );
}

export default App;
