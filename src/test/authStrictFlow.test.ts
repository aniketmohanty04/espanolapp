import { describe, it, expect, beforeEach } from 'vitest';
import { authDatabaseService } from '../services/authDatabaseService';
import { supabaseService } from '../services/supabaseClient';
import { storageService, INITIAL_PROGRESS } from '../services/storageService';
import { PlayerProgress } from '../types';

describe('Strict Auth & Direct Game Progression Flow', () => {
  beforeEach(() => {
    supabaseService.setExplicitlyDisabled(true);
    authDatabaseService.clearAll();
    storageService.resetProgress();
  });

  it('guarantees new registration starts with completed onboarding and standard character', async () => {
    const res = await authDatabaseService.register('viajero_real@aventura.es', 'password123', 'Lucía la Conquistadora');
    
    // User profile should take the registered name directly
    expect(res.user.displayName).toBe('Lucía la Conquistadora');
    expect(res.progress.profile.displayName).toBe('Lucía la Conquistadora');
    expect(res.progress.profile.character.name).toBe('Lucía la Conquistadora');
    
    // Onboarding should be marked complete (5) so user goes directly to gameplay, no personalization screen
    expect(res.progress.profile.onboardingStep).toBe(5);
    expect(res.progress.profile.tutorialCompleted).toBe(true);
    expect(res.progress.profile.isGuest).toBe(false);
  });

  it('restores user directly to the progress where they left off without resetting', async () => {
    // 1. Register player
    const reg = await authDatabaseService.register('marcos@aventura.es', 'claveMarcos1', 'Marcos');
    expect(reg.progress.stats.coins).toBe(INITIAL_PROGRESS.stats.coins);

    // 2. Player advances through Madrid, unlocks Barcelona & Valencia, and reaches 1250 coins
    const advancedProgress: PlayerProgress = {
      ...reg.progress,
      stats: {
        ...reg.progress.stats,
        coins: 1250,
        xp: 680,
        level: 3,
        streak: 5
      },
      unlockedCityIds: ['madrid', 'barcelona', 'valencia'],
      completedLevels: {
        'madrid-1': { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: '2026-10-18T10:00:00Z' },
        'madrid-2': { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: '2026-10-18T11:00:00Z' },
        'barcelona-1': { stars: 2, scorePercent: 80, firstTryPerfect: false, completedAt: '2026-10-18T12:00:00Z' }
      }
    };
    authDatabaseService.saveUserProgress('marcos@aventura.es', advancedProgress);

    // 3. User logs out
    authDatabaseService.logout();
    expect(authDatabaseService.getCurrentSessionEmail()).toBeNull();

    // 4. User logs back in
    const loginResult = await authDatabaseService.login('marcos@aventura.es', 'claveMarcos1');

    // Verify user is restored exactly where they left off
    expect(loginResult.user.email).toBe('marcos@aventura.es');
    expect(loginResult.progress.stats.coins).toBe(1250);
    expect(loginResult.progress.stats.xp).toBe(680);
    expect(loginResult.progress.stats.level).toBe(3);
    expect(loginResult.progress.unlockedCityIds).toEqual(['madrid', 'barcelona', 'valencia']);
    expect(loginResult.progress.completedLevels['barcelona-1'].stars).toBe(2);
  });

  it('rejects unauthenticated access when session is cleared', () => {
    authDatabaseService.logout();
    const session = authDatabaseService.getCurrentSessionEmail();
    expect(session).toBeNull();
  });
});
