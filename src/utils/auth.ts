import { UserAccount } from '../types';

const USERS_DB_KEY = 'app_nhac_viec_users_db';
const CURRENT_AUTH_USER_KEY = 'app_nhac_viec_current_auth_user';
const PENDING_ROOM_INVITE_KEY = 'app_nhac_viec_pending_room_invite';

export const AVATAR_OPTIONS = [
  '🙋‍♂️', '🙋‍♀️', '🧑‍💻', '👩‍💻', '🧑‍🍳', '👩‍🍳', '🦊', '🐱', '🐼', '🦁', '🐻', '🚀'
];

export const COLOR_OPTIONS = [
  'from-indigo-500 to-indigo-600',
  'from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600',
  'from-amber-500 to-amber-600',
  'from-violet-500 to-violet-600',
  'from-sky-500 to-sky-600',
];

export const getUsersDb = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse users db from localStorage', e);
    return [];
  }
};

export const saveUsersDb = (users: UserAccount[]): void => {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users db to localStorage', e);
  }
};

export const getCurrentAuthUser = (): UserAccount | null => {
  try {
    const raw = localStorage.getItem(CURRENT_AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserAccount;
  } catch (e) {
    console.error('Failed to get current auth user from localStorage', e);
    return null;
  }
};

export const setCurrentAuthUser = (user: UserAccount | null): void => {
  try {
    if (user) {
      localStorage.setItem(CURRENT_AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to set current auth user to localStorage', e);
  }
};

export const registerAccount = (
  username: string,
  pin: string,
  avatar?: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const cleanUsername = username.trim();
  const cleanPin = pin.trim();

  // Validate username
  if (!cleanUsername) {
    return { success: false, error: 'Vui lòng nhập tên đăng nhập!' };
  }
  if (cleanUsername.length < 2) {
    return { success: false, error: 'Tên đăng nhập phải có ít nhất 2 ký tự!' };
  }
  if (cleanUsername.length > 30) {
    return { success: false, error: 'Tên đăng nhập không được vượt quá 30 ký tự!' };
  }

  // Validate 6-digit PIN
  if (!/^\d{6}$/.test(cleanPin)) {
    return { success: false, error: 'Mật khẩu phải gồm chính xác 6 chữ số (Ví dụ: 123456)!' };
  }

  const users = getUsersDb();
  const duplicate = users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (duplicate) {
    return {
      success: false,
      error: `Tên đăng nhập "${cleanUsername}" đã được sử dụng. Vui lòng chọn tên khác hoặc chuyển sang Đăng nhập!`,
    };
  }

  const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
  const selectedAvatar = avatar || AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];

  const newUser: UserAccount = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    passwordPin: cleanPin,
    avatar: selectedAvatar,
    color: randomColor,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  saveUsersDb(updatedUsers);
  setCurrentAuthUser(newUser);

  return { success: true, user: newUser };
};

export const loginAccount = (
  username: string,
  pin: string
): { success: boolean; user?: UserAccount; error?: string } => {
  const cleanUsername = username.trim();
  const cleanPin = pin.trim();

  if (!cleanUsername) {
    return { success: false, error: 'Vui lòng nhập tên đăng nhập!' };
  }
  if (!cleanPin) {
    return { success: false, error: 'Vui lòng nhập mật khẩu 6 số!' };
  }

  if (!/^\d{6}$/.test(cleanPin)) {
    return { success: false, error: 'Mật khẩu phải gồm chính xác 6 chữ số!' };
  }

  const users = getUsersDb();
  const user = users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (!user) {
    return {
      success: false,
      error: `Tài khoản "${cleanUsername}" chưa tồn tại. Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký!`,
    };
  }

  if (user.passwordPin !== cleanPin) {
    return {
      success: false,
      error: 'Mật khẩu 6 số không chính xác. Vui lòng thử lại!',
    };
  }

  setCurrentAuthUser(user);
  return { success: true, user };
};

export const logoutAccount = (): void => {
  setCurrentAuthUser(null);
};

export const updateUserRoom = (userId: string, roomCode: string): void => {
  const users = getUsersDb();
  const updated = users.map((u) =>
    u.id === userId ? { ...u, lastRoomCode: roomCode } : u
  );
  saveUsersDb(updated);

  const current = getCurrentAuthUser();
  if (current && current.id === userId) {
    setCurrentAuthUser({ ...current, lastRoomCode: roomCode });
  }
};

export const getPendingRoomInvite = (): string | null => {
  try {
    return localStorage.getItem(PENDING_ROOM_INVITE_KEY);
  } catch {
    return null;
  }
};

export const setPendingRoomInvite = (roomCode: string | null): void => {
  try {
    if (roomCode) {
      localStorage.setItem(PENDING_ROOM_INVITE_KEY, roomCode.toUpperCase());
    } else {
      localStorage.removeItem(PENDING_ROOM_INVITE_KEY);
    }
  } catch {}
};
