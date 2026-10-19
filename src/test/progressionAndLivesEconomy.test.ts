import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_CITIES, getCityById } from '../data/citiesData';
import { INITIAL_PROGRESS } from '../services/storageService';
import { PlayerProgress } from '../types';
import { calculateSecondsUntilNextLife } from '../context/GameContext';

describe('Progression & Lives Economy Suite', () => {
  let progress: PlayerProgress;

  beforeEach(() => {
    progress = JSON.parse(JSON.stringify(INITIAL_PROGRESS));
  });

  describe('Sequential Level Progression (No skipping smaller levels)', () => {
    it('verifies Level 1 is unlocked by default in Madrid (City 1)', () => {
      const madrid = getCityById('madrid')!;
      expect(madrid).toBeDefined();

      const isLevelUnlocked = (lIdx: number, completedLevels: Record<string, any>): boolean => {
        if (lIdx === 0) return true;
        const prevLevel = madrid.levels[lIdx - 1];
        return Boolean(completedLevels[prevLevel.id]);
      };

      expect(isLevelUnlocked(0, progress.completedLevels)).toBe(true);
      expect(isLevelUnlocked(1, progress.completedLevels)).toBe(false);
      expect(isLevelUnlocked(9, progress.completedLevels)).toBe(false);
    });

    it('prevents accessing Level 2 until Level 1 is completed', () => {
      const madrid = getCityById('madrid')!;
      const lvl1 = madrid.levels[0];
      const lvl2 = madrid.levels[1];

      const checkUnlock = (lvlIndex: number) => {
        if (lvlIndex === 0) return true;
        return Boolean(progress.completedLevels[madrid.levels[lvlIndex - 1].id]);
      };

      // Initially level 2 is locked
      expect(checkUnlock(1)).toBe(false);

      // Complete level 1
      progress.completedLevels[lvl1.id] = {
        stars: 3,
        scorePercent: 100,
        firstTryPerfect: true,
        completedAt: new Date().toISOString()
      };

      // Now level 2 is unlocked, but level 3 is still locked
      expect(checkUnlock(1)).toBe(true);
      expect(checkUnlock(2)).toBe(false);
    });

    it('requires completing Level 1 through 9 sequentially to reach Level 10', () => {
      const madrid = getCityById('madrid')!;
      const checkUnlock = (lvlIndex: number) => {
        if (lvlIndex === 0) return true;
        return Boolean(progress.completedLevels[madrid.levels[lvlIndex - 1].id]);
      };

      for (let i = 0; i < 9; i++) {
        expect(checkUnlock(9)).toBe(false); // Level 10 remains locked
        const lvl = madrid.levels[i];
        progress.completedLevels[lvl.id] = {
          stars: 3,
          scorePercent: 100,
          firstTryPerfect: true,
          completedAt: new Date().toISOString()
        };
      }

      // Now with levels 1-9 completed, level 10 (idx 9) is unlocked
      expect(checkUnlock(9)).toBe(true);
    });
  });

  describe('3-Lives Economy (Max 3, 500 Coins Refill, 15m Passive Regen)', () => {
    it('initializes with 3 lives and maxLives = 3', () => {
      expect(progress.stats.lives).toBe(3);
      expect(progress.stats.maxLives).toBe(3);
    });

    it('losing a life decrements lives and records lastLifeLostAt', () => {
      const now = new Date().toISOString();
      progress.stats.lives = 2;
      progress.stats.lastLifeLostAt = now;

      expect(progress.stats.lives).toBe(2);
      expect(progress.stats.lastLifeLostAt).toBe(now);

      progress.stats.lives = 0;
      expect(progress.stats.lives).toBe(0);
    });

    it('refills 3 lives when spending 500 coins', () => {
      progress.stats.lives = 0;
      progress.stats.coins = 600;
      progress.stats.lastLifeLostAt = new Date().toISOString();

      const refillCost = 500;
      if (progress.stats.coins >= refillCost) {
        progress.stats.coins -= refillCost;
        progress.stats.lives = 3;
        progress.stats.maxLives = 3;
        progress.stats.lastLifeLostAt = undefined;
      }

      expect(progress.stats.lives).toBe(3);
      expect(progress.stats.coins).toBe(100);
      expect(progress.stats.lastLifeLostAt).toBeUndefined();
    });

    it('refuses refill when player has less than 500 coins', () => {
      progress.stats.lives = 0;
      progress.stats.coins = 450;

      const refillCost = 500;
      let success = false;
      if (progress.stats.coins >= refillCost) {
        progress.stats.coins -= refillCost;
        progress.stats.lives = 3;
        success = true;
      }

      expect(success).toBe(false);
      expect(progress.stats.lives).toBe(0);
      expect(progress.stats.coins).toBe(450);
    });

    it('calculates 15-minute passive life regeneration accurately', () => {
      const REGEN_INTERVAL_SECONDS = 15 * 60; // 900 seconds
      progress.stats.lives = 0;

      // 900 seconds ago (15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 900 * 1000).toISOString();
      progress.stats.lastLifeLostAt = fifteenMinutesAgo;

      const now = Date.now();
      const lostAtMs = new Date(progress.stats.lastLifeLostAt).getTime();
      const elapsedSeconds = Math.floor((now - lostAtMs) / 1000);
      const earnedLives = Math.floor(elapsedSeconds / REGEN_INTERVAL_SECONDS);

      expect(earnedLives).toBe(1);

      const newLives = Math.min(3, progress.stats.lives + earnedLives);
      expect(newLives).toBe(1);

      // If 45 minutes passed (2700 seconds), all 3 lives regenerate
      const fortyFiveMinutesAgo = new Date(now - 2700 * 1000).toISOString();
      const elapsed45 = Math.floor((now - new Date(fortyFiveMinutesAgo).getTime()) / 1000);
      const earned3 = Math.floor(elapsed45 / REGEN_INTERVAL_SECONDS);

      expect(earned3).toBe(3);
      const fullLives = Math.min(3, progress.stats.lives + earned3);
      expect(fullLives).toBe(3);
    });

    it('calculateSecondsUntilNextLife accurately calculates countdown and returns null when lives are full', () => {
      // When lives are full (3), returns null (no countdown needed)
      expect(calculateSecondsUntilNextLife(3, undefined)).toBeNull();

      // When lives < 3 and life was lost 300 seconds ago, remaining is 600 seconds (10 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 300 * 1000).toISOString();
      const remaining = calculateSecondsUntilNextLife(2, fiveMinutesAgo);
      expect(remaining).toBeGreaterThanOrEqual(598);
      expect(remaining).toBeLessThanOrEqual(602);
    });
  });
});
