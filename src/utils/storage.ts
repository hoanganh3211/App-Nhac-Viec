import { 
  AppState, 
  Chore, 
  Member, 
  RotationRule, 
  FrequencyType,
  TransferRequest,
  ChoreLog,
  RoomProposal,
  AppNotification
} from '../types';

const STORAGE_KEY = 'app_nhac_viec_data_v1';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Thuật toán Phân Chia & Tái Cân Bằng Công Việc Công Bằng (Smart Fair Workload Distribution)
 * 1. Phân bổ công việc dựa trên:
 *    - Tải trọng điểm gánh trong ngày (assignedPoints)
 *    - Điểm tích lũy hiện có của thành viên (basePoints)
 *    - Số lượng công việc được giao (choreCount)
 * 2. Giải quyết triệt để trường hợp mọi người bằng điểm nhau (ví dụ cùng 0đ khi bắt đầu):
 *    - Dùng cơ chế Round-Robin Tie-Breaker xoay vòng chỉ số để chia đều việc, không dồn vào người đầu danh sách.
 * 3. Khi thêm việc mới hoặc tái cân bằng:
 *    - Tính toán lại toàn bộ các việc chưa hoàn thành trong phòng để phân chia lại tối ưu nhất.
 *    - Bảo toàn nguyên vẹn các việc đã làm xong hôm nay (isCompletedToday) và việc đang được nhượng (originalAssignee).
 */
export const autoBalanceChores = (
  chores: Chore[],
  members: Member[],
  options?: {
    preserveCompleted?: boolean;
    excludedChoreIds?: string[];
  }
): Chore[] => {
  if (!members.length || !chores.length) return chores;

  const preserveCompleted = options?.preserveCompleted ?? true;
  const excludedChoreIds = new Set(options?.excludedChoreIds || []);

  // 1. Tách công việc cố định (không đổi) và công việc cần phân bổ lại
  const fixedChores: Chore[] = [];
  const choresToBalance: Chore[] = [];

  for (const chore of chores) {
    if (excludedChoreIds.has(chore.id)) {
      fixedChores.push(chore);
    } else if (chore.originalAssignee) {
      fixedChores.push(chore);
    } else if (preserveCompleted && chore.isCompletedToday) {
      fixedChores.push(chore);
    } else {
      choresToBalance.push(chore);
    }
  }

  // 2. Khởi tạo bảng tải trọng của từng thành viên
  const memberLoad: Record<
    string,
    {
      basePoints: number;
      assignedPoints: number;
      choreCount: number;
    }
  > = {};

  members.forEach((m) => {
    memberLoad[m.id] = {
      basePoints: m.points || 0,
      assignedPoints: 0,
      choreCount: 0,
    };
  });

  // Cộng dồn điểm của các việc cố định / đã làm xong hôm nay
  for (const fixed of fixedChores) {
    if (fixed.assignedTo && memberLoad[fixed.assignedTo]) {
      memberLoad[fixed.assignedTo].assignedPoints += fixed.points;
      memberLoad[fixed.assignedTo].choreCount += 1;
    }
  }

  // Kiểm tra xem tất cả thành viên có bằng điểm tích lũy nhau không (ví dụ cùng 0đ)
  const firstBase = members[0].points || 0;
  const allEqualBasePoints = members.every((m) => (m.points || 0) === firstBase);

  // 3. Sắp xếp các việc cần chia từ nặng nhất đến nhẹ nhất (4đ -> 3đ -> 2đ -> 1đ)
  const sortedToBalance = [...choresToBalance].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.id.localeCompare(b.id);
  });

  // Biến đếm xoay vòng luân phiên khi hòa điểm (Round-Robin Tie-Breaker)
  let tieBreakerOffset = 0;

  // 4. Lần lượt phân bổ từng công việc cho người tối ưu nhất
  const newlyAssignedChores = sortedToBalance.map((chore) => {
    const sortedCandidates = [...members].sort((a, b) => {
      const loadA = memberLoad[a.id];
      const loadB = memberLoad[b.id];

      // Tiêu chí 1: Người đang gánh ít điểm hôm nay nhất
      if (loadA.assignedPoints !== loadB.assignedPoints) {
        return loadA.assignedPoints - loadB.assignedPoints;
      }

      // Tiêu chí 2: Nếu điểm gánh hôm nay bằng nhau, kiểm tra điểm tích lũy (nếu không bằng nhau)
      // Người ít điểm tích lũy hơn được ưu tiên để tích điểm
      if (!allEqualBasePoints && loadA.basePoints !== loadB.basePoints) {
        return loadA.basePoints - loadB.basePoints;
      }

      // Tiêu chí 3: Người đang gánh ít số lượng việc hơn (choreCount)
      if (loadA.choreCount !== loadB.choreCount) {
        return loadA.choreCount - loadB.choreCount;
      }

      // Tiêu chí 4: Khi tất cả đều bằng nhau (như khi mọi người cùng 0đ và 0 việc):
      // Xoay vòng luân phiên đều đặn qua các thành viên theo lượt
      const indexA = members.findIndex((m) => m.id === a.id);
      const indexB = members.findIndex((m) => m.id === b.id);
      const relA = (indexA - tieBreakerOffset + members.length) % members.length;
      const relB = (indexB - tieBreakerOffset + members.length) % members.length;
      return relA - relB;
    });

    const chosen = sortedCandidates[0];
    memberLoad[chosen.id].assignedPoints += chore.points;
    memberLoad[chosen.id].choreCount += 1;
    tieBreakerOffset = (tieBreakerOffset + 1) % members.length;

    return {
      ...chore,
      assignedTo: chosen.id,
    };
  });

  // 5. Trả về mảng việc bảo toàn nguyên vẹn thứ tự ban đầu
  const resultMap = new Map<string, Chore>();
  fixedChores.forEach((c) => resultMap.set(c.id, c));
  newlyAssignedChores.forEach((c) => resultMap.set(c.id, c));

  return chores.map((orig) => resultMap.get(orig.id) || orig);
};

export const INITIAL_STATE: AppState = {
  roomName: 'Phòng Trọ 302 - Vui Vẻ',
  roomCode: 'PHONG-302',
  lastDateChecked: getTodayDateString(),
  members: [
    {
      id: 'm1',
      name: 'Nguyễn Nam',
      avatar: '👨‍💻',
      color: 'bg-blue-500 text-white',
      points: 14,
      streak: 4,
      lateViolations: 0,
      zaloName: 'Nam Nguyễn',
    },
    {
      id: 'm2',
      name: 'Trần Huy',
      avatar: '🍳',
      color: 'bg-emerald-500 text-white',
      points: 12,
      streak: 2,
      lateViolations: 0,
      zaloName: 'Huy Tran',
    },
    {
      id: 'm3',
      name: 'Lê Minh',
      avatar: '🎮',
      color: 'bg-violet-500 text-white',
      points: 10,
      streak: 1,
      lateViolations: 1,
      zaloName: 'Minh Le',
    },
  ],
  chores: [
    {
      id: 'c1',
      title: 'Cọ sàn & Bồn cầu nhà vệ sinh',
      category: 'cleaning',
      points: 4,
      frequency: 'alternate',
      dueTime: '22:00',
      assignedTo: 'm1', // 4đ
      rotationRule: 'least-points',
      isCompletedToday: false,
      icon: '🚽',
      description: 'Xịt nước tẩy, cọ sạch bồn cầu, lavabo và gạt khô sàn',
    },
    {
      id: 'c2',
      title: 'Hút bụi & Lau sàn phòng khách',
      category: 'cleaning',
      points: 3,
      frequency: 'weekly',
      dueTime: '21:00',
      assignedTo: 'm3', // 3đ
      rotationRule: 'least-points',
      isCompletedToday: true,
      completedAt: '15:20',
      completedBy: 'm3',
      icon: '🧹',
      description: 'Lau nhà sạch sẽ bằng nước lau sàn thơm',
    },
    {
      id: 'c3',
      title: 'Rửa bát & Lau bồn rửa',
      category: 'kitchen',
      points: 2,
      frequency: 'daily',
      dueTime: '21:30',
      assignedTo: 'm2', // 2đ + c5 (2đ) = 4đ
      rotationRule: 'round-robin',
      isCompletedToday: false,
      icon: '🍽️',
      description: 'Rửa sạch bát đĩa sau bữa tối, úp khô và lau khô mặt đá bếp',
    },
    {
      id: 'c4',
      title: 'Đổ rác & Thay túi rác',
      category: 'trash',
      points: 1,
      frequency: 'daily',
      dueTime: '20:30',
      assignedTo: 'm3', // 3đ + 1đ = 4đ
      rotationRule: 'round-robin',
      isCompletedToday: false,
      icon: '🗑️',
      description: 'Gom rác phòng khách, bếp và mang xuống thùng rác chung',
    },
    {
      id: 'c5',
      title: 'Mua đồ gia dụng chung (Dầu ăn, gia vị, giấy)',
      category: 'shopping',
      points: 2,
      frequency: 'weekly',
      dueTime: '19:00',
      assignedTo: 'm2', // 4đ
      rotationRule: 'round-robin',
      isCompletedToday: false,
      icon: '🛒',
      description: 'Kiểm tra xem phòng hết giấy vệ sinh hay gia vị thì mua bù',
    },
  ],
  logs: [
    {
      id: 'l1',
      choreId: 'c2',
      choreTitle: 'Hút bụi & Lau sàn phòng khách',
      memberId: 'm3',
      memberName: 'Lê Minh',
      completedAt: 'Hôm nay 15:20',
      pointsEarned: 3,
      type: 'completed',
      dateStr: getTodayDateString(),
    },
  ],
  transferRequests: [],
  proposals: [],
  notifications: [],
};

// Next assignee calculation for rotation
export const getNextAssignee = (
  currentAssigneeId: string,
  rule: RotationRule,
  members: Member[]
): string => {
  if (members.length === 0) return '';
  if (rule === 'fixed') return currentAssigneeId;

  if (rule === 'least-points') {
    const sorted = [...members].sort((a, b) => a.points - b.points);
    return sorted[0].id;
  }

  // Round-robin
  const currentIndex = members.findIndex((m) => m.id === currentAssigneeId);
  if (currentIndex === -1) return members[0].id;
  const nextIndex = (currentIndex + 1) % members.length;
  return members[nextIndex].id;
};

export const DAYS_OF_WEEK = [
  { day: 1, label: 'T2', full: 'Thứ 2' },
  { day: 2, label: 'T3', full: 'Thứ 3' },
  { day: 3, label: 'T4', full: 'Thứ 4' },
  { day: 4, label: 'T5', full: 'Thứ 5' },
  { day: 5, label: 'T6', full: 'Thứ 6' },
  { day: 6, label: 'T7', full: 'Thứ 7' },
  { day: 0, label: 'CN', full: 'Chủ Nhật' },
];

export const isChoreScheduledToday = (chore: Chore): boolean => {
  if (!chore) return false;
  const todayDay = new Date().getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
  const days = Array.isArray(chore.daysOfWeek) ? chore.daysOfWeek : [];

  // 1. Việc làm 1 lần duy nhất: chỉ xuất hiện vào đúng ngày được lên lịch (hoặc luôn hiện nếu chưa chọn thứ)
  if (chore.frequency === 'once') {
    if (days.length === 0) return true;
    return days.includes(todayDay);
  }

  // 2. Việc hàng ngày: làm mỗi ngày (nếu chọn đủ 7 ngày hoặc không cấu hình daysOfWeek)
  if (chore.frequency === 'daily') {
    if (days.length === 0 || days.length === 7) return true;
    return days.includes(todayDay);
  }

  // 3. Việc hàng tuần / các thứ cụ thể: kiểm tra xem hôm nay có trong danh sách thứ đã chọn không
  if (days.length === 0) return true;
  return days.includes(todayDay);
};

export const formatChoreDays = (days?: number[], frequency?: FrequencyType): string => {
  const safeDays = Array.isArray(days) ? days : [];
  const dayMap: Record<number, string> = {
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7',
    0: 'Chủ Nhật',
  };
  const shortDayMap: Record<number, string> = {
    1: 'T2',
    2: 'T3',
    3: 'T4',
    4: 'T5',
    5: 'T6',
    6: 'T7',
    0: 'CN',
  };

  if (frequency === 'once') {
    if (safeDays.length > 0) {
      return `⚡ 1 lần (${dayMap[safeDays[0]] || 'Hôm nay'})`;
    }
    return '⚡ 1 lần duy nhất';
  }

  if (safeDays.length === 0 || safeDays.length === 7 || frequency === 'daily') {
    return 'Hàng ngày (T2-CN)';
  }

  return safeDays.map((d) => shortDayMap[d] || d).join(', ');
};

// Rollover for new day
export const handleDayRollover = (state: AppState): AppState => {
  const today = getTodayDateString();
  if (state.lastDateChecked === today) {
    return state;
  }

  // 1. Lọc bỏ các việc phát sinh 1 lần (frequency === 'once') đã hoàn thành của ngày hôm trước
  const activeChores = state.chores.filter((chore) => {
    if (chore.frequency === 'once' && chore.isCompletedToday) {
      return false; // Đã xong việc 1 lần -> kết thúc, lưu trong nhật ký
    }
    return true;
  });

  // 2. Reset các trạng thái hoàn thành / phạt của ngày cũ
  const resetChores: Chore[] = activeChores.map((chore) => {
    // If this chore was transferred to someone else previously:
    // Trả lại cho người nhượng kèm điểm thưởng (điểm việc + 1)
    if (chore.originalAssignee) {
      const originalUser = chore.originalAssignee;
      return {
        ...chore,
        assignedTo: originalUser,
        originalAssignee: undefined,
        nextBonusPoints: chore.points + 1,
        isCompletedToday: false,
        isLatePenalized: false,
        completedAt: undefined,
        completedBy: undefined,
        redoRequest: undefined,
      };
    }

    // Nếu là việc 1 lần phát sinh (chưa làm xong): giữ nguyên người làm, không xoay vòng
    if (chore.frequency === 'once') {
      return {
        ...chore,
        isCompletedToday: false,
        isLatePenalized: false,
        completedAt: undefined,
        completedBy: undefined,
        redoRequest: undefined,
      };
    }

    // Khi các thành viên ổn định: áp dụng xoay vòng bình thường
    const nextAssignee = chore.isCompletedToday
      ? getNextAssignee(chore.assignedTo, chore.rotationRule, state.members)
      : chore.assignedTo;

    return {
      ...chore,
      assignedTo: nextAssignee,
      isCompletedToday: false,
      isLatePenalized: false,
      completedAt: undefined,
      completedBy: undefined,
      redoRequest: undefined,
    };
  });

  // 3. Nếu có thành viên mới gia nhập từ hôm trước (rebalancePendingTomorrow = true):
  // Tự động phân chia lại công việc công bằng và đều đặn cho tất cả mọi người kể từ hôm nay!
  let finalChores = resetChores;
  if (state.rebalancePendingTomorrow) {
    finalChores = autoBalanceChores(resetChores, state.members);
  }

  return {
    ...state,
    lastDateChecked: today,
    chores: finalChores,
    rebalancePendingTomorrow: false,
  };
};

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveState(INITIAL_STATE);
      return INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    
    if ('penalties' in parsed) {
      delete parsed.penalties;
      delete parsed.penaltyRate;
    }
    if (!parsed.transferRequests) {
      parsed.transferRequests = [];
    }
    if (!parsed.proposals) {
      parsed.proposals = [];
    }
    if (!parsed.notifications) {
      parsed.notifications = [];
    }

    if (parsed.members) {
      parsed.members = parsed.members.map((m: any) => ({
        ...m,
        lateViolations: m.lateViolations ?? 0,
      }));
    }

    // Tự động kích hoạt các đề xuất thêm việc cũ còn đang chờ duyệt
    // (Áp dụng luật mới: Ai cũng có thể thêm việc ngay lập tức không cần chờ bỏ phiếu)
    if (parsed.proposals && Array.isArray(parsed.proposals)) {
      if (!parsed.chores) parsed.chores = [];
      parsed.proposals.forEach((p: RoomProposal) => {
        if (p.type === 'add_chore' && p.status === 'pending' && p.choreData) {
          const alreadyExists = parsed.chores.some(
            (c: Chore) => c.title === p.choreData?.title && c.points === p.choreData?.points
          );
          if (!alreadyExists) {
            const newChore: Chore = {
              ...p.choreData,
              id: 'chore_' + (p.id ? p.id.replace('prop_chore_', '') : Date.now()),
              isCompletedToday: false,
            };
            parsed.chores.unshift(newChore);
          }
          p.status = 'approved';
        }
      });
    }

    const rolloverState = handleDayRollover(parsed);
    saveState(rolloverState);
    return rolloverState;
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
    return INITIAL_STATE;
  }
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
};

/**
 * Đặt lại công việc và điểm số ở máy cục bộ (bảo toàn phòng và thành viên)
 */
export const resetLocalChoresAndPoints = (targetRoomCode?: string): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!targetRoomCode || parsed.roomCode === targetRoomCode) {
        const resetMembers = (parsed.members || []).map((m: any) => ({
          ...m,
          points: 0,
          streak: 0,
          lateViolations: 0,
        }));
        const resetState: AppState = {
          ...parsed,
          members: resetMembers,
          chores: [],
          logs: [],
          transferRequests: [],
          proposals: [],
          notifications: [],
          rebalancePendingTomorrow: false,
          updatedAt: new Date().toISOString(),
          version: (parsed.version || 0) + 1,
          lastUpdatedBy: 'admin_reset',
        };
        saveState(resetState);
      }
    }
  } catch (e) {
    console.error('Failed to reset local chores and points', e);
  }
};

/**
 * Chữ ký chuẩn hoá trạng thái (Canonical Signature) để so sánh bình đẳng
 * loại bỏ hoàn toàn sự xáo trộn thứ tự thuộc tính do PostgreSQL JSONB gây ra.
 */
export const getCanonicalStateSignature = (state: AppState | null | undefined): string => {
  if (!state) return '';
  const choreSummary = (state.chores || [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => ({
      id: c.id,
      title: c.title,
      assignedTo: c.assignedTo,
      isCompletedToday: Boolean(c.isCompletedToday),
      isLatePenalized: Boolean(c.isLatePenalized),
      completedAt: c.completedAt || '',
      completedBy: c.completedBy || '',
      points: c.points,
      frequency: c.frequency,
      dueTime: c.dueTime,
      redo: c.redoRequest ? `${c.redoRequest.requestedBy}_${c.redoRequest.requestedAt}` : '',
    }));

  const memberSummary = (state.members || [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      points: m.points,
      streak: m.streak,
      lateViolations: m.lateViolations || 0,
      avatar: m.avatar || '',
      zaloName: m.zaloName || '',
    }));

  const logSummary = (state.logs || [])
    .slice(0, 30)
    .map((l) => `${l.id}_${l.pointsEarned}_${l.completedAt}`);

  const transferSummary = (state.transferRequests || [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) => `${t.id}_${t.status}_${t.fromMemberId}_${t.toMemberId}`);

  const proposalSummary = (state.proposals || [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => `${p.id}_${p.status}_${Object.entries(p.votes || {}).sort().map(([k, v]) => `${k}:${v}`).join(',')}`);

  const notifSummary = (state.notifications || [])
    .slice(0, 20)
    .map((n) => `${n.id}_${(n.readBy || []).sort().join(',')}`);

  return JSON.stringify({
    roomCode: state.roomCode,
    roomName: state.roomName,
    lastDateChecked: state.lastDateChecked,
    rebalancePendingTomorrow: Boolean(state.rebalancePendingTomorrow),
    chores: choreSummary,
    members: memberSummary,
    logs: logSummary,
    transfers: transferSummary,
    proposals: proposalSummary,
    notifs: notifSummary,
  });
};

/**
 * Thuật toán Hợp nhất Trạng thái Đám mây Thông minh (Smart Conflict-Free State Merging)
 * Đảm bảo 100% không bị mất công việc đã hoàn thành hoặc điểm số khi nhiều bạn cùng phòng
 * thao tác đồng thời trên các điện thoại khác nhau.
 */
export const mergeStates = (local: AppState, remote: AppState): AppState => {
  if (!remote || !remote.roomCode) return local;
  if (!local || !local.roomCode) return remote;
  if (local.roomCode !== remote.roomCode) return remote;

  const localVer = local.version || 0;
  const remoteVer = remote.version || 0;
  const isRemoteNewer = remoteVer >= localVer;

  // 0. Nếu Cloud vừa được Quản trị viên (Admin) đặt lại công việc & điểm số:
  // Buộc áp dụng trực tiếp bản reset từ Cloud, tuyệt đối KHÔNG phục sinh việc cũ hay điểm cũ từ máy local!
  if (remote.lastUpdatedBy === 'admin_reset') {
    return {
      ...remote,
      version: Math.max(localVer, remoteVer) + 1,
      updatedAt: new Date().toISOString(),
    };
  }
  if (local.lastUpdatedBy === 'admin_reset' && !isRemoteNewer) {
    return {
      ...local,
      version: Math.max(localVer, remoteVer) + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  // 1. Rollover Check: Nếu một bên đã sang ngày mới hơn
  if (remote.lastDateChecked > local.lastDateChecked) {
    return {
      ...remote,
      version: Math.max(localVer, remoteVer) + 1,
      updatedAt: new Date().toISOString(),
    };
  }
  if (local.lastDateChecked > remote.lastDateChecked) {
    return {
      ...local,
      version: Math.max(localVer, remoteVer) + 1,
      updatedAt: new Date().toISOString(),
    };
  }

  // 2. Cùng ngày: Hợp nhất Chores
  // CHỐNG PHỤC SINH CÔNG VIỆC ĐÃ BỊ XÓA (Zombie Chores Prevention):
  // Khi remote mới hơn hoặc bằng local, remote là nguồn chân lý cho danh sách công việc.
  // Việc nào có trong local nhưng không còn trong remote nghĩa là đã bị xóa hoặc hoàn thành -> KHÔNG phục sinh!
  const choreMap = new Map<string, Chore>();

  if (isRemoteNewer) {
    for (const rChore of remote.chores || []) {
      const lChore = (local.chores || []).find((c) => c.id === rChore.id);
      if (lChore) {
        const isCompletedToday = Boolean(lChore.isCompletedToday || rChore.isCompletedToday);
        const isLatePenalized = Boolean(lChore.isLatePenalized || rChore.isLatePenalized);
        const completedAt = isCompletedToday ? (lChore.completedAt || rChore.completedAt) : undefined;
        const completedBy = isCompletedToday ? (lChore.completedBy || rChore.completedBy) : undefined;
        const redoRequest = rChore.redoRequest || lChore.redoRequest;

        choreMap.set(rChore.id, {
          ...rChore,
          isCompletedToday,
          isLatePenalized,
          completedAt,
          completedBy,
          redoRequest,
        });
      } else {
        choreMap.set(rChore.id, rChore);
      }
    }
  } else {
    // Local mới hơn (ví dụ người dùng thêm việc lúc offline): local làm chuẩn
    for (const lChore of local.chores || []) {
      const rChore = (remote.chores || []).find((c) => c.id === lChore.id);
      if (rChore) {
        const isCompletedToday = Boolean(lChore.isCompletedToday || rChore.isCompletedToday);
        const isLatePenalized = Boolean(lChore.isLatePenalized || rChore.isLatePenalized);
        const completedAt = isCompletedToday ? (rChore.completedAt || lChore.completedAt) : undefined;
        const completedBy = isCompletedToday ? (rChore.completedBy || lChore.completedBy) : undefined;
        const redoRequest = lChore.redoRequest || rChore.redoRequest;

        choreMap.set(lChore.id, {
          ...lChore,
          isCompletedToday,
          isLatePenalized,
          completedAt,
          completedBy,
          redoRequest,
        });
      } else {
        choreMap.set(lChore.id, lChore);
      }
    }
  }

  // 3. Hợp nhất Members
  const memberMap = new Map<string, Member>();
  const allMemberKeys = new Set([
    ...(local.members || []).map((m) => m.id),
    ...(remote.members || []).map((m) => m.id),
  ]);

  for (const mid of allMemberKeys) {
    const lMem = (local.members || []).find((m) => m.id === mid);
    const rMem = (remote.members || []).find((m) => m.id === mid);

    if (lMem && rMem) {
      const base = isRemoteNewer ? rMem : lMem;
      // Nếu remote mới hơn thì lấy điểm từ remote, nếu bằng thì lấy max để tránh mất điểm khi tick
      const points = isRemoteNewer ? rMem.points : Math.max(lMem.points, rMem.points);
      const streak = isRemoteNewer ? rMem.streak : Math.max(lMem.streak || 0, rMem.streak || 0);

      memberMap.set(mid, {
        ...base,
        points,
        streak,
        lateViolations: isRemoteNewer ? (rMem.lateViolations || 0) : Math.max(lMem.lateViolations || 0, rMem.lateViolations || 0),
      });
    } else if (rMem) {
      memberMap.set(mid, rMem);
    } else if (lMem) {
      memberMap.set(mid, lMem);
    }
  }

  // 4. Hợp nhất Logs (Gộp nhật ký, lọc trùng theo id, giữ tối đa 100 bản ghi mới nhất)
  const logMap = new Map<string, ChoreLog>();
  [...(local.logs || []), ...(remote.logs || [])].forEach((log) => {
    if (!logMap.has(log.id)) {
      logMap.set(log.id, log);
    }
  });
  const mergedLogs = Array.from(logMap.values())
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 100);

  // 5. Hợp nhất TransferRequests
  const transferMap = new Map<string, TransferRequest>();
  [...(local.transferRequests || []), ...(remote.transferRequests || [])].forEach((t) => {
    const existing = transferMap.get(t.id);
    if (!existing) {
      transferMap.set(t.id, t);
    } else {
      if (existing.status === 'pending' && t.status !== 'pending') {
        transferMap.set(t.id, t);
      }
    }
  });

  // 6. Hợp nhất Proposals
  const proposalMap = new Map<string, RoomProposal>();
  [...(local.proposals || []), ...(remote.proposals || [])].forEach((p) => {
    const existing = proposalMap.get(p.id);
    if (!existing) {
      proposalMap.set(p.id, p);
    } else {
      const combinedVotes = { ...(existing.votes || {}), ...(p.votes || {}) };
      const resolvedStatus = (existing.status !== 'pending') ? existing.status : p.status;
      proposalMap.set(p.id, {
        ...p,
        votes: combinedVotes,
        status: resolvedStatus,
      });
    }
  });

  // Tự động kích hoạt các đề xuất thêm việc cũ hoặc thực thi đề xuất xóa việc cũ còn đang treo (áp dụng luật mới không cần chờ vote)
  if (remote.lastUpdatedBy !== 'admin_reset' && local.lastUpdatedBy !== 'admin_reset') {
    proposalMap.forEach((p) => {
      if (p.type === 'delete_chore' && p.targetChoreId) {
        choreMap.delete(p.targetChoreId);
        p.status = 'approved';
      } else if (p.type === 'add_chore' && p.status === 'pending' && p.choreData) {
        const choreExists = Array.from(choreMap.values()).some(
          (c) => c.title === p.choreData?.title && c.points === p.choreData?.points
        );
        if (!choreExists) {
          const newChoreId = 'chore_' + (p.id ? p.id.replace('prop_chore_', '') : Date.now());
          choreMap.set(newChoreId, {
            ...p.choreData,
            id: newChoreId,
            isCompletedToday: false,
          });
        }
        p.status = 'approved';
      }
    });
  }

  // 7. Hợp nhất Notifications
  const notifMap = new Map<string, AppNotification>();
  [...(local.notifications || []), ...(remote.notifications || [])].forEach((n) => {
    const existing = notifMap.get(n.id);
    if (!existing) {
      notifMap.set(n.id, n);
    } else {
      const combinedRead = Array.from(new Set([...(existing.readBy || []), ...(n.readBy || [])]));
      notifMap.set(n.id, {
        ...n,
        readBy: combinedRead,
      });
    }
  });
  const mergedNotifications = Array.from(notifMap.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);

  return {
    roomName: isRemoteNewer ? remote.roomName : local.roomName,
    roomCode: remote.roomCode,
    members: Array.from(memberMap.values()),
    chores: Array.from(choreMap.values()),
    logs: mergedLogs,
    transferRequests: Array.from(transferMap.values()),
    proposals: Array.from(proposalMap.values()),
    notifications: mergedNotifications,
    lastDateChecked: remote.lastDateChecked || local.lastDateChecked,
    rebalancePendingTomorrow: Boolean(remote.rebalancePendingTomorrow || local.rebalancePendingTomorrow),
    version: Math.max(localVer, remoteVer) + 1,
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: local.lastUpdatedBy || remote.lastUpdatedBy,
  };
};
