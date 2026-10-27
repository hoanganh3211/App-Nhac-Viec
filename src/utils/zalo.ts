import { Chore, Member } from '../types';

export const generateZaloDailyReminder = (
  roomName: string,
  chores: Chore[],
  members: Member[]
): string => {
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const pendingChores = chores.filter((c) => !c.isCompletedToday);
  const doneChores = chores.filter((c) => c.isCompletedToday);

  let message = `🏠 [${roomName.toUpperCase()}] - LỜI NHẮC VIỆC NHÀ (${today})\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (pendingChores.length === 0) {
    message += `🎉 Tuyệt vời! Tất cả công việc hôm nay đã được hoàn thành 100%!\nPhòng mình hôm nay siêu sạch sẽ! ✨\n`;
  } else {
    message += `📋 VIỆC CẦN LÀM HÔM NAY:\n`;
    pendingChores.forEach((chore, index) => {
      const assignee = memberMap.get(chore.assignedTo);
      const assigneeName = assignee ? `@${assignee.zaloName || assignee.name}` : 'Chưa phân công';
      message += `${index + 1}. ${chore.icon} ${chore.title}\n`;
      message += `   ⏰ Hạn chót: ${chore.dueTime} | ⭐ ${chore.points}đ\n`;
      message += `   👉 Phụ trách: ${assigneeName}\n\n`;
    });
  }

  if (doneChores.length > 0) {
    message += `✅ ĐÃ XONG:\n`;
    doneChores.forEach((chore) => {
      const completedPerson = memberMap.get(chore.completedBy || chore.assignedTo);
      message += `• ${chore.icon} ${chore.title} (${completedPerson?.name || 'Đã xong'})\n`;
    });
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💡 Làm xong mọi người nhớ mở App tick đã hoàn thành nhé!\n`;
  message += `🔗 Truy cập app phòng: ${window.location.origin}\n`;
  message += `⚠️ Nhắc nhở: Quá 23:00 chưa làm sẽ phạt vui vẻ theo quy ước phòng nha! ☕`;

  return message;
};

export const shareToZalo = async (text: string): Promise<boolean> => {
  // Try Web Share API first (on mobile Safari/Chrome, this allows picking Zalo directly!)
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Nhắc Việc Nhà',
        text: text,
      });
      return true;
    } catch {
      // User cancelled or share failed, fallback to copy
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
};
