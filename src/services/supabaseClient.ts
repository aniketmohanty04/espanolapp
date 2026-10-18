import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseUser } from './authDatabaseService';
import { PlayerProgress } from '../types';

const STORAGE_URL_KEY = 'aventura_supabase_url';
const STORAGE_KEY_KEY = 'aventura_supabase_key';

export const DEFAULT_SUPABASE_URL = 'https://dxamjklrbeulpgdkxsha.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Ob0ACaYB-nnV-k-CWWcIuQ_2ZZ_OMKV';

let cachedClient: SupabaseClient | null = null;
let lastClientKey = '';

// In-memory fallback for test and non-browser environments
let memoryUrl = '';
let memoryKey = '';
let isExplicitlyDisabled = false;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

export interface RemotePlayerRecord {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  progress: PlayerProgress;
  created_at?: string;
  updated_at?: string;
}

export const supabaseService = {
  /**
   * Toggle explicit disabling of cloud sync (used for testing and local-only mode)
   */
  setExplicitlyDisabled(disabled: boolean): void {
    isExplicitlyDisabled = disabled;
    if (disabled) {
      cachedClient = null;
    }
  },

  /**
   * Reset testing state
   */
  resetTestingState(): void {
    isExplicitlyDisabled = false;
    memoryUrl = '';
    memoryKey = '';
    cachedClient = null;
    lastClientKey = '';
  },

  /**
   * Read the active Supabase configuration from environment variables or localStorage
   */
  getConfig(): SupabaseConfig {
    if (isExplicitlyDisabled) {
      return { url: '', anonKey: '', isConfigured: false, source: 'none' };
    }

    const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
    const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

    let localUrl = memoryUrl;
    let localKey = memoryKey;
    try {
      if (typeof localStorage !== 'undefined') {
        localUrl = (localStorage.getItem(STORAGE_URL_KEY) || memoryUrl).trim();
        localKey = (localStorage.getItem(STORAGE_KEY_KEY) || memoryKey).trim();
      }
    } catch {
      // fallback
    }

    if (localUrl && localKey) {
      return { url: localUrl, anonKey: localKey, isConfigured: true, source: 'storage' };
    }

    if (envUrl && envKey) {
      return { url: envUrl, anonKey: envKey, isConfigured: true, source: 'env' };
    }

    if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
      return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY, isConfigured: true, source: 'env' };
    }

    return { url: localUrl || envUrl, anonKey: localKey || envKey, isConfigured: false, source: 'none' };
  },

  /**
   * Save Supabase configuration to localStorage for in-app connection
   */
  saveConfig(url: string, anonKey: string): void {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    memoryUrl = cleanUrl;
    memoryKey = cleanKey;
    isExplicitlyDisabled = false;

    try {
      if (typeof localStorage !== 'undefined') {
        if (cleanUrl && cleanKey) {
          localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
          localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
        } else {
          localStorage.removeItem(STORAGE_URL_KEY);
          localStorage.removeItem(STORAGE_KEY_KEY);
        }
      }
    } catch {
      // fallback
    }
    cachedClient = null;
    lastClientKey = '';
  },

  /**
   * Clear in-app Supabase overrides
   */
  clearConfig(): void {
    memoryUrl = '';
    memoryKey = '';
    isExplicitlyDisabled = true;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_URL_KEY);
        localStorage.removeItem(STORAGE_KEY_KEY);
      }
    } catch {
      // fallback
    }
    cachedClient = null;
    lastClientKey = '';
  },

  /**
   * Get the singleton Supabase client, or null if not configured
   */
  getClient(): SupabaseClient | null {
    const config = this.getConfig();
    if (!config.isConfigured || !config.url || !config.anonKey) {
      return null;
    }

    const clientKey = `${config.url}::${config.anonKey}`;
    if (cachedClient && lastClientKey === clientKey) {
      return cachedClient;
    }

    try {
      // Ensure URL has http(s) protocol
      let formattedUrl = config.url;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      cachedClient = createClient(formattedUrl, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      lastClientKey = clientKey;
      return cachedClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  },

  /**
   * Test connection to Supabase and verify the player_progress table is accessible
   */
  async testConnection(testUrl?: string, testKey?: string): Promise<{
    success: boolean;
    message: string;
    tableReady: boolean;
    latencyMs?: number;
  }> {
    let rawUrl = (testUrl ?? this.getConfig().url).trim();
    const rawKey = (testKey ?? this.getConfig().anonKey).trim();

    if (!rawUrl || !rawKey) {
      return {
        success: false,
        tableReady: false,
        message: 'Supabase no está configurado. Por favor, introduce la URL y la Anon Key de tu proyecto.'
      };
    }

    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = `https://${rawUrl}`;
    }

    // Format & Host validation
    try {
      const parsed = new URL(rawUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return {
          success: false,
          tableReady: false,
          message: 'URL de Supabase inválida. Debe ser un dominio como https://xyz.supabase.co'
        };
      }
    } catch {
      return {
        success: false,
        tableReady: false,
        message: 'URL de Supabase inválida: sintaxis no reconocida.'
      };
    }

    let client: SupabaseClient | null = null;
    try {
      client = createClient(rawUrl, rawKey);
    } catch (err: any) {
      return {
        success: false,
        tableReady: false,
        message: `Error al inicializar cliente de Supabase: ${err?.message || 'Error de configuración'}`
      };
    }

    const start = performance.now();
    try {
      // Fast timeout safeguard (2000ms) to ensure UI never hangs on unresolvable hosts
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con Supabase (2s)')), 2000)
      );

      const queryPromise = client
        .from('player_progress')
        .select('id')
        .limit(1);

      const { error } = await Promise.race([queryPromise, timeoutPromise]);
      const latency = Math.round(performance.now() - start);

      if (error) {
        // Check if table does not exist
        if (error.code === '42P01' || error.message?.includes('relation "player_progress" does not exist') || error.message?.includes('does not exist')) {
          return {
            success: true,
            tableReady: false,
            latencyMs: latency,
            message: '¡Conexión establecida con Supabase! Sin embargo, la tabla "player_progress" aún no ha sido creada. Ejecuta el archivo SQL provisto en el Editor SQL de Supabase.'
          };
        }
        return {
          success: false,
          tableReady: false,
          latencyMs: latency,
          message: `Error al consultar la tabla: ${error.message}`
        };
      }

      return {
        success: true,
        tableReady: true,
        latencyMs: latency,
        message: `¡Conexión con Supabase exitosa y tabla lista! (${latency}ms)`
      };
    } catch (err: any) {
      return {
        success: false,
        tableReady: false,
        message: `Error de red al conectar con Supabase: ${err?.message || 'Host inalcanzable'}`
      };
    }
  },

  /**
   * Fetch a user and their progress by email from Supabase
   */
  async fetchRemoteUser(email: string): Promise<{ user: DatabaseUser; progress: PlayerProgress } | null> {
    const client = this.getClient();
    if (!client || !email) return null;

    try {
      const { data, error } = await client
        .from('player_progress')
        .select('*')
        .ilike('email', email.trim())
        .maybeSingle();

      if (error) {
        console.warn('Supabase fetchRemoteUser error:', error);
        return null;
      }

      if (!data) return null;

      const record = data as RemotePlayerRecord;
      const user: DatabaseUser = {
        id: record.id,
        email: record.email,
        displayName: record.display_name || 'Viajero',
        passwordHash: record.password_hash,
        createdAt: record.created_at || new Date().toISOString(),
        lastLoginAt: record.updated_at || new Date().toISOString()
      };

      return { user, progress: record.progress };
    } catch (err) {
      console.warn('Supabase fetchRemoteUser exception:', err);
      return null;
    }
  },

  /**
   * Save or update a user and their progress in Supabase.
   * CRITICAL SAFEGUARD: Never overwrites password_hash if passwordHash is empty!
   * Never overwrites a valid display_name with 'Viajero', 'years', or empty string!
   */
  async saveRemoteUser(user: DatabaseUser, progress: PlayerProgress): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'Supabase no está configurado.' };
    }

    try {
      const normEmail = user.email.toLowerCase().trim();
      const record: Record<string, any> = {
        id: user.id,
        email: normEmail,
        progress,
        updated_at: new Date().toISOString()
      };

      // Only include password_hash if non-empty, preventing accidental wipe/deletion
      if (user.passwordHash && user.passwordHash.trim().length > 0) {
        record.password_hash = user.passwordHash.trim();
      }

      // Only update display_name if a valid, personalized name is provided
      if (user.displayName && user.displayName.trim().length > 0 && user.displayName !== 'Viajero' && user.displayName !== 'years') {
        record.display_name = user.displayName.trim();
      }

      const { error } = await client
        .from('player_progress')
        .upsert(record, { onConflict: 'email' });

      if (error) {
        console.warn('Supabase saveRemoteUser error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Supabase saveRemoteUser exception:', err);
      return { success: false, error: err?.message || 'Error de conexión' };
    }
  },

  /**
   * Dedicated progress updater: Updates ONLY player progress (and display name if valid).
   * GUARANTEES that password_hash is NEVER touched, altered, or deleted during gameplay!
   */
  async saveRemoteProgress(email: string, progress: PlayerProgress, displayName?: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client || !email) {
      return { success: false, error: 'Supabase no está configurado.' };
    }

    try {
      const normEmail = email.toLowerCase().trim();
      const updateData: Record<string, any> = {
        progress,
        updated_at: new Date().toISOString()
      };

      if (displayName && displayName.trim().length > 0 && displayName !== 'Viajero' && displayName !== 'years') {
        updateData.display_name = displayName.trim();
      }

      const { error } = await client
        .from('player_progress')
        .update(updateData)
        .ilike('email', normEmail);

      if (error) {
        console.warn('Supabase saveRemoteProgress error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Supabase saveRemoteProgress exception:', err);
      return { success: false, error: err?.message || 'Error de conexión' };
    }
  },

  /**
   * Sync all local registered users to Supabase remote cloud
   */
  async syncLocalToRemote(
    users: DatabaseUser[],
    getProgressFn: (email: string) => PlayerProgress | null
  ): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, syncedCount: 0, error: 'Supabase no está configurado.' };
    }

    let synced = 0;
    try {
      for (const u of users) {
        const prog = getProgressFn(u.email);
        if (prog) {
          const res = await this.saveRemoteUser(u, prog);
          if (res.success) synced++;
        }
      }
      return { success: true, syncedCount: synced };
    } catch (err: any) {
      return { success: false, syncedCount: synced, error: err?.message };
    }
  }
};
