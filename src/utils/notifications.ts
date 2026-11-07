import { playNotificationSound } from './audio';
import { Chore } from '../types';
import { isChoreScheduledToday, getTodayDateString } from './storage';

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
    if (perm === 'granted') {
      sendBrowserNotification('🔔 Đã bật thông báo thành công!', {
        body: 'ViệcNhà sẽ nhắc nhở bạn khi sắp đến giờ làm việc và khi bạn cùng phòng hoàn thành việc.',
        tag: 'welcome_notification',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to request notification permission', err);
    return false;
  }
};

interface SendNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
  soundType?: 'chime' | 'bell' | 'marimba' | 'pop';
}

/**
 * Gửi thông báo đẩy ra màn hình (Web Notification API + Service Worker)
 * Kèm phát âm thanh chuông thông báo (Web Audio Synthesizer)
 */
export const sendBrowserNotification = async (
  title: string,
  options?: SendNotificationOptions
) => {
  // 1. Luôn phát âm thanh chuông để người dùng nghe thấy
  try {
    playNotificationSound(options?.soundType || 'chime');
  } catch {}

  // 2. Nếu chưa cấp quyền hoặc không hỗ trợ -> dừng
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const notificationOptions: NotificationOptions = {
    body: options?.body || '',
    icon: options?.icon || '/pwa-512x512.svg',
    badge: '/pwa-512x512.svg',
    tag: options?.tag || 'app_chore_notif',
    data: options?.data || { url: window.location.href },
    ...({ vibrate: [200, 100, 200] } as any),
  };

  try {
    // Ưu tiên Service Worker registration để hiện được cả khi ở chế độ nền (Background PWA)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return;
      }
    }

    // Fallback nếu không có SW
    new Notification(title, notificationOptions);
  } catch (err) {
    console.warn('Could not display system push notification:', err);
  }
};

/**
 * Tự động kiểm tra thời hạn các công việc của người dùng hôm nay và đẩy thông báo nhắc nhở
 */
export const checkUpcomingChoresAndNotify = (
  chores: Chore[],
  currentUserId: string | null
) => {
  if (!currentUserId || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const todayStr = getTodayDateString();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const myChoresToday = chores.filter(
    (c) => c.assignedTo === currentUserId && isChoreScheduledToday(c) && !c.isCompletedToday
  );

  myChoresToday.forEach((chore) => {
    if (!chore.dueTime || !chore.dueTime.includes(':')) return;

    const [dueH, dueM] = chore.dueTime.split(':').map(Number);
    const dueMinutes = dueH * 60 + dueM;
    const diff = dueMinutes - currentMinutes; // Phút còn lại đến hạn

    // Mốc 1: Sắp đến giờ làm (còn từ 0 đến 30 phút)
    if (diff > 0 && diff <= 30) {
      const key = `notif_soon_${todayStr}_${chore.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, 'true');
        sendBrowserNotification(`⏰ Sắp đến giờ: "${chore.title}"`, {
          body: `Chỉ còn ${diff} phút nữa là đến hạn (${chore.dueTime}). Hãy chuẩn bị làm nhé!`,
          tag: `chore_soon_${chore.id}`,
          soundType: 'bell',
        });
      }
    }

    // Mốc 2: Đến giờ hạn chót (quá 0-60 phút)
    if (diff <= 0 && diff >= -60) {
      const key = `notif_due_${todayStr}_${chore.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, 'true');
        sendBrowserNotification(`⚠️ Đến giờ làm: "${chore.title}"`, {
          body: `Hạn hoàn thành là ${chore.dueTime}. Hoàn thành và tick ngay nhé!`,
          tag: `chore_due_${chore.id}`,
          soundType: 'chime',
        });
      }
    }
  });
};
