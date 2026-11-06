import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, UserAccount, ChoreLog } from '../types';
import { autoBalanceChores, isChoreScheduledToday, getTodayDateString } from './storage';

const SUPABASE_CONFIG_KEY = 'app_nhac_viec_supabase_cfg';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getSupabaseConfig = (): SupabaseConfig | null => {
  // Check env first
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  // Check localStorage
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    return null;
  }
  return null;
};

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, anonKey }));
  clientInstance = null;
};

export const clearSupabaseConfig = (): void => {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  clientInstance = null;
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const cfg = getSupabaseConfig();
  if (!cfg?.url || !cfg?.anonKey) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(cfg.url, cfg.anonKey);
    } catch (e) {
      console.error('Failed to init Supabase client', e);
      return null;
    }
  }
  return clientInstance;
};

// Sync app state to Supabase room
export const pushStateToCloud = async (state: AppState): Promise<boolean> => {
  if (!state || !state.roomCode || state.roomCode === GLOBAL_USERS_ROOM_CODE) {
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // Luôn lọc sạch tài khoản Quản trị viên (Admin) khỏi danh sách thành viên trước khi đẩy lên Cloud
    const cleanMembers = (state.members || []).filter(
      (m) => m.id !== 'usr_admin_root' && m.name?.toLowerCase() !== 'admin'
    );
    const cleanState: AppState = {
      ...state,
      members: cleanMembers,
    };

    const { error } = await supabase.from('room_states').upsert(
      {
        room_code: cleanState.roomCode,
        state_data: cleanState,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'room_code' }
    );

    if (error) {
      console.error('Supabase push error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to push to Supabase', err);
    return false;
  }
};

// Fetch app state from Supabase room
export const fetchStateFromCloud = async (roomCode: string): Promise<AppState | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('room_states')
      .select('state_data')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    const state = data.state_data as AppState;
    if (state && Array.isArray(state.members)) {
      state.members = state.members.filter(
        (m) => m.id !== 'usr_admin_root' && m.name?.toLowerCase() !== 'admin'
      );
    }
    return state;
  } catch (err) {
    console.error('Failed to fetch from Supabase', err);
    return null;
  }
};

export const GLOBAL_USERS_ROOM_CODE = '__GLOBAL_APP_USERS__';

// Fetch all registered users from Supabase Cloud
export const fetchUsersFromCloud = async (): Promise<UserAccount[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('room_states')
      .select('state_data')
      .eq('room_code', GLOBAL_USERS_ROOM_CODE)
      .maybeSingle();

    if (!error && data?.state_data) {
      const stateData = data.state_data as any;
      if (stateData && Array.isArray(stateData.users)) {
        return stateData.users as UserAccount[];
      }
    }

    // Fallback: Nếu row __GLOBAL_APP_USERS__ chưa có, tự động quét các phòng trong room_states để nhập các thành viên cũ
    const { data: allRooms } = await supabase
      .from('room_states')
      .select('state_data')
      .neq('room_code', GLOBAL_USERS_ROOM_CODE)
      .limit(30);

    if (allRooms && allRooms.length > 0) {
      const discoveredUsers: UserAccount[] = [];
      const seenUsernames = new Set<string>();

      for (const row of allRooms) {
        const room = row.state_data as any;
        if (room && Array.isArray(room.members)) {
          for (const m of room.members) {
            const lowerName = m.name?.trim().toLowerCase();
            if (lowerName && !seenUsernames.has(lowerName)) {
              seenUsernames.add(lowerName);
              discoveredUsers.push({
                id: m.id || 'usr_' + Date.now(),
                username: m.name.trim(),
                passwordPin: '123456', // PIN dự phòng cho các thành viên cũ
                avatar: m.avatar || '👤',
                color: m.color || 'from-indigo-500 to-indigo-600',
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }
      return discoveredUsers;
    }

    return [];
  } catch (err) {
    console.error('Failed to fetch users from Supabase', err);
    return [];
  }
};

// Push all registered users to Supabase Cloud
export const pushUsersToCloud = async (users: UserAccount[]): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('room_states').upsert(
      {
        room_code: GLOBAL_USERS_ROOM_CODE,
        state_data: { users, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'room_code' }
    );

    if (error) {
      console.error('Failed to push users to Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to push users to Supabase', err);
    return false;
  }
};

// Clear all users and rooms from Supabase Cloud
export const clearAllCloudData = async (): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const { error } = await supabase
      .from('room_states')
      .delete()
      .neq('room_code', '__NEVER_MATCHING_CODE__');

    if (error) {
      console.error('Failed to clear cloud data', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exception clearing cloud data', err);
    return { success: false, error: err?.message || 'Lỗi khi xóa dữ liệu đám mây.' };
  }
};

/**
 * Đặt lại toàn bộ công việc và điểm số về 0 trong các phòng trên Supabase Cloud
 * BẢO LƯU 100% tất cả các phòng trọ và danh sách thành viên/tài khoản
 */
export const resetAllChoresAndPointsKeepRoomsAndMembers = async (): Promise<{
  success: boolean;
  roomsResetCount?: number;
  error?: string;
}> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const { data: rows, error: fetchErr } = await supabase
      .from('room_states')
      .select('room_code, state_data')
      .neq('room_code', GLOBAL_USERS_ROOM_CODE);

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }

    let count = 0;
    if (rows && rows.length > 0) {
      for (const row of rows) {
        const state = (row.state_data as AppState) || {};
        const resetMembers = (state.members || []).map((m) => ({
          ...m,
          points: 0,
          streak: 0,
          lateViolations: 0,
        }));

        const resetState: AppState = {
          ...state,
          members: resetMembers,
          chores: [],
          logs: [],
          transferRequests: [],
          proposals: [],
          notifications: [],
          rebalancePendingTomorrow: false,
          updatedAt: new Date().toISOString(),
          version: (state.version || 0) + 1,
          lastUpdatedBy: 'admin_reset',
        };

        const { error: updateErr } = await supabase
          .from('room_states')
          .update({
            state_data: resetState,
            updated_at: new Date().toISOString(),
          })
          .eq('room_code', row.room_code);

        if (!updateErr) {
          count++;
        }
      }
    }

    return { success: true, roomsResetCount: count };
  } catch (err: any) {
    console.error('Failed to reset chores and points:', err);
    return { success: false, error: err?.message || 'Lỗi khi đặt lại công việc và điểm số.' };
  }
};

/**
 * Đặt lại công việc & điểm số cho 1 phòng cụ thể (bảo lưu phòng và thành viên)
 */
export const resetSingleRoomChoresAndPoints = async (
  roomCode: string
): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const cleanCode = roomCode.trim().toUpperCase();
    const { data: row, error: fetchErr } = await supabase
      .from('room_states')
      .select('room_code, state_data')
      .eq('room_code', cleanCode)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }

    if (!row) {
      return { success: false, error: 'Không tìm thấy phòng trên Cloud Database.' };
    }

    const state = (row.state_data as AppState) || {};
    const resetMembers = (state.members || []).map((m) => ({
      ...m,
      points: 0,
      streak: 0,
      lateViolations: 0,
    }));

    const resetState: AppState = {
      ...state,
      members: resetMembers,
      chores: [],
      logs: [],
      transferRequests: [],
      proposals: [],
      notifications: [],
      rebalancePendingTomorrow: false,
      updatedAt: new Date().toISOString(),
      version: (state.version || 0) + 1,
      lastUpdatedBy: 'admin_reset',
    };

    const { error: updateErr } = await supabase
      .from('room_states')
      .update({
        state_data: resetState,
        updated_at: new Date().toISOString(),
      })
      .eq('room_code', cleanCode);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to reset room chores and points:', err);
    return { success: false, error: err?.message || 'Lỗi khi đặt lại công việc phòng.' };
  }
};

export interface CloudRoomData {
  roomCode: string;
  roomName: string;
  memberCount: number;
  choreCount: number;
  updatedAt: string;
  members: import('../types').Member[];
  chores: import('../types').Chore[];
}

// Fetch all rooms from Cloud for Admin Dashboard
export const fetchAllRoomsForAdmin = async (): Promise<CloudRoomData[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('room_states')
      .select('room_code, state_data, updated_at')
      .neq('room_code', GLOBAL_USERS_ROOM_CODE)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => {
      const state = (row.state_data as AppState) || {};
      const cleanMembers = (state.members || []).filter(
        (m: any) => m.id !== 'usr_admin_root' && m.name?.toLowerCase() !== 'admin'
      );
      return {
        roomCode: row.room_code,
        roomName: state.roomName || row.room_code,
        memberCount: cleanMembers.length,
        choreCount: Array.isArray(state.chores) ? state.chores.length : 0,
        updatedAt: row.updated_at || state.lastDateChecked || new Date().toISOString(),
        members: cleanMembers,
        chores: state.chores || [],
      };
    });
  } catch (err) {
    console.error('Failed to fetch rooms for admin', err);
    return [];
  }
};

// Delete a room from Supabase Cloud
export const deleteRoomFromCloud = async (roomCode: string): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const { error } = await supabase
      .from('room_states')
      .delete()
      .eq('room_code', roomCode);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi xóa phòng.' };
  }
};

// Delete a member from a cloud room
export const deleteMemberFromCloudRoom = async (
  roomCode: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const state = await fetchStateFromCloud(roomCode);
    if (!state) return { success: false, error: 'Không tìm thấy dữ liệu phòng.' };

    const updatedMembers = (state.members || []).filter((m) => m.id !== memberId);
    const updatedChores = (state.chores || []).map((c) => {
      if (c.assignedTo === memberId) {
        return {
          ...c,
          assignedTo: updatedMembers.length > 0 ? updatedMembers[0].id : '',
        };
      }
      return c;
    });

    const newState: AppState = {
      ...state,
      members: updatedMembers,
      chores: updatedChores,
    };

    const pushed = await pushStateToCloud(newState);
    if (!pushed) return { success: false, error: 'Không thể cập nhật phòng sau khi xóa thành viên.' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi xóa thành viên khỏi phòng.' };
  }
};

// Delete a chore from a cloud room
export const deleteChoreFromCloudRoom = async (
  roomCode: string,
  choreId: string
): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const cleanCode = roomCode.trim().toUpperCase();
    const state = await fetchStateFromCloud(cleanCode);
    if (!state) return { success: false, error: 'Không tìm thấy dữ liệu phòng.' };

    const updatedChores = (state.chores || []).filter((c) => c.id !== choreId);
    const updatedProposals = (state.proposals || []).filter((p) => p.targetChoreId !== choreId);

    const newState: AppState = {
      ...state,
      chores: updatedChores,
      proposals: updatedProposals,
      updatedAt: new Date().toISOString(),
      version: (state.version || 0) + 1,
      lastUpdatedBy: 'admin_delete',
    };

    const pushed = await pushStateToCloud(newState);
    if (!pushed) return { success: false, error: 'Không thể cập nhật phòng sau khi xóa việc.' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi xóa việc khỏi phòng.' };
  }
};

/**
 * Admin reload / cân bằng lại công việc theo đúng công thức chia việc công bằng
 */
export const rebalanceRoomChoresForAdmin = async (
  roomCode: string
): Promise<{ success: boolean; alreadyFair?: boolean; message?: string; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const cleanCode = roomCode.trim().toUpperCase();
    const state = await fetchStateFromCloud(cleanCode);
    if (!state) return { success: false, error: 'Không tìm thấy dữ liệu phòng.' };

    // 1. Loại bỏ tài khoản Admin nếu vô tình bị thêm vào thành viên phòng
    const realMembers = (state.members || []).filter(
      (m) => m.id !== 'usr_admin_root' && m.name.toLowerCase() !== 'admin'
    );

    if (realMembers.length === 0) {
      return {
        success: true,
        alreadyFair: true,
        message: 'Phòng chưa có thành viên nào để phân chia công việc.',
      };
    }

    if (!state.chores || state.chores.length === 0) {
      return {
        success: true,
        alreadyFair: true,
        message: 'Phòng chưa có công việc nào để phân chia.',
      };
    }

    // 2. Chạy thuật toán chia việc công bằng theo công thức
    const balancedChores = autoBalanceChores(state.chores, realMembers);

    // 3. Kiểm tra xem công việc đã được chia công bằng tối ưu chưa
    const isAlreadyFair = state.chores.every((c) => {
      const b = balancedChores.find((bc) => bc.id === c.id);
      return b && b.assignedTo === c.assignedTo;
    });

    if (isAlreadyFair) {
      return {
        success: true,
        alreadyFair: true,
        message: 'Công việc đã được phân chia công bằng tối ưu rồi, không cần thay đổi.',
      };
    }

    // 4. Nếu chưa công bằng -> Cập nhật danh sách công việc đã cân bằng lên Cloud
    const newState: AppState = {
      ...state,
      members: realMembers,
      chores: balancedChores,
      updatedAt: new Date().toISOString(),
      version: (state.version || 0) + 1,
      lastUpdatedBy: 'admin_rebalance',
    };

    const pushed = await pushStateToCloud(newState);
    if (!pushed) {
      return { success: false, error: 'Không thể lưu công việc đã cân bằng lên Cloud.' };
    }

    return {
      success: true,
      alreadyFair: false,
      message: `Đã cân bằng lại công việc theo công thức công bằng cho ${realMembers.length} thành viên!`,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi cân bằng công việc.' };
  }
};

/**
 * Đánh dấu hoàn thành toàn bộ công việc của ngày hôm nay cho 1 phòng
 * và chuẩn bị để bắt đầu xoay chu kỳ mới từ ngày mai
 */
export const completeAllTodayChoresForRoom = async (
  roomCode: string
): Promise<{ success: boolean; completedCount?: number; error?: string }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Chưa kết nối Supabase Cloud.' };

  try {
    const cleanCode = roomCode.trim().toUpperCase();
    const state = await fetchStateFromCloud(cleanCode);
    if (!state) return { success: false, error: 'Không tìm thấy dữ liệu phòng.' };

    const todayStr = getTodayDateString();
    const nowTimeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const memberPointsDelta: Record<string, number> = {};
    const newLogs: ChoreLog[] = [];
    let completedCount = 0;

    const updatedChores = (state.chores || []).map((chore) => {
      const isScheduled = isChoreScheduledToday(chore) || chore.frequency === 'daily' || !chore.isCompletedToday;
      if (isScheduled && !chore.isCompletedToday) {
        completedCount++;
        const assignee = (state.members || []).find((m) => m.id === chore.assignedTo);
        const assigneeName = assignee?.name || 'Thành viên';

        memberPointsDelta[chore.assignedTo] = (memberPointsDelta[chore.assignedTo] || 0) + chore.points;

        newLogs.push({
          id: 'log_all_done_' + Date.now() + '_' + chore.id,
          choreId: chore.id,
          choreTitle: chore.title,
          memberId: chore.assignedTo,
          memberName: assigneeName,
          completedAt: `Hôm nay ${nowTimeStr}`,
          pointsEarned: chore.points,
          type: 'completed',
          dateStr: todayStr,
          note: `Đã hoàn thành việc hôm nay (+${chore.points}đ). Chu kỳ mới bắt đầu từ mai!`,
        });

        return {
          ...chore,
          isCompletedToday: true,
          completedAt: `Hôm nay ${nowTimeStr}`,
          completedBy: chore.assignedTo,
          isLatePenalized: false,
          redoRequest: undefined,
        };
      }
      return chore;
    });

    const updatedMembers = (state.members || []).map((m) => {
      const delta = memberPointsDelta[m.id] || 0;
      return {
        ...m,
        points: (m.points || 0) + delta,
        streak: delta > 0 ? Math.max(m.streak || 0, 1) : (m.streak || 0),
        lateViolations: 0,
      };
    });

    const newState: AppState = {
      ...state,
      members: updatedMembers,
      chores: updatedChores,
      logs: [...newLogs, ...(state.logs || [])].slice(0, 100),
      lastDateChecked: todayStr,
      updatedAt: new Date().toISOString(),
      version: (state.version || 0) + 1,
      lastUpdatedBy: 'admin_complete_all',
    };

    const pushed = await pushStateToCloud(newState);
    if (!pushed) {
      return { success: false, error: 'Không thể cập nhật trạng thái phòng lên Cloud.' };
    }

    return { success: true, completedCount };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi hoàn thành công việc.' };
  }
};
