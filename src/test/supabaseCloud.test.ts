import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseService } from '../services/supabaseClient';
import { authDatabaseService } from '../services/authDatabaseService';
import { storageService, INITIAL_PROGRESS } from '../services/storageService';
import { PlayerProgress } from '../types';

describe('Supabase Remote Cloud Database Integration', () => {
  beforeEach(() => {
    supabaseService.clearConfig();
    authDatabaseService.clearAll();
  });

  it('reports unconfigured state when no credentials are provided', () => {
    const config = supabaseService.getConfig();
    expect(config.isConfigured).toBe(false);
    expect(supabaseService.getClient()).toBeNull();
    expect(authDatabaseService.isCloudConfigured()).toBe(false);
  });

  it('saves and clears in-app Supabase credentials correctly', () => {
    const testUrl = 'https://abcdefghijklmnop.supabase.co';
    const testKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

    supabaseService.saveConfig(testUrl, testKey);
    const config = supabaseService.getConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.url).toBe(testUrl);
    expect(config.anonKey).toBe(testKey);
    expect(config.source).toBe('storage');
    expect(authDatabaseService.isCloudConfigured()).toBe(true);

    // Clearing config
    supabaseService.clearConfig();
    const cleared = supabaseService.getConfig();
    expect(cleared.isConfigured).toBe(false);
    expect(authDatabaseService.isCloudConfigured()).toBe(false);
  });

  it('safely handles malformed URLs during connection test without crashing', async () => {
    const result = await supabaseService.testConnection('not-a-valid-url', 'invalid-key');
    expect(result.success).toBe(false);
    expect(result.tableReady).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('handles syncAllLocalToRemote gracefully when cloud is not configured', async () => {
    const syncResult = await authDatabaseService.syncAllToCloud();
    expect(syncResult.success).toBe(false);
    expect(syncResult.syncedCount).toBe(0);
    expect(syncResult.error).toContain('Supabase no está configurado');
  });

  it('continues local registration and login seamlessly even when cloud is unconfigured', async () => {
    const result = await authDatabaseService.register('viajero_local@prueba.es', 'claveLocal123', 'Viajero Local');
    expect(result.user.email).toBe('viajero_local@prueba.es');
    expect(result.progress.profile.displayName).toBe('Viajero Local');

    const loginResult = await authDatabaseService.login('viajero_local@prueba.es', 'claveLocal123');
    expect(loginResult.user.email).toBe('viajero_local@prueba.es');
    expect(loginResult.progress.stats.coins).toBe(INITIAL_PROGRESS.stats.coins);
  });

  it('does NOT store player progress in localStorage when Supabase is configured', () => {
    const mockStorage: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
      get length() { return Object.keys(mockStorage).length; },
      key: (i: number) => Object.keys(mockStorage)[i] ?? null
    };

    // 1. Enable Supabase configuration
    supabaseService.saveConfig('https://dxamjklrbeulpgdkxsha.supabase.co', 'sb_publishable_dummy_key');
    expect(supabaseService.getConfig().isConfigured).toBe(true);

    const customProgress: PlayerProgress = {
      ...INITIAL_PROGRESS,
      stats: { ...INITIAL_PROGRESS.stats, coins: 9999 }
    };

    // 2. storageService.saveProgress should NOT write to localStorage
    storageService.saveProgress(customProgress);
    expect(globalThis.localStorage.getItem('aventura_espanola_progress_v2')).toBeNull();

    // 3. authDatabaseService.saveUserProgress should NOT write to localStorage
    authDatabaseService.saveUserProgress('test@prueba.es', customProgress);
    expect(globalThis.localStorage.getItem('aventura_db_progress_v1_test@prueba.es')).toBeNull();

    // 4. purgeLocalProgress cleans up any leftover keys
    globalThis.localStorage.setItem('aventura_espanola_progress_v2', '{"dummy": true}');
    storageService.purgeLocalProgress();
    expect(globalThis.localStorage.getItem('aventura_espanola_progress_v2')).toBeNull();
  });

  it('safeguards user displayName and prevents corruption to "years" or "Viajero"', async () => {
    // 1. If someone registers with name "years", it is sanitized and defaults to email username
    const res1 = await authDatabaseService.register('aniket@viajes.es', 'claveSegura1', 'years');
    expect(res1.user.displayName).toBe('aniket');
    expect(res1.progress.profile.displayName).toBe('aniket');
    expect(res1.progress.profile.character.name).toBe('aniket');

    // 2. If someone registers with a genuine name like "Mateo", it is preserved exactly
    const res2 = await authDatabaseService.register('mateo@viajes.es', 'claveSegura2', 'Mateo');
    expect(res2.user.displayName).toBe('Mateo');
    expect(res2.progress.profile.displayName).toBe('Mateo');
    expect(res2.progress.profile.character.name).toBe('Mateo');

    // 3. Login preserves the genuine name
    const loginRes = await authDatabaseService.login('mateo@viajes.es', 'claveSegura2');
    expect(loginRes.user.displayName).toBe('Mateo');
    expect(loginRes.progress.profile.displayName).toBe('Mateo');
  });

  it('ensures passwordHash is never overwritten or deleted during progress updates', async () => {
    const reg = await authDatabaseService.register('protegido@aventura.es', 'miContrasenaSecreta', 'Explorador');
    const originalHash = reg.user.passwordHash;
    expect(originalHash).toBeTruthy();
    expect(originalHash.length).toBeGreaterThan(10);

    // Update progress with 500 coins and check that passwordHash remains unchanged
    const updatedProgress: PlayerProgress = {
      ...reg.progress,
      stats: { ...reg.progress.stats, coins: 500 }
    };
    authDatabaseService.saveUserProgress('protegido@aventura.es', updatedProgress);

    // Verify user password is still valid for login
    const loginCheck = await authDatabaseService.login('protegido@aventura.es', 'miContrasenaSecreta');
    expect(loginCheck.user.passwordHash).toBe(originalHash);
    expect(loginCheck.progress.stats.coins).toBe(500);
  });
});
