export interface Member {
  id: string;
  name: string;
  avatar: string; // emoji or initial
  color: string; // Tailwind color class or hex
  points: number; // Điểm tích lũy công việc
  streak: number; // Chuỗi ngày hoàn thành liên tục
  zaloName?: string; // Tên hiển thị/tag trong Zalo
}

export type FrequencyType = 'daily' | 'alternate' | 'weekly' | 'custom';
export type RotationRule = 'round-robin' | 'least-points' | 'fixed';

export interface Chore {
  id: string;
  title: string;
  category: 'cleaning' | 'kitchen' | 'trash' | 'shopping' | 'other';
  points: number; // 1 (nhẹ), 2 (vừa), 3-5 (nặng như cọ toilet/lau bếp dầu mỡ)
  frequency: FrequencyType;
  dueTime: string; // Ví dụ: "20:00"
  assignedTo: string; // memberId
  rotationRule: RotationRule;
  isCompletedToday: boolean;
  completedAt?: string;
  completedBy?: string;
  icon: string;
  description?: string;
}

export interface ChoreLog {
  id: string;
  choreId: string;
  choreTitle: string;
  memberId: string;
  memberName: string;
  completedAt: string;
  pointsEarned: number;
  note?: string;
}

export interface PenaltyRecord {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'paid';
}

export interface AppState {
  roomName: string;
  roomCode: string;
  members: Member[];
  chores: Chore[];
  logs: ChoreLog[];
  penalties: PenaltyRecord[];
  lastDateChecked: string; // Dùng để reset chu kỳ ngày mới (YYYY-MM-DD)
  penaltyRate: number; // Ví dụ 10,000 VND / lần trễ
}
