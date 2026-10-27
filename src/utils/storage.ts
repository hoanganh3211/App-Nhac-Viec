import { AppState, Chore, Member, RotationRule } from '../types';

const STORAGE_KEY = 'app_nhac_viec_data_v1';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_STATE: AppState = {
  roomName: 'Phòng Trọ 302 - Vui Vẻ',
  roomCode: 'PHONG-302',
  penaltyRate: 10000,
  lastDateChecked: getTodayDateString(),
  members: [
    {
      id: 'm1',
      name: 'Nguyễn Nam',
      avatar: '👨‍💻',
      color: 'bg-blue-500 text-white',
      points: 14,
      streak: 4,
      zaloName: 'Nam Nguyễn',
    },
    {
      id: 'm2',
      name: 'Trần Huy',
      avatar: '🍳',
      color: 'bg-emerald-500 text-white',
      points: 12,
      streak: 2,
      zaloName: 'Huy Tran',
    },
    {
      id: 'm3',
      name: 'Lê Minh',
      avatar: '🎮',
      color: 'bg-violet-500 text-white',
      points: 10,
      streak: 1,
      zaloName: 'Minh Le',
    },
  ],
  chores: [
    {
      id: 'c1',
      title: 'Đổ rác & Thay túi rác',
      category: 'trash',
      points: 1,
      frequency: 'daily',
      dueTime: '20:30',
      assignedTo: 'm3',
      rotationRule: 'round-robin',
      isCompletedToday: false,
      icon: '🗑️',
      description: 'Gom rác phòng khách, bếp và mang xuống thùng rác chung',
    },
    {
      id: 'c2',
      title: 'Rửa bát & Lau bồn rửa',
      category: 'kitchen',
      points: 2,
      frequency: 'daily',
      dueTime: '21:30',
      assignedTo: 'm2',
      rotationRule: 'round-robin',
      isCompletedToday: false,
      icon: '🍽️',
      description: 'Rửa sạch bát đĩa sau bữa tối, úp khô và lau khô mặt đá bếp',
    },
    {
      id: 'c3',
      title: 'Cọ sàn & Bồn cầu nhà vệ sinh',
      category: 'cleaning',
      points: 4,
      frequency: 'alternate',
      dueTime: '22:00',
      assignedTo: 'm1',
      rotationRule: 'least-points',
      isCompletedToday: false,
      icon: '🚽',
      description: 'Xịt nước tẩy, cọ sạch bồn cầu, lavabo và gạt khô sàn',
    },
    {
      id: 'c4',
      title: 'Hút bụi & Lau sàn phòng khách',
      category: 'cleaning',
      points: 3,
      frequency: 'weekly',
      dueTime: '21:00',
      assignedTo: 'm3',
      rotationRule: 'least-points',
      isCompletedToday: true,
      completedAt: '15:20',
      completedBy: 'm3',
      icon: '🧹',
      description: 'Lau nhà sạch sẽ bằng nước lau sàn thơm',
    },
    {
      id: 'c5',
      title: 'Mua đồ gia dụng chung (Dầu ăn, gia vị, giấy)',
      category: 'shopping',
      points: 2,
      frequency: 'weekly',
      dueTime: '19:00',
      assignedTo: 'm2',
      rotationRule: 'round-robin',
      isCompletedToday: false,
      icon: '🛒',
      description: 'Kiểm tra xem phòng hết giấy vệ sinh, nước rửa bát hay gia vị thì mua bù',
    },
  ],
  logs: [
    {
      id: 'l1',
      choreId: 'c4',
      choreTitle: 'Hút bụi & Lau sàn phòng khách',
      memberId: 'm3',
      memberName: 'Lê Minh',
      completedAt: 'Hôm nay lúc 15:20',
      pointsEarned: 3,
    },
    {
      id: 'l2',
      choreId: 'c1',
      choreTitle: 'Đổ rác & Thay túi rác',
      memberId: 'm1',
      memberName: 'Nguyễn Nam',
      completedAt: 'Hôm qua lúc 20:15',
      pointsEarned: 1,
    },
    {
      id: 'l3',
      choreId: 'c2',
      choreTitle: 'Rửa bát & Lau bồn rửa',
      memberId: 'm2',
      memberName: 'Trần Huy',
      completedAt: 'Hôm qua lúc 21:40',
      pointsEarned: 2,
    },
  ],
  penalties: [
    {
      id: 'p1',
      memberId: 'm3',
      memberName: 'Lê Minh',
      amount: 10000,
      reason: 'Quên đổ rác ngày 24/10',
      date: '24/10/2026',
      status: 'paid',
    },
  ],
};

// Next assignee calculation based on fairness algorithm
export const getNextAssignee = (
  currentAssigneeId: string,
  rule: RotationRule,
  members: Member[]
): string => {
  if (members.length === 0) return '';
  if (rule === 'fixed') return currentAssigneeId;

  if (rule === 'least-points') {
    // Sort by points ascending (person with lowest karma gets the next heavy task)
    const sorted = [...members].sort((a, b) => a.points - b.points);
    return sorted[0].id;
  }

  // Default: round-robin (xoay vòng tuần tự)
  const currentIndex = members.findIndex((m) => m.id === currentAssigneeId);
  if (currentIndex === -1) return members[0].id;
  const nextIndex = (currentIndex + 1) % members.length;
  return members[nextIndex].id;
};

// Check and handle day rollover (chuyển sang ngày mới)
export const handleDayRollover = (state: AppState): AppState => {
  const today = getTodayDateString();
  if (state.lastDateChecked === today) {
    return state;
  }

  // It's a new day! Rotate uncompleted tasks or rotate completed ones
  const updatedChores: Chore[] = state.chores.map((chore) => {
    // If it was completed yesterday, rotate to the next person and mark uncompleted
    const nextAssignee = chore.isCompletedToday
      ? getNextAssignee(chore.assignedTo, chore.rotationRule, state.members)
      : chore.assignedTo;

    return {
      ...chore,
      assignedTo: nextAssignee,
      isCompletedToday: false,
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
