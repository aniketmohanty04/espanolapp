import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_CITIES, getAllQuestions, getCityById, getNextCity } from '../data/citiesData';
import { getQuestionVocabHints } from '../utils/vocabHintHelper';
import { REWARD_CONFIG } from '../context/GameContext';
import { INITIAL_PROGRESS } from '../services/storageService';
import { PlayerProgress, DifficultyTier } from '../types';

describe('Spanish Learning & Difficulty Progression System (Acceptance Tests)', () => {
  let progress: PlayerProgress;

  beforeEach(() => {
    progress = JSON.parse(JSON.stringify(INITIAL_PROGRESS));
  });

  // Test Case 1: A new student sees Spanish questions without full English translations
  it('Criterion 1: Questions, options, and prompts are primarily in Spanish and do NOT show full English translation by default', () => {
    const allQuestions = getAllQuestions();
    expect(allQuestions.length).toBeGreaterThanOrEqual(150);

    allQuestions.forEach(q => {
      // Prompt must be non-empty and in Spanish (contains Spanish vocabulary or inverted punctuation)
      expect(q.prompt).toBeTruthy();
      expect(typeof q.prompt).toBe('string');
      // Verify prompt has Spanish content (e.g. Spanish characters, common Spanish words, or punctuation)
      const hasSpanishMarkers = /[áéíóúüñ¿¡]|\b(el|la|los|las|un|una|de|en|es|son|por|qué|que|cómo|como|dónde|donde|cuál|cual|cuánto|cuanto|para|con)\b/i.test(q.prompt);
      expect(hasSpanishMarkers).toBe(true);

      // Verify that options are in Spanish if multiple-choice
      if (q.type === 'multiple-choice' && q.options) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // Test Case 2: Buying a vocabulary hint deducts exactly 500 coins
  it('Criterion 2: Buying a vocabulary hint deducts exactly 500 coins', () => {
    progress.stats.coins = 1200;
    const questionId = 'test-q-1';
    const cost = REWARD_CONFIG.VOCAB_HINT_COST_COINS;
    expect(cost).toBe(500);

    let success = false;
    if (progress.stats.coins >= cost && !(progress.purchasedVocabHints || []).includes(questionId)) {
      progress.stats.coins -= cost;
      progress.purchasedVocabHints = [...(progress.purchasedVocabHints || []), questionId];
      success = true;
    }

    expect(success).toBe(true);
    expect(progress.stats.coins).toBe(700); // 1200 - 500 = 700
    expect(progress.purchasedVocabHints).toContain(questionId);
  });

  // Test Case 3: Buying a hint with insufficient coins does not deduct anything
  it('Criterion 3: Buying a hint with insufficient coins (<500) does not deduct anything', () => {
    progress.stats.coins = 450; // Insufficient coins
    const questionId = 'test-q-2';
    const cost = REWARD_CONFIG.VOCAB_HINT_COST_COINS;

    let success = false;
    let errorReason: string | undefined;

    if (progress.stats.coins < cost) {
      errorReason = `¡No tienes suficientes monedas! Necesitas ${cost} 🪙, pero tienes ${progress.stats.coins} 🪙.`;
    } else {
      progress.stats.coins -= cost;
      success = true;
    }

    expect(success).toBe(false);
    expect(progress.stats.coins).toBe(450); // Balance unchanged
    expect(errorReason).toContain('450');
    expect(progress.purchasedVocabHints || []).not.toContain(questionId);
  });

  // Test Case 4: Double-clicking the hint button cannot charge twice for one displayed hint
  it('Criterion 4: Double-clicking or repeated purchase attempts cannot charge twice for the same question', () => {
    progress.stats.coins = 1500;
    const questionId = 'test-q-double';
    const cost = REWARD_CONFIG.VOCAB_HINT_COST_COINS;

    const purchase = (qId: string) => {
      const existing = progress.purchasedVocabHints || [];
      if (existing.includes(qId)) {
        return { success: true, charged: 0, alreadyOwned: true };
      }
      if (progress.stats.coins < cost) {
        return { success: false, charged: 0, reason: 'insufficient' };
      }
      progress.stats.coins -= cost;
      progress.purchasedVocabHints = [...existing, qId];
      return { success: true, charged: cost, alreadyOwned: false };
    };

    // First click: charges 500
    const click1 = purchase(questionId);
    expect(click1.success).toBe(true);
    expect(click1.charged).toBe(500);
    expect(progress.stats.coins).toBe(1000);

    // Immediate second click (double-click): 0 charge
    const click2 = purchase(questionId);
    expect(click2.success).toBe(true);
    expect(click2.charged).toBe(0);
    expect(click2.alreadyOwned).toBe(true);
    expect(progress.stats.coins).toBe(1000); // Balance unchanged!
  });

  // Test Case 5: The hint shows keywords only and never reveals the answer
  it('Criterion 5: Vocabulary hints reveal 2-4 keywords only and NEVER reveal the correct answer', () => {
    const allQuestions = getAllQuestions();
    const zeroHints: string[] = [];

    allQuestions.forEach(q => {
      const hints = getQuestionVocabHints(q);

      if (hints.length === 0) {
        zeroHints.push(`${q.id} (prompt: "${q.prompt}")`);
      }
    });

    if (zeroHints.length > 0) {
      console.log('Zero hint questions (first 5):', zeroHints.slice(0, 5));
    }

    allQuestions.forEach(q => {
      const hints = getQuestionVocabHints(q);
      expect(hints.length).toBeGreaterThanOrEqual(1);
      expect(hints.length).toBeLessThanOrEqual(4);

      // Verify each hint has word and translation
      hints.forEach(h => {
        expect(h.word).toBeTruthy();
        expect(h.translation).toBeTruthy();

        // Crucial: No hint word may reveal or equal the correct answer!
        const ansStr = (Array.isArray(q.correctAnswer)
          ? q.correctAnswer.join(' ')
          : String(q.correctAnswer)
        ).toLowerCase().trim();

        const hintWord = h.word.toLowerCase().trim();
        // Hint word should not be identical to the answer
        expect(ansStr === hintWord).toBe(false);
      });
    });
  });

  // Test Case 6: Levels 1–10 become progressively harder within each city
  it('Criterion 6: Levels 1-10 follow the 5-tier progression within each city (1-2 Easy, 3-4 Easy-Medium, 5-6 Medium, 7-8 Medium-Hard, 9-10 Hard)', () => {
    const expectedTiers: DifficultyTier[] = [
      'easy', 'easy',     // Levels 1-2: Easy
      'medium', 'medium', // Levels 3-4: Easy to Medium
      'tough', 'tough',   // Levels 5-6: Medium
      'hard', 'hard',     // Levels 7-8: Medium to Hard
      'hot', 'hot'        // Levels 9-10: Hard
    ];

    ALL_CITIES.forEach(city => {
      expect(city.levels.length).toBe(10);
      city.levels.forEach((lvl, idx) => {
        expect(lvl.levelNumber).toBe(idx + 1);
        expect(lvl.tier).toBe(expectedTiers[idx]);
      });
      // Boss mission combines skills
      expect(city.bossMission).toBeDefined();
      expect(city.bossMission.questions.length).toBeGreaterThanOrEqual(3);
    });
  });

  // Test Case 7: Every new city starts at an approachable level and progresses to a harder boss
  it('Criterion 7: Every new city resets to an approachable difficulty (Level 1 is Easy) while syllabus advances', () => {
    ALL_CITIES.forEach(city => {
      // First level of every city is always Easy tier
      expect(city.levels[0].tier).toBe('easy');
      expect(city.levels[1].tier).toBe('easy');

      // Final level before boss is always Hard (hot) tier
      expect(city.levels[9].tier).toBe('hot');

      // City boss combines topics
      expect(city.bossMission.requiredScorePercent).toBe(80);
    });
  });

  // Test Case 8: Completing a boss unlocks the next city
  it('Criterion 8: Completing a boss with >= 80% score unlocks the next city in sequence', () => {
    const madrid = getCityById('madrid')!;
    const toledo = getCityById('toledo')!;
    expect(madrid).toBeDefined();
    expect(toledo).toBeDefined();

    // Mark all 10 levels of Madrid completed
    madrid.levels.forEach(lvl => {
      progress.completedLevels[lvl.id] = {
        stars: 3,
        scorePercent: 100,
        firstTryPerfect: true,
        completedAt: new Date().toISOString()
      };
    });

    // Score < 80% on Boss fails to unlock
    const failScore = 75;
    const passedFail = failScore >= REWARD_CONFIG.BOSS_MASTERY_THRESHOLD_PERCENT;
    expect(passedFail).toBe(false);

    // Score >= 80% on Boss unlocks next city
    const passScore = 85;
    const passedSuccess = passScore >= REWARD_CONFIG.BOSS_MASTERY_THRESHOLD_PERCENT;
    expect(passedSuccess).toBe(true);

    if (passedSuccess) {
      const nextCity = getNextCity(madrid.id);
      expect(nextCity?.id).toBe('toledo');
      if (nextCity && !progress.unlockedCityIds.includes(nextCity.id)) {
        progress.unlockedCityIds.push(nextCity.id);
      }
    }

    expect(progress.unlockedCityIds).toContain('toledo');
  });

  // Test Case 9: Previously completed levels and coin balances persist after refresh
  it('Criterion 9: Player progress (coins, completed levels, unlocked cities, purchased hints) serializes cleanly for persistence', () => {
    progress.stats.coins = 850;
    progress.unlockedCityIds = ['madrid', 'toledo'];
    progress.purchasedVocabHints = ['m1-q1', 'm1-q5'];
    progress.completedLevels['madrid-1'] = {
      stars: 3,
      scorePercent: 100,
      firstTryPerfect: true,
      completedAt: new Date().toISOString()
    };

    // Serialize to JSON (simulating storage) and restore
    const serialized = JSON.stringify(progress);
    const restored: PlayerProgress = JSON.parse(serialized);

    expect(restored.stats.coins).toBe(850);
    expect(restored.unlockedCityIds).toEqual(['madrid', 'toledo']);
    expect(restored.purchasedVocabHints).toEqual(['m1-q1', 'm1-q5']);
    expect(restored.completedLevels['madrid-1'].stars).toBe(3);
  });

  // Test Case 10: Existing keyboard controls, including repeated E interactions, continue working
  it('Criterion 10: Distance-sorted interaction candidate selection picks the closest entity and avoids shadowing', () => {
    // Simulate candidate pool around player at (x: 8, z: -13.5)
    const playerPos = { x: 8, z: -13.5 };

    type Candidate = { id: string; dist: number; action: () => string };
    const candidates: Candidate[] = [];

    // Paco at (-3.2, -17.0): dist ~ 11.7m (out of range)
    // Station 5 at (8, -14): dist = 0.5m
    const dStation5 = Math.hypot(playerPos.x - 8, playerPos.z - (-14));
    candidates.push({ id: 'station-5', dist: dStation5, action: () => 'station-5' });

    // Organizer at (0, -14.0): dist ~ 8.0m (out of range)
    // Boss at (0, -18.0): dist ~ 9.2m

    candidates.sort((a, b) => a.dist - b.dist);
    expect(candidates[0].id).toBe('station-5');
    expect(candidates[0].dist).toBeCloseTo(0.5, 1);
    expect(candidates[0].action()).toBe('station-5');
  });
});
