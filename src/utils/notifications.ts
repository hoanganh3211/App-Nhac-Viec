import { Chore, Member } from '../types';

const NOTIFIED_CHORES_KEY = 'app_nhac_viec_notified_today';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) {
    console.error('Error requesting notification permission', e);
    return false;
  }
};

export const checkAndNotifyMyChores = (
  chores: Chore[],
  currentUserId: string | null,
  currentMember?: Member
): void => {
  if (!currentUserId || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  // Get chores assigned ONLY to this user that are not completed today
  const myPendingChores = chores.filter(
    (c) => c.assignedTo === currentUserId && !c.isCompletedToday
  );

  if (myPendingChores.length === 0) return;

  const todayKey = new Date().toISOString().split('T')[0];
  let notifiedMap: Record<string, string[]> = {};
  try {
    const raw = localStorage.getItem(NOTIFIED_CHORES_KEY);
    if (raw) notifiedMap = JSON.parse(raw);
  } catch {
    notifiedMap = {};
  }

  const alreadyNotified = notifiedMap[todayKey] || [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  myPendingChores.forEach((chore) => {
    if (alreadyNotified.includes(chore.id)) return;

    // Parse dueTime
    const [dueH, dueM] = chore.dueTime.split(':').map(Number);
    const dueMinutes = dueH * 60 + dueM;

    // Notify if within 30 minutes before due time or overdue
    if (currentMinutes >= dueMinutes - 30) {
      const isOverdue = currentMinutes > dueMinutes;
      const title = isOverdue
        ? `⚠️ [Quá hạn] ${currentMember?.name || 'Bạn'} ơi!`
        : `⏰ [Đến giờ làm] ${currentMember?.name || 'Bạn'} ơi!`;

      const body = isOverdue
        ? `Việc "${chore.title}" đã quá hạn (${chore.dueTime}). Hãy hoàn thành và tick ngay nhé!`
        : `Hôm nay bạn phụ trách "${chore.title}" (Hạn chót: ${chore.dueTime}).`;

      try {
        new Notification(title, {
          body,
          icon: '/pwa-512x512.svg',
          badge: '/pwa-512x512.svg',
          tag: `chore-${chore.id}`,
        });

        alreadyNotified.push(chore.id);
      } catch (e) {
        console.error('Failed to trigger notification', e);
      }
    }
  });

  notifiedMap[todayKey] = alreadyNotified;
  localStorage.setItem(NOTIFIED_CHORES_KEY, JSON.stringify(notifiedMap));
};
