import { UserAccount } from '../types';
import { fetchUsersFromCloud, pushUsersToCloud } from './supabase';

const USERS_DB_KEY = 'app_nhac_viec_users_db';
const CURRENT_AUTH_USER_KEY = 'app_nhac_viec_current_auth_user';
const PENDING_ROOM_INVITE_KEY = 'app_nhac_viec_pending_room_invite';

export const AVATAR_OPTIONS = [
  '🙋‍♂️', '🙋‍♀️', '🧑‍💻', '👩‍💻', '🧑‍🍳', '👩‍🍳', '🦊', '🐱', '🐼', '🦁', '🐻', '🚀'
];

export const DEFAULT_ADMIN_USER: UserAccount = {
  id: 'usr_admin_root',
  username: 'admin',
  passwordPin: '888888',
  avatar: '🛡️',
  color: 'from-slate-700 to-slate-900',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
};

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

export const clearLocalUsersDb = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'app_nhac_viec_supabase_cfg') {
        if (
          key.startsWith('app_nhac_viec_') || 
          key.includes('tutorial_seen_') ||
          key.includes('current_auth_user')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error('Failed to clear local users db', e);
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

export const registerAccount = async (
  username: string,
  pin: string,
  avatar?: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  const cleanUsername = username.trim();
  const cleanPin = pin.trim();

  // Validate username
  if (!cleanUsername) {
    return { success: false, error: 'Vui lòng nhập tên đăng nhập!' };
  }
  if (cleanUsername.toLowerCase() === 'admin') {
    return { success: false, error: 'Tên đăng nhập "admin" được bảo lưu riêng cho Quản trị viên hệ thống!' };
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

  // 1. Kiểm tra trong Database đám mây (Supabase) trước để chống trùng lặp tài khoản giữa các máy
  let cloudUsers: UserAccount[] = [];
  try {
    cloudUsers = await fetchUsersFromCloud();
  } catch (e) {
    console.warn('Could not fetch cloud users during registration:', e);
  }

  const localUsers = getUsersDb();

  // Hợp nhất dữ liệu người dùng từ Cloud và Local
  const userMap = new Map<string, UserAccount>();
  for (const u of localUsers) {
    userMap.set(u.username.toLowerCase(), u);
  }
  for (const u of cloudUsers) {
    userMap.set(u.username.toLowerCase(), u);
  }
  const allUsers = Array.from(userMap.values());

  // 2. Kiểm tra xem tên đăng nhập đã tồn tại trong database chưa
  const duplicate = allUsers.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (duplicate) {
    return {
      success: false,
      error: `Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống! Vui lòng chọn tên khác hoặc chuyển sang tab Đăng nhập.`,
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

  const updatedUsers = [...allUsers, newUser];

  // Lưu vào bộ nhớ cục bộ trên máy
  saveUsersDb(updatedUsers);
  setCurrentAuthUser(newUser);

  // Đẩy và đồng bộ tức thì lên Cloud Database (Supabase)
  try {
    await pushUsersToCloud(updatedUsers);
  } catch (err) {
    console.error('Failed to sync new user to cloud database:', err);
  }

  return { success: true, user: newUser };
};

export const loginAccount = async (
  username: string,
  pin: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
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

  // 1. Kéo danh sách tài khoản mới nhất từ Cloud Database (Supabase)
  let cloudUsers: UserAccount[] = [];
  try {
    cloudUsers = await fetchUsersFromCloud();
  } catch (e) {
    console.warn('Could not fetch cloud users during login:', e);
  }

  const localUsers = getUsersDb();

  // Hợp nhất dữ liệu giữa Cloud và Local
  const userMap = new Map<string, UserAccount>();
  for (const u of localUsers) {
    userMap.set(u.username.toLowerCase(), u);
  }
  for (const u of cloudUsers) {
    userMap.set(u.username.toLowerCase(), u);
  }
  const allUsers = Array.from(userMap.values());

  // Lưu lại danh sách mới nhất về máy này để lần sau truy cập nhanh
  if (cloudUsers.length > 0) {
    saveUsersDb(allUsers);
  }

  // 1.5. Xử lý đăng nhập tài khoản Quản trị viên (Admin)
  if (cleanUsername.toLowerCase() === 'admin') {
    const adminUser = allUsers.find((u) => u.username.toLowerCase() === 'admin');
    const validPin = adminUser ? adminUser.passwordPin : DEFAULT_ADMIN_USER.passwordPin;

    if (cleanPin !== validPin) {
      return {
        success: false,
        error: 'Mật khẩu Admin không chính xác!',
      };
    }

    const activeAdmin: UserAccount = adminUser || DEFAULT_ADMIN_USER;
    if (!adminUser) {
      const updatedUsers = [...allUsers, DEFAULT_ADMIN_USER];
      saveUsersDb(updatedUsers);
      try {
        await pushUsersToCloud(updatedUsers);
      } catch {}
    }
    setCurrentAuthUser(activeAdmin);
    return { success: true, user: activeAdmin };
  }

  // 2. Tìm tài khoản theo tên đăng nhập
  const user = allUsers.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (!user) {
    return {
      success: false,
      error: `Tài khoản "${cleanUsername}" chưa tồn tại trong cơ sở dữ liệu. Vui lòng kiểm tra lại chính xác tên hoặc chuyển sang tab Đăng ký!`,
    };
  }

  // 3. Kiểm tra mã PIN 6 số
  if (user.passwordPin !== cleanPin) {
    return {
      success: false,
      error: 'Mật khẩu 6 số không chính xác. Vui lòng kiểm tra và nhập lại!',
    };
  }

  setCurrentAuthUser(user);
  return { success: true, user };
};

export const logoutAccount = (): void => {
  setCurrentAuthUser(null);
};

export const updateUserRoom = async (userId: string, roomCode: string): Promise<void> => {
  const users = getUsersDb();
  const updated = users.map((u) =>
    u.id === userId ? { ...u, lastRoomCode: roomCode } : u
  );
  saveUsersDb(updated);

  const current = getCurrentAuthUser();
  if (current && current.id === userId) {
    setCurrentAuthUser({ ...current, lastRoomCode: roomCode });
  }

  try {
    await pushUsersToCloud(updated);
  } catch {}
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

// Lấy toàn bộ danh sách người dùng cho Admin
export const getAllUsersForAdmin = async (): Promise<UserAccount[]> => {
  let cloudUsers: UserAccount[] = [];
  try {
    cloudUsers = await fetchUsersFromCloud();
  } catch (e) {
    console.warn('Failed to fetch cloud users', e);
  }

  const localUsers = getUsersDb();
  const userMap = new Map<string, UserAccount>();

  // Always guarantee admin exists
  userMap.set('admin', DEFAULT_ADMIN_USER);

  for (const u of localUsers) {
    userMap.set(u.username.toLowerCase(), u);
  }
  for (const u of cloudUsers) {
    userMap.set(u.username.toLowerCase(), u);
  }

  return Array.from(userMap.values());
};

// Xóa tài khoản người dùng
export const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (userId === DEFAULT_ADMIN_USER.id) {
    return { success: false, error: 'Không thể xóa tài khoản Quản trị viên gốc!' };
  }

  try {
    let cloudUsers = await fetchUsersFromCloud();
    let localUsers = getUsersDb();

    const userMap = new Map<string, UserAccount>();
    for (const u of localUsers) userMap.set(u.id, u);
    for (const u of cloudUsers) userMap.set(u.id, u);

    const target = userMap.get(userId);
    if (target && target.username.toLowerCase() === 'admin') {
      return { success: false, error: 'Không thể xóa tài khoản Quản trị viên!' };
    }

    userMap.delete(userId);
    const updatedUsers = Array.from(userMap.values());

    saveUsersDb(updatedUsers);
    await pushUsersToCloud(updatedUsers);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi xóa tài khoản' };
  }
};

// Đặt lại mã PIN 6 số cho người dùng
export const adminResetUserPin = async (
  userId: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> => {
  if (!/^\d{6}$/.test(newPin.trim())) {
    return { success: false, error: 'Mật khẩu mới phải gồm đúng 6 chữ số!' };
  }

  try {
    let cloudUsers = await fetchUsersFromCloud();
    let localUsers = getUsersDb();

    const userMap = new Map<string, UserAccount>();
    for (const u of localUsers) userMap.set(u.id, u);
    for (const u of cloudUsers) userMap.set(u.id, u);

    const user = userMap.get(userId);
    if (!user) return { success: false, error: 'Không tìm thấy tài khoản!' };

    user.passwordPin = newPin.trim();
    userMap.set(userId, user);

    const updatedUsers = Array.from(userMap.values());
    saveUsersDb(updatedUsers);
    await pushUsersToCloud(updatedUsers);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi đổi mật khẩu' };
  }
};
