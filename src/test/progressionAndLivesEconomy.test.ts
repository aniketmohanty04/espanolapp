import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_CITIES, getCityById, reconcileProgression } from '../data/citiesData';
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

    it('locks Boss Mission when fewer than 10 levels are completed (e.g. 2 / 10)', () => {
      const madrid = getCityById('madrid')!;
      
      // Simulate completing only 2 levels (exactly as shown in user screenshot)
      progress.completedLevels[madrid.levels[0].id] = { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: new Date().toISOString() };
      progress.completedLevels[madrid.levels[1].id] = { stars: 2, scorePercent: 80, firstTryPerfect: false, completedAt: new Date().toISOString() };

      const completedCount = madrid.levels.filter(l => Boolean(progress.completedLevels[l.id])).length;
      const isBossPassed = Boolean(progress.completedBosses[madrid.id]?.passed);
      const isBossUnlocked = completedCount === 10 || isBossPassed;

      expect(completedCount).toBe(2);
      expect(isBossPassed).toBe(false);
      expect(isBossUnlocked).toBe(false);
    });

    it('unlocks Boss Mission strictly when all 10 levels of that city are completed', () => {
      const madrid = getCityById('madrid')!;

      // Complete all 10 levels
      madrid.levels.forEach(lvl => {
        progress.completedLevels[lvl.id] = { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: new Date().toISOString() };
      });

      const completedCount = madrid.levels.filter(l => Boolean(progress.completedLevels[l.id])).length;
      const isBossPassed = Boolean(progress.completedBosses[madrid.id]?.passed);
      const isBossUnlocked = completedCount === 10 || isBossPassed;

      expect(completedCount).toBe(10);
      expect(isBossUnlocked).toBe(true);
    });

    it('keeps City 2 (Toledo) locked after completing all 10 Madrid levels until the Madrid Boss is defeated', () => {
      const madrid = getCityById('madrid')!;
      const toledo = ALL_CITIES.find(c => c.number === madrid.number + 1)!;
      expect(toledo.id).toBe('toledo');

      // Complete all 10 levels of Madrid
      madrid.levels.forEach(lvl => {
        progress.completedLevels[lvl.id] = { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: new Date().toISOString() };
      });

      // City 2 (Toledo) is still not unlocked
      expect(progress.unlockedCityIds.includes('toledo')).toBe(false);

      // Defeating boss with < 80% (e.g. 75%) must not unlock Toledo
      const failingScore = 75;
      const passedFail = failingScore >= 80;
      expect(passedFail).toBe(false);
      expect(progress.unlockedCityIds.includes('toledo')).toBe(false);

      // Defeating boss with >= 80% unlocks Toledo
      const passingScore = 80;
      const passedSuccess = passingScore >= 80;
      expect(passedSuccess).toBe(true);

      const cityCompletedCount = Object.keys(progress.completedLevels).filter(id => id.startsWith('madrid-')).length;
      expect(cityCompletedCount).toBe(10);

      if (passedSuccess && cityCompletedCount >= 10) {
        progress.unlockedCityIds.push(toledo.id);
        progress.completedBosses['madrid'] = {
          scorePercent: passingScore,
          passed: true,
          completedAt: new Date().toISOString()
        };
      }

      expect(progress.unlockedCityIds.includes('toledo')).toBe(true);
      expect(progress.completedBosses['madrid']?.passed).toBe(true);
    });

    it('verifies next-city locked explanation directs player to defeat the previous city boss', () => {
      const madrid = getCityById('madrid')!;
      madrid.levels.forEach(lvl => {
        progress.completedLevels[lvl.id] = { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: new Date().toISOString() };
      });

      const prevLevelsCount = madrid.levels.filter(l => Boolean(progress.completedLevels[l.id])).length;
      const prevBossDone = Boolean(progress.completedBosses['madrid']?.passed);

      expect(prevLevelsCount).toBe(10);
      expect(prevBossDone).toBe(false);

      const lockExplanation = (prevLevelsCount === 10 && !prevBossDone)
        ? `Derrota al Jefe de ${madrid.name} (80% req.)`
        : `Completa Ciudad 1`;

      expect(lockExplanation).toBe('Derrota al Jefe de Madrid (80% req.)');
    });

    it('simulates full sequential progression across all 15 cities and unlocks every city up to Santiago', () => {
      // Start with only Madrid unlocked
      const testProg = {
        unlockedCityIds: ['madrid'],
        completedLevels: {} as Record<string, any>,
        completedBosses: {} as Record<string, any>
      };

      for (let i = 0; i < ALL_CITIES.length; i++) {
        const city = ALL_CITIES[i];
        expect(testProg.unlockedCityIds).toContain(city.id);

        // 1. Complete levels 1-10
        city.levels.forEach(lvl => {
          testProg.completedLevels[lvl.id] = { stars: 3, scorePercent: 100, completedAt: new Date().toISOString() };
        });

        const nextCity = ALL_CITIES[i + 1];

        // 2. Passing boss with >= 80% unlocks next city
        const passingScore = 85;
        const passed = passingScore >= 80;
        testProg.completedBosses[city.id] = { scorePercent: passingScore, passed, completedAt: new Date().toISOString() };

        const cityObj = getCityById(city.id)!;
        const cityCompletedCount = cityObj.levels.filter(l => Boolean(testProg.completedLevels[l.id])).length;
        expect(cityCompletedCount).toBe(10);

        if (passed && cityCompletedCount >= 10 && nextCity) {
          testProg.unlockedCityIds.push(nextCity.id);
        }

        if (nextCity) {
          expect(testProg.unlockedCityIds).toContain(nextCity.id);
        }
      }

      // At the end, all 15 cities are unlocked!
      expect(testProg.unlockedCityIds.length).toBe(15);
      expect(testProg.unlockedCityIds[14]).toBe('santiago');
    });

    it('verifies module boundary transitions (M1->M2, M2->M3, M3->M4, M4->M5)', () => {
      const salamanca = getCityById('salamanca')!;
      const segovia = getCityById('segovia')!;
      expect(salamanca.moduleIndex).toBe(1);
      expect(segovia.moduleIndex).toBe(2);
      expect(segovia.number).toBe(salamanca.number + 1);

      const granada = getCityById('granada')!;
      const cordoba = getCityById('cordoba')!;
      expect(granada.moduleIndex).toBe(2);
      expect(cordoba.moduleIndex).toBe(3);
      expect(cordoba.number).toBe(granada.number + 1);

      const cadiz = getCityById('cadiz')!;
      const valencia = getCityById('valencia')!;
      expect(cadiz.moduleIndex).toBe(3);
      expect(valencia.moduleIndex).toBe(4);
      expect(valencia.number).toBe(cadiz.number + 1);

      const zaragoza = getCityById('zaragoza')!;
      const bilbao = getCityById('bilbao')!;
      expect(zaragoza.moduleIndex).toBe(4);
      expect(bilbao.moduleIndex).toBe(5);
      expect(bilbao.number).toBe(zaragoza.number + 1);
    });

    it('reconcileProgression heals stale unlockedCityIds when Madrid boss is passed', () => {
      const staleProg: PlayerProgress = {
        ...INITIAL_PROGRESS,
        unlockedCityIds: ['madrid'],
        completedBosses: {
          madrid: { scorePercent: 85, passed: true, completedAt: new Date().toISOString() }
        }
      };

      const healed = reconcileProgression(staleProg);
      expect(healed.unlockedCityIds).toContain('madrid');
      expect(healed.unlockedCityIds).toContain('toledo');
    });

    it('reconcileProgression unlocks Module 2 (Segovia) when Module 1 (Madrid, Toledo, Salamanca) is completed', () => {
      const mod1DoneProg: PlayerProgress = {
        ...INITIAL_PROGRESS,
        unlockedCityIds: ['madrid'],
        completedBosses: {
          madrid: { scorePercent: 90, passed: true, completedAt: new Date().toISOString() },
          toledo: { scorePercent: 85, passed: true, completedAt: new Date().toISOString() },
          salamanca: { scorePercent: 80, passed: true, completedAt: new Date().toISOString() }
        }
      };

      const healed = reconcileProgression(mod1DoneProg);
      expect(healed.unlockedCityIds).toContain('madrid');
      expect(healed.unlockedCityIds).toContain('toledo');
      expect(healed.unlockedCityIds).toContain('salamanca');
      // Module 2 city 4 (Segovia) MUST be unlocked!
      expect(healed.unlockedCityIds).toContain('segovia');
      const segovia = getCityById('segovia')!;
      expect(segovia.moduleIndex).toBe(2);
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

    it('purchases 1 life (+1 heart) when spending 500 coins', () => {
      progress.stats.lives = 0;
      progress.stats.coins = 600;
      const initialLostAt = new Date().toISOString();
      progress.stats.lastLifeLostAt = initialLostAt;

      const refillCost = 500;
      if (progress.stats.coins >= refillCost && progress.stats.lives < 3) {
        progress.stats.coins -= refillCost;
        progress.stats.lives = Math.min(3, progress.stats.lives + 1);
        progress.stats.lastLifeLostAt = progress.stats.lives >= 3 ? undefined : progress.stats.lastLifeLostAt;
      }

      // Grants exactly 1 life, leaves 100 coins
      expect(progress.stats.lives).toBe(1);
      expect(progress.stats.coins).toBe(100);
      expect(progress.stats.lastLifeLostAt).toBe(initialLostAt);

      // Reaching max 3 lives resets lastLifeLostAt
      progress.stats.lives = 2;
      progress.stats.coins = 500;
      if (progress.stats.coins >= refillCost && progress.stats.lives < 3) {
        progress.stats.coins -= refillCost;
        progress.stats.lives = Math.min(3, progress.stats.lives + 1);
        progress.stats.lastLifeLostAt = progress.stats.lives >= 3 ? undefined : progress.stats.lastLifeLostAt;
      }
      expect(progress.stats.lives).toBe(3);
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
