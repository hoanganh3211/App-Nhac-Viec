import { Chore, Member, NotificationSettings, AppNotification } from '../types';
import { getNextAssignee, autoBalanceChores, getTodayDateString } from './storage';

export const NOTIFICATION_SETTINGS_KEY = 'app_nhac_viec_notification_settings';
export const NOTIFIED_MILESTONES_KEY = 'app_nhac_viec_notified_milestones';
export const DAILY_SCHEDULED_NOTIFS_KEY = 'app_nhac_viec_daily_scheduled_notifs';
export const PUSHED_REMOTE_NOTIFS_KEY = 'app_nhac_viec_pushed_remote_notifs';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  todayReminderEnabled: true,
  todayReminderTime: '08:00',
  tomorrowPreviewEnabled: true,
  tomorrowPreviewTime: '21:00',
  urgentDeadlineEnabled: true,
  roomActivitiesEnabled: true,
};

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save notification settings', e);
  }
};

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
  );
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

/**
 * Triggers a push notification via Service Worker registration (native mobile experience)
 * or falls back to standard Notification constructor.
 */
export const triggerPushNotification = async (
  title: string,
  options?: NotificationOptions
): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultOptions: NotificationOptions = {
    icon: '/pwa-512x512.svg',
    badge: '/pwa-512x512.svg',
    data: {
      url: typeof window !== 'undefined' ? window.location.href : '/',
    },
    ...options,
  };

  // 1. Try Service Worker showNotification (Best for Android PWA and iOS 16.4+ standalone)
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          ...defaultOptions,
          // Mobile vibration pattern: [vibrate, pause, vibrate, pause, vibrate]
          vibrate: [250, 100, 250, 100, 250] as unknown as number[],
        } as NotificationOptions);
        return true;
      }
    }
  } catch (err) {
    console.warn('Service Worker showNotification error, falling back:', err);
  }

  // 2. Fallback to standard Notification constructor
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Notification constructor fallback error:', err);
    return false;
  }
};

/**
 * Predicts tomorrow's chores for a given member based on rotation rules,
 * transfers returning, and pending newcomer rebalancing.
 */
export const getTomorrowChoresForUser = (
  chores: Chore[],
  members: Member[],
  userId: string,
  rebalancePendingTomorrow?: boolean
): Chore[] => {
  if (!userId || members.length === 0) return [];

  // If newcomer joined and rebalance is scheduled for tomorrow:
  if (rebalancePendingTomorrow) {
    const projected = autoBalanceChores(chores, members);
    return projected.filter((c) => c.assignedTo === userId);
  }

  return chores.filter((chore) => {
    // If was transferred, tomorrow it returns to originalAssignee
    if (chore.originalAssignee) {
      return chore.originalAssignee === userId;
    }
    // If completed today, it rotates to next assignee; if not completed today, it stays with current assignee
    const nextAssignee = chore.isCompletedToday
      ? getNextAssignee(chore.assignedTo, chore.rotationRule, members)
      : chore.assignedTo;
    return nextAssignee === userId;
  });
};

/**
 * Periodic check: Sends daily morning reminder of today's chores and
 * evening preview of tomorrow's chores at the user's customized times.
 */
export const checkAndSendScheduledReminders = (
  chores: Chore[],
  members: Member[],
  currentUserId: string | null,
  currentMember?: Member,
  rebalancePendingTomorrow?: boolean
): void => {
  if (!currentUserId || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const todayStr = getTodayDateString();
  let scheduledMap: Record<string, { todayReminderSent?: boolean; tomorrowPreviewSent?: boolean }> = {};
  try {
    const raw = localStorage.getItem(DAILY_SCHEDULED_NOTIFS_KEY);
    if (raw) scheduledMap = JSON.parse(raw);
  } catch {
    scheduledMap = {};
  }

  const dayRecord = scheduledMap[todayStr] || {};
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Nhắc việc hôm nay (Today's Reminder)
  if (settings.todayReminderEnabled && !dayRecord.todayReminderSent) {
    const [h, m] = settings.todayReminderTime.split(':').map(Number);
    const targetMinutes = h * 60 + m;

    if (currentMinutes >= targetMinutes) {
      const myPending = chores.filter(
        (c) => c.assignedTo === currentUserId && !c.isCompletedToday
      );

      if (myPending.length > 0) {
        const title = `📋 [Lịch hôm nay] ${currentMember?.name || 'Bạn'} ơi!`;
        const choreListStr = myPending
          .map((c) => `${c.icon} ${c.title} (hạn: ${c.dueTime}, +${c.points}đ)`)
          .join('\n');
        const body = `Hôm nay bạn có ${myPending.length} việc cần làm:\n${choreListStr}\nChúc bạn hoàn thành tốt và không bị trễ hạn!`;

        triggerPushNotification(title, {
          body,
          tag: `daily-today-${todayStr}`,
        });
      }
      dayRecord.todayReminderSent = true;
    }
  }

  // 2. Báo việc ngày mai (Tomorrow's Preview)
  if (settings.tomorrowPreviewEnabled && !dayRecord.tomorrowPreviewSent) {
    const [h, m] = settings.tomorrowPreviewTime.split(':').map(Number);
    const targetMinutes = h * 60 + m;

    if (currentMinutes >= targetMinutes) {
      const tomorrowChores = getTomorrowChoresForUser(
        chores,
        members,
        currentUserId,
        rebalancePendingTomorrow
      );

      const title = `🌙 [Lịch ngày mai] ${currentMember?.name || 'Bạn'} ơi!`;
      let body = '';
      if (tomorrowChores.length > 0) {
        const totalPoints = tomorrowChores.reduce((sum, c) => sum + c.points, 0);
        const choreListStr = tomorrowChores
          .map((c) => `${c.icon} ${c.title} (+${c.points}đ)`)
          .join(', ');
        body = `Ngày mai bạn phụ trách ${tomorrowChores.length} việc: ${choreListStr} (Tổng +${totalPoints}đ). Chuẩn bị sẵn sàng nhé!`;
      } else {
        body = `Ngày mai bạn không có việc nhà nào! Hãy nghỉ ngơi và tận hưởng nhé ✨`;
      }

      triggerPushNotification(title, {
        body,
        tag: `daily-tomorrow-${todayStr}`,
      });
      dayRecord.tomorrowPreviewSent = true;
    }
  }

  scheduledMap[todayStr] = dayRecord;
  localStorage.setItem(DAILY_SCHEDULED_NOTIFS_KEY, JSON.stringify(scheduledMap));
};

/**
 * Periodic check: Urgent deadline alerts
 * - For regular chores (< 3 points): Alerts at 30 min, 15 min, 5 min before due time
 * - For heavy chores (>= 3 points): Alerts at 2 hours (120 min), 1 hour (60 min), 30 min before due time
 */
export const checkAndSendDeadlineAlerts = (
  chores: Chore[],
  currentUserId: string | null,
  currentMember?: Member
): void => {
  if (!currentUserId || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.urgentDeadlineEnabled) return;

  const todayStr = getTodayDateString();
  let milestoneMap: Record<string, string[]> = {};
  try {
    const raw = localStorage.getItem(NOTIFIED_MILESTONES_KEY);
    if (raw) milestoneMap = JSON.parse(raw);
  } catch {
    milestoneMap = {};
  }

  const notifiedToday = milestoneMap[todayStr] || [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const myPendingChores = chores.filter(
    (c) => c.assignedTo === currentUserId && !c.isCompletedToday
  );

  myPendingChores.forEach((chore) => {
    const [dueH, dueM] = chore.dueTime.split(':').map(Number);
    const dueMinutes = dueH * 60 + dueM;
    const minutesLeft = dueMinutes - currentMinutes;

    // Only notify before deadline arrives (minutesLeft >= 0)
    if (minutesLeft < 0) return;

    const isHeavy = chore.points >= 3;
    const milestones = isHeavy ? [120, 60, 30] : [30, 15, 5];

    for (const milestone of milestones) {
      const milestoneKey = `${chore.id}_${milestone}`;
      if (notifiedToday.includes(milestoneKey)) continue;

      if (minutesLeft <= milestone) {
        let title = '';
        let body = '';

        if (isHeavy) {
          if (milestone === 120) {
            title = `💪 [Việc nặng +${chore.points}đ] Còn 2 tiếng nữa đến hạn!`;
            body = `Việc "${chore.title}" có hạn chót lúc ${chore.dueTime}. Hãy sắp xếp thời gian làm sớm nhé!`;
          } else if (milestone === 60) {
            title = `⏰ [Việc nặng +${chore.points}đ] Còn 1 tiếng nữa đến hạn!`;
            body = `Việc "${chore.title}" sắp đến hạn chót (${chore.dueTime}). Bắt tay vào làm ngay thôi!`;
          } else {
            title = `🚨 [Việc nặng +${chore.points}đ] Chỉ còn 30 phút!`;
            body = `Việc "${chore.title}" sẽ hết hạn lúc ${chore.dueTime}. Nhanh tay hoàn thành để nhận trọn ${chore.points} điểm!`;
          }
        } else {
          if (milestone === 30) {
            title = `⏰ [Sắp đến hạn] Còn 30 phút!`;
            body = `${currentMember?.name || 'Bạn'} ơi, đừng quên việc "${chore.title}" (Hạn chót: ${chore.dueTime}).`;
          } else if (milestone === 15) {
            title = `⏳ [Sắp hết hạn] Còn 15 phút!`;
            body = `Việc "${chore.title}" sắp hết hạn (${chore.dueTime}). Làm ngay để không bị trừ điểm nhé!`;
          } else {
            title = `🚨 [Khẩn cấp] Chỉ còn 5 phút!`;
            body = `Việc "${chore.title}" sắp quá hạn (${chore.dueTime})! Mau hoàn thành và tick ngay nhé!`;
          }
        }

        triggerPushNotification(title, {
          body,
          tag: `deadline-${chore.id}-${milestone}`,
        });

        notifiedToday.push(milestoneKey);
        break; // Trigger closest milestone only per check pass
      }
    }
  });

  milestoneMap[todayStr] = notifiedToday;
  localStorage.setItem(NOTIFIED_MILESTONES_KEY, JSON.stringify(milestoneMap));
};

/**
 * Triggers push notifications for new remote events (someone completed a chore, requested redo,
 * transferred a chore, proposed a democratic vote, etc.)
 */
export const checkAndPushRemoteNotifications = (
  oldNotifications: AppNotification[],
  newNotifications: AppNotification[],
  currentUserId: string | null
): void => {
  if (!currentUserId || !isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.roomActivitiesEnabled) return;

  const oldIds = new Set(oldNotifications.map((n) => n.id));
  const trulyNew = newNotifications.filter((n) => !oldIds.has(n.id));

  let pushedIds: string[] = [];
  try {
    const raw = localStorage.getItem(PUSHED_REMOTE_NOTIFS_KEY);
    if (raw) pushedIds = JSON.parse(raw);
  } catch {
    pushedIds = [];
  }

  trulyNew.forEach((notif) => {
    if (pushedIds.includes(notif.id)) return;
    // Don't push if the user already read it or initiated it
    if (notif.readBy.includes(currentUserId)) return;

    triggerPushNotification(notif.title, {
      body: notif.message,
      tag: `remote-${notif.id}`,
    });

    pushedIds.push(notif.id);
  });

  if (pushedIds.length > 100) {
    pushedIds = pushedIds.slice(-100);
  }
  localStorage.setItem(PUSHED_REMOTE_NOTIFS_KEY, JSON.stringify(pushedIds));
};

/**
 * Combined periodic runner for personal chore notifications
 */
export const checkAndNotifyMyChores = (
  chores: Chore[],
  currentUserId: string | null,
  currentMember?: Member,
  members: Member[] = [],
  rebalancePendingTomorrow?: boolean
): void => {
  checkAndSendScheduledReminders(chores, members, currentUserId, currentMember, rebalancePendingTomorrow);
  checkAndSendDeadlineAlerts(chores, currentUserId, currentMember);
};
