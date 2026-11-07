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
        body: 'ViệcNhà sẽ nhắc nhở đều đặn các khung giờ trong ngày và khi bạn cùng phòng hoàn thành việc.',
        tag: 'welcome_notification',
        soundType: 'bell',
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
 * Cấu hình các khung giờ nhắc việc đều đặn trong ngày
 * 1. 08:00 - 11:00 (Sáng): Điểm danh việc cần làm trong ngày
 * 2. 12:00 - 14:00 (Trưa): Nhắc tiến độ trưa cho các việc chưa làm
 * 3. 18:00 - 20:30 (Chiều tối): Nhắc việc buổi tối trước giờ ăn/nghỉ ngơi
 * 4. 21:00 - 23:59 (Tối muộn): Nhắc việc sát hạn chót đêm
 */
interface ReminderSlot {
  id: string;
  startMinutes: number; // Số phút tính từ 00:00
  endMinutes: number;
  title: (name: string, count: number) => string;
  getPrefix: (count: number) => string;
  soundType: 'bell' | 'chime' | 'marimba';
}

const DAILY_REMINDER_SLOTS: ReminderSlot[] = [
  {
    id: 'morning',
    startMinutes: 8 * 60, // 08:00
    endMinutes: 11 * 60,  // 11:00
    title: (name, count) => `☀️ Chào buổi sáng ${name}! (Còn ${count} việc hôm nay)`,
    getPrefix: (count) => `Danh sách ${count} việc cần làm hôm nay:`,
    soundType: 'bell',
  },
  {
    id: 'noon',
    startMinutes: 12 * 60, // 12:00
    endMinutes: 14 * 60,   // 14:00
    title: (name, count) => `🍲 Nhắc việc buổi trưa, ${name}! (${count} việc)`,
    getPrefix: (count) => `Bạn vẫn còn ${count} việc chưa hoàn thành:`,
    soundType: 'chime',
  },
  {
    id: 'evening',
    startMinutes: 18 * 60, // 18:00
    endMinutes: 20 * 60 + 30, // 20:30
    title: (name, count) => `🌆 Nhắc việc chiều tối, ${name}! (${count} việc)`,
    getPrefix: (count) => `Còn ${count} việc cần hoàn thành trước khi hết ngày:`,
    soundType: 'bell',
  },
  {
    id: 'night',
    startMinutes: 21 * 60, // 21:00
    endMinutes: 23 * 60 + 59, // 23:59
    title: (name, count) => `🌙 Nhắc việc tối muộn, ${name}! (${count} việc)`,
    getPrefix: (count) => `Đừng quên hoàn tất ${count} việc còn lại nhé:`,
    soundType: 'chime',
  },
];

/**
 * Đều đặn kiểm tra các khung giờ trong ngày để gửi thông báo tóm tắt các việc chưa làm
 */
export const checkDailyTimeSlotsAndNotify = (
  chores: Chore[],
  currentUserId: string | null,
  memberName: string = 'bạn'
) => {
  if (!currentUserId || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const todayStr = getTodayDateString();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Lấy các công việc của thành viên được lên lịch làm hôm nay và CHƯA HOÀN THÀNH
  const myPendingChores = chores.filter(
    (c) => c.assignedTo === currentUserId && isChoreScheduledToday(c) && !c.isCompletedToday
  );

  // Nếu đã làm xong hết, không cần làm phiền
  if (myPendingChores.length === 0) return;

  DAILY_REMINDER_SLOTS.forEach((slot) => {
    // Nếu giờ hiện tại nằm trong khung giờ của slot
    if (currentMinutes >= slot.startMinutes && currentMinutes <= slot.endMinutes) {
      const storageKey = `notif_slot_${todayStr}_${slot.id}_${currentUserId}`;
      // Chỉ gửi đúng 1 lần cho mỗi khung giờ trong ngày
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, 'true');

        const choreListStr = myPendingChores
          .slice(0, 3)
          .map((c) => `• ${c.title} (${c.dueTime})`)
          .join('\n');
        const moreCount =
          myPendingChores.length > 3
            ? `\n... và ${myPendingChores.length - 3} việc khác`
            : '';

        sendBrowserNotification(slot.title(memberName, myPendingChores.length), {
          body: `${slot.getPrefix(myPendingChores.length)}\n${choreListStr}${moreCount}`,
          tag: `daily_slot_${slot.id}_${todayStr}`,
          soundType: slot.soundType,
        });
      }
    }
  });
};

/**
 * Tự động kiểm tra thời hạn từng công việc của người dùng hôm nay và đẩy thông báo sát hạn
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

/**
 * Gửi thông báo tóm tắt tức thì tình trạng công việc của thành viên (dùng khi bấm chuông kiểm tra)
 */
export const sendInstantChoreSummary = (
  chores: Chore[],
  currentUserId: string | null,
  memberName: string = 'bạn'
) => {
  const myPendingChores = chores.filter(
    (c) => c.assignedTo === currentUserId && isChoreScheduledToday(c) && !c.isCompletedToday
  );

  if (myPendingChores.length === 0) {
    sendBrowserNotification(`🎉 Tuyệt vời, ${memberName}!`, {
      body: 'Bạn đã hoàn thành hết toàn bộ công việc nhà của hôm nay rồi. Hãy nghỉ ngơi nhé!',
      tag: 'summary_all_done',
      soundType: 'marimba',
    });
  } else {
    const choreListStr = myPendingChores
      .slice(0, 3)
      .map((c) => `• ${c.title} (${c.dueTime})`)
      .join('\n');
    const moreCount =
      myPendingChores.length > 3
        ? `\n... và ${myPendingChores.length - 3} việc khác`
        : '';

    sendBrowserNotification(`📋 ${memberName} ơi, còn ${myPendingChores.length} việc chưa làm!`, {
      body: `Các việc cần làm hôm nay:\n${choreListStr}${moreCount}`,
      tag: `summary_pending_${Date.now()}`,
      soundType: 'bell',
    });
  }
};
