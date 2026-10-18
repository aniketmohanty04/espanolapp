import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseService } from '../services/supabaseClient';
import { authDatabaseService } from '../services/authDatabaseService';
import { INITIAL_PROGRESS } from '../services/storageService';

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
});
