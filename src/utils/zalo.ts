import { Chore, Member } from '../types';
import { isChoreScheduledToday } from './storage';

export const generateZaloDailyReminder = (
  roomName: string,
  roomCode: string,
  chores: Chore[],
  members: Member[]
): string => {
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  const memberMap = new Map((members || []).map((m) => [m.id, m]));
  // Chỉ lọc các công việc thực sự lên lịch làm vào HÔM NAY (tránh việc Chủ Nhật hiện vào Thứ Ba)
  const todayChores = (chores || []).filter((c) => isChoreScheduledToday(c));
  const pendingChores = todayChores.filter((c) => !c.isCompletedToday);
  const doneChores = todayChores.filter((c) => c.isCompletedToday);
  const inviteUrl = `${window.location.origin}?room=${encodeURIComponent(roomCode)}`;

  let message = `🏠 [${roomName.toUpperCase()}] - LỜI NHẮC VIỆC NHÀ (${today})\n`;
  message += `🔑 Mã phòng: ${roomCode}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (todayChores.length === 0) {
    message += `🎉 Hôm nay phòng mình không có việc nhà nào được lên lịch!\nMọi người hãy nghỉ ngơi và tận hưởng nhé ✨\n`;
  } else if (pendingChores.length === 0) {
    message += `🎉 Tuyệt vời! Tất cả việc nhà hôm nay (${todayChores.length}/${todayChores.length}) đã hoàn thành 100%!\nPhòng mình siêu sạch sẽ và ngăn nắp! ✨\n`;
  } else {
    message += `📋 VIỆC CẦN LÀM HÔM NAY (${pendingChores.length} việc):\n`;
    pendingChores.forEach((chore, index) => {
      const assignee = memberMap.get(chore.assignedTo);
      const assigneeName = assignee ? `@${assignee.zaloName || assignee.name}` : 'Chưa giao';
      const rewardPoints = chore.nextBonusPoints || chore.points;
      message += `${index + 1}. ${chore.icon} ${chore.title}\n`;
      message += `   ⏰ Hạn: ${chore.dueTime} | ⭐ ${rewardPoints}đ\n`;
      message += `   👉 Phụ trách: ${assigneeName}\n\n`;
    });
  }

  if (doneChores.length > 0) {
    message += `✅ ĐÃ XONG (${doneChores.length}/${todayChores.length}):\n`;
    doneChores.forEach((chore) => {
      const completedPerson = memberMap.get(chore.completedBy || chore.assignedTo);
      message += `• ${chore.icon} ${chore.title} (${completedPerson?.name || 'Đã xong'})\n`;
    });
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👉 Vào app tick việc: ${inviteUrl}\n`;
  message += `🔑 Mã phòng độc lập: ${roomCode} (Nhập mã nếu vào app thủ công)\n`;
  message += `⚠️ Lưu ý: Quá hạn chưa xong sẽ bị trừ điểm, tái phạm trừ (điểm việc + 2)!`;

  return message;
};

export const shareToZalo = async (text: string): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Nhắc Việc Nhà',
        text: text,
      });
      return true;
    } catch {}
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
};
