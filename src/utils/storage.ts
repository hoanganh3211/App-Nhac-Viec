import { AppState, Chore, Member, RotationRule } from '../types';

const STORAGE_KEY = 'app_nhac_viec_data_v1';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Thuật toán phân chia công việc công bằng (Fair Workload Distribution)
 * - Sắp xếp việc từ nặng nhất đến nhẹ nhất (4đ -> 3đ -> 2đ -> 1đ)
 * - Lần lượt gán mỗi việc cho thành viên đang gánh ít điểm nhất hôm nay
 * - Đảm bảo tổng điểm việc nhà phân bổ đều nhất có thể cho tất cả mọi người
 */
export const autoBalanceChores = (chores: Chore[], members: Member[]): Chore[] => {
  if (!members.length || !chores.length) return chores;

  // Khởi tạo điểm việc gánh trong ngày của từng người
  const memberDailyLoad: Record<string, number> = {};
  members.forEach((m) => {
    memberDailyLoad[m.id] = 0;
  });

  // Sắp xếp việc nặng ưu tiên phân chia trước
  const sortedChores = [...chores].sort((a, b) => b.points - a.points);

  return sortedChores.map((chore) => {
    // Nếu việc này đang được người khác nhận nhượng việc hoặc có quy định riêng thì giữ nguyên
    if (chore.originalAssignee) {
      return chore;
    }

    // Tìm thành viên đang có khối lượng công việc hôm nay nhẹ nhất
    const sortedMembers = [...members].sort(
      (a, b) => memberDailyLoad[a.id] - memberDailyLoad[b.id]
    );
    const chosenMember = sortedMembers[0];
    memberDailyLoad[chosenMember.id] += chore.points;

    return {
      ...chore,
      assignedTo: chosenMember.id,
    };
  });
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
    },
  ],
  transferRequests: [],
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

// Rollover for new day
export const handleDayRollover = (state: AppState): AppState => {
  const today = getTodayDateString();
  if (state.lastDateChecked === today) {
    return state;
  }

  const updatedChores: Chore[] = state.chores.map((chore) => {
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
      };
    }

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
    };
  });

  return {
    ...state,
    lastDateChecked: today,
    chores: updatedChores,
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

    if (parsed.members) {
      parsed.members = parsed.members.map((m: any) => ({
        ...m,
        lateViolations: m.lateViolations ?? 0,
      }));
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
