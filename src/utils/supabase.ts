import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../types';

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
