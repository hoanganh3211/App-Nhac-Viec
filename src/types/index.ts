export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
  points: number; // Điểm tích lũy công việc
  streak: number; // Chuỗi ngày hoàn thành liên tục
  lateViolations: number; // Số lần trễ hạn (dùng để phạt trừ điểm nặng hơn nếu tái phạm)
  zaloName?: string;
}

export type FrequencyType = 'daily' | 'alternate' | 'weekly' | 'custom' | 'once';
export type RotationRule = 'round-robin' | 'least-points' | 'fixed';

export interface RedoRequest {
  requestedBy: string;
  requestedByName: string;
  reason: string;
  requestedAt: string;
}

export interface Chore {
  id: string;
  title: string;
  category: 'cleaning' | 'kitchen' | 'trash' | 'shopping' | 'other';
  points: number; // Điểm cơ bản (việc nặng nhiều điểm)
  frequency: FrequencyType;
  daysOfWeek?: number[]; // Các thứ trong tuần làm việc này: 0 = CN, 1 = T2, ..., 6 = T7
  dueTime: string; // Ví dụ "20:00"
  assignedTo: string; // memberId đang phụ trách
  rotationRule: RotationRule;
  isCompletedToday: boolean;
  completedAt?: string;
  completedBy?: string;
  icon: string;
  description?: string;
  originalAssignee?: string; // Người nhượng việc ban đầu (để hoàn trả ở chu kỳ kế tiếp)
  nextBonusPoints?: number; // Điểm thưởng khi người nhượng làm lại ở lượt sau: (điểm việc + 1)
  isLatePenalized?: boolean; // Đánh dấu đã trừ điểm trễ hôm nay
  redoRequest?: RedoRequest; // Yêu cầu làm lại do làm chưa tốt / chưa sạch
}

export interface ChoreLog {
  id: string;
  choreId: string;
  choreTitle: string;
  memberId: string;
  memberName: string;
  completedAt: string;
  pointsEarned: number; // Dương nếu cộng, Âm nếu bị trừ điểm trễ
  type?: 'completed' | 'late_penalty' | 'transfer_fee' | 'transfer_reward' | 'recovery_bonus' | 'redo_requested';
  note?: string;
  dateStr?: string; // Định dạng YYYY-MM-DD để tổng hợp lịch & heatmap
}

export interface TransferRequest {
  id: string;
  choreId: string;
  choreTitle: string;
  choreIcon: string;
  chorePoints: number;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export type ProposalType = 'add_chore' | 'delete_member' | 'edit_chore' | 'delete_chore';

export interface RoomProposal {
  id: string;
  type: ProposalType;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  createdAt: string;
  choreData?: Omit<Chore, 'id' | 'isCompletedToday'>;
  targetChoreId?: string;
  updatedChoreData?: Partial<Omit<Chore, 'id' | 'assignedTo' | 'isCompletedToday'>>;
  targetMemberId?: string;
  targetMemberName?: string;
  votes: Record<string, 'agree' | 'reject'>; // memberId -> 'agree' | 'reject'
  status: 'pending' | 'approved' | 'rejected';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'chore_completed' | 'proposal_vote' | 'chore_redo' | 'chore_transfer' | 'proposal_result';
  createdAt: string;
  readBy: string[]; // Danh sách memberId đã đọc thông báo này
  proposalId?: string;
  choreId?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  todayReminderEnabled: boolean;
  todayReminderTime: string; // "08:00"
  tomorrowPreviewEnabled: boolean;
  tomorrowPreviewTime: string; // "21:00"
  urgentDeadlineEnabled: boolean;
  roomActivitiesEnabled: boolean;
}

export interface AppState {
  roomName: string;
  roomCode: string;
  members: Member[];
  chores: Chore[];
  logs: ChoreLog[];
  transferRequests: TransferRequest[];
  proposals?: RoomProposal[]; // Các đề xuất quan trọng cần biểu quyết quá bán
  notifications?: AppNotification[]; // Danh sách thông báo hoạt động phòng
  lastDateChecked: string;
  rebalancePendingTomorrow?: boolean; // Đánh dấu chia đều lại việc vào ngày mai khi có người mới gia nhập
}
