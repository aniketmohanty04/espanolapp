import { describe, it, expect, beforeEach } from 'vitest';
import { authDatabaseService } from '../services/authDatabaseService';
import { supabaseService } from '../services/supabaseClient';
import { INITIAL_PROGRESS } from '../services/storageService';
import { PlayerProgress } from '../types';

describe('Authentication & Database Progress Service', () => {
  beforeEach(() => {
    supabaseService.setExplicitlyDisabled(true);
    authDatabaseService.clearAll();
  });

  it('initializes and seeds the demo account properly', async () => {
    await authDatabaseService.init();
    const users = authDatabaseService.getRegisteredUsers();
    expect(users.length).toBeGreaterThanOrEqual(1);
    
    const demoUser = users.find(u => u.email === 'viajero@aventura.es');
    expect(demoUser).toBeDefined();
    expect(demoUser?.displayName).toBe('Elena la Viajera');

    // Should successfully log in with demo credentials
    const authResult = await authDatabaseService.login('viajero@aventura.es', 'espana123');
    expect(authResult.user.email).toBe('viajero@aventura.es');
    expect(authResult.progress.stats.coins).toBe(850);
    expect(authResult.progress.completedLevels['madrid-1']).toBeDefined();
    expect(authResult.progress.completedLevels['madrid-1'].stars).toBe(3);
  });

  it('successfully registers a new user and sets up their initial progress', async () => {
    const email = 'carlos@universidad.es';
    const password = 'miPasswordSegura2026';
    const displayName = 'Carlos Explorador';

    const result = await authDatabaseService.register(email, password, displayName);
    expect(result.user.email).toBe(email);
    expect(result.user.displayName).toBe(displayName);
    expect(result.progress.profile.displayName).toBe(displayName);
    expect(result.progress.profile.email).toBe(email);
    expect(result.progress.profile.isGuest).toBe(false);

    // Verify session
    expect(authDatabaseService.getCurrentSessionEmail()).toBe(email);
  });

  it('prevents registration with duplicate emails', async () => {
    await authDatabaseService.register('test@espanol.es', 'pass123', 'Test 1');
    
    await expect(
      authDatabaseService.register('test@espanol.es', 'anotherPass', 'Test 2')
    ).rejects.toThrow(/Ya existe una cuenta registrada/i);

    // Also checks case insensitivity
    await expect(
      authDatabaseService.register('TEST@espanol.es', 'anotherPass', 'Test 2')
    ).rejects.toThrow(/Ya existe una cuenta registrada/i);
  });

  it('rejects login with a non-existent email', async () => {
    await expect(
      authDatabaseService.login('noexiste@aventura.es', 'cualquierClave')
    ).rejects.toThrow(/No existe ninguna cuenta/i);
  });

  it('rejects login when password does not match', async () => {
    await authDatabaseService.register('ana@madrid.es', 'secretoCorrecto', 'Ana');

    await expect(
      authDatabaseService.login('ana@madrid.es', 'claveIncorrecta')
    ).rejects.toThrow(/Contraseña incorrecta/i);
  });

  it('restores exact saved progress when email and password match', async () => {
    const email = 'mateo@viajes.es';
    const password = 'caminoDeSantiago';
    
    // 1. Register Mateo
    const registered = await authDatabaseService.register(email, password, 'Mateo');
    expect(registered.progress.stats.coins).toBe(INITIAL_PROGRESS.stats.coins);

    // 2. Simulate playing the game: Mateo completes Madrid Levels 1 & 2 and earns 600 coins
    const updatedProgress: PlayerProgress = {
      ...registered.progress,
      stats: {
        ...registered.progress.stats,
        coins: 850,
        xp: 400,
        level: 2
      },
      unlockedCityIds: ['madrid', 'toledo'],
      completedLevels: {
        'madrid-1': { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: new Date().toISOString() },
        'madrid-2': { stars: 2, scorePercent: 85, firstTryPerfect: false, completedAt: new Date().toISOString() }
      }
    };

    authDatabaseService.saveUserProgress(email, updatedProgress);

    // 3. Simulate Mateo logging out
    authDatabaseService.logout();
    expect(authDatabaseService.getCurrentSessionEmail()).toBeNull();

    // 4. Mateo logs in again with matching email and password
    const loginResult = await authDatabaseService.login(email, password);
    expect(loginResult.user.email).toBe(email);
    
    // Verifies Mateo starts exactly from where he left off
    expect(loginResult.progress.stats.coins).toBe(850);
    expect(loginResult.progress.stats.xp).toBe(400);
    expect(loginResult.progress.unlockedCityIds).toContain('toledo');
    expect(loginResult.progress.completedLevels['madrid-1'].stars).toBe(3);
    expect(loginResult.progress.completedLevels['madrid-2'].stars).toBe(2);
  });

  it('maintains independent progress for different user accounts', async () => {
    // User A: Lucía in Toledo with 1200 coins
    await authDatabaseService.register('lucia@aventura.es', 'passLucia', 'Lucía');
    const luciaProg: PlayerProgress = {
      ...INITIAL_PROGRESS,
      stats: { ...INITIAL_PROGRESS.stats, coins: 1200 },
      unlockedCityIds: ['madrid', 'toledo']
    };
    authDatabaseService.saveUserProgress('lucia@aventura.es', luciaProg);

    // User B: Diego in Salamanca with 350 coins
    await authDatabaseService.register('diego@aventura.es', 'passDiego', 'Diego');
    const diegoProg: PlayerProgress = {
      ...INITIAL_PROGRESS,
      stats: { ...INITIAL_PROGRESS.stats, coins: 350 },
      unlockedCityIds: ['madrid', 'toledo', 'salamanca']
    };
    authDatabaseService.saveUserProgress('diego@aventura.es', diegoProg);

    // Logging in as Lucía returns Lucía's progress
    const resLucia = await authDatabaseService.login('lucia@aventura.es', 'passLucia');
    expect(resLucia.progress.stats.coins).toBe(1200);
    expect(resLucia.progress.unlockedCityIds).toEqual(['madrid', 'toledo']);

    // Logging in as Diego returns Diego's progress
    const resDiego = await authDatabaseService.login('diego@aventura.es', 'passDiego');
    expect(resDiego.progress.stats.coins).toBe(350);
    expect(resDiego.progress.unlockedCityIds).toEqual(['madrid', 'toledo', 'salamanca']);
  });

  it('preserves the registered name and never defaults to Alex', async () => {
    const regResult = await authDatabaseService.register('aniket@viajes.es', 'segura123', 'Aniket');
    expect(regResult.user.displayName).toBe('Aniket');
    expect(regResult.progress.profile.displayName).toBe('Aniket');
    expect(regResult.progress.profile.character.name).toBe('Aniket');

    // Simulate logging out and logging in
    authDatabaseService.logout();
    const loginResult = await authDatabaseService.login('aniket@viajes.es', 'segura123');
    expect(loginResult.user.displayName).toBe('Aniket');
    expect(loginResult.progress.profile.displayName).toBe('Aniket');
    expect(loginResult.progress.profile.character.name).toBe('Aniket');
  });

  it('resets game values to zero and starts again upon forgot password reset', async () => {
    // 1. Register a player and advance their stats
    const email = 'jugador_olvidadizo@aventura.es';
    const oldPass = 'claveVieja123';
    const reg = await authDatabaseService.register(email, oldPass, 'Carlos');
    
    // Player has accumulated 1500 coins, 600 xp, completed level, and unlocked 3 cities
    const advancedProgress: PlayerProgress = {
      ...reg.progress,
      stats: {
        ...reg.progress.stats,
        coins: 1500,
        xp: 600,
        level: 3
      },
      unlockedCityIds: ['madrid', 'toledo', 'salamanca'],
      completedLevels: {
        'madrid-1': { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: new Date().toISOString() }
      }
    };
    authDatabaseService.saveUserProgress(email, advancedProgress);

    // 2. Player forgot their password -> Call resetPasswordAndRestart with a new password
    const newPass = 'nuevaClaveSegura2026';
    const resetResult = await authDatabaseService.resetPasswordAndRestart(email, newPass);

    // 3. Verify game values are reset to zero
    expect(resetResult.progress.stats.coins).toBe(0);
    expect(resetResult.progress.stats.xp).toBe(0);
    expect(resetResult.progress.stats.level).toBe(1);
    expect(resetResult.progress.unlockedCityIds).toEqual(['madrid']);
    expect(Object.keys(resetResult.progress.completedLevels).length).toBe(0);

    // 4. Verify player name is preserved
    expect(resetResult.user.displayName).toBe('Carlos');
    expect(resetResult.progress.profile.displayName).toBe('Carlos');

    // 5. Verify the old password no longer works
    await expect(authDatabaseService.login(email, oldPass)).rejects.toThrow('Contraseña incorrecta');

    // 6. Verify login works with the new password and returns the reset progress
    const newLogin = await authDatabaseService.login(email, newPass);
    expect(newLogin.user.email).toBe(email);
    expect(newLogin.progress.stats.coins).toBe(0);
    expect(newLogin.progress.unlockedCityIds).toEqual(['madrid']);
  });

  it('rejects resetPasswordAndRestart for non-existent email or short password', async () => {
    await expect(
      authDatabaseService.resetPasswordAndRestart('noexiste@aventura.es', 'pass123')
    ).rejects.toThrow('No se encontró ninguna cuenta');

    await expect(
      authDatabaseService.resetPasswordAndRestart('aniket@viajes.es', '12')
    ).rejects.toThrow('La nueva contraseña debe tener al menos 4 caracteres');
  });
});

