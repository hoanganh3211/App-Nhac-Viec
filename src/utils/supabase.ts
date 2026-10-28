import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, UserAccount } from '../types';

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
};

export const clearSupabaseConfig = (): void => {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
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
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('room_states').upsert(
      {
        room_code: state.roomCode,
        state_data: state,
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
      .single();

    if (error || !data) {
      return null;
    }
    return data.state_data as AppState;
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
      return {
        roomCode: row.room_code,
        roomName: state.roomName || row.room_code,
        memberCount: Array.isArray(state.members) ? state.members.length : 0,
        choreCount: Array.isArray(state.chores) ? state.chores.length : 0,
        updatedAt: row.updated_at || state.lastDateChecked || new Date().toISOString(),
        members: state.members || [],
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
