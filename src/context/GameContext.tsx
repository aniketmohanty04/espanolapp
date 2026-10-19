import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlayerProgress, PlayerCharacter, PlayerProfile, GameScreen, Question, City, Level } from '../types';
import { storageService, INITIAL_PROGRESS, DEFAULT_PROFILE, DEFAULT_CHARACTER } from '../services/storageService';
import { authDatabaseService } from '../services/authDatabaseService';
import { supabaseService } from '../services/supabaseClient';
import { soundService } from '../services/soundService';
import { ALL_CITIES, getNextCity } from '../data/citiesData';
import confetti from 'canvas-confetti';

export const REWARD_CONFIG = {
  FIRST_ATTEMPT_CORRECT_COINS: 100,
  COMPLETED_DIALOGUE_COINS: 250,
  CITY_COMPLETION_BONUS_COINS: 500,
  ENGLISH_TRANSLATION_COST_COINS: 1000,
  BOSS_MASTERY_THRESHOLD_PERCENT: 80
};

interface GameContextType {
  progress: PlayerProgress;
  currentScreen: GameScreen;
  activeCityId: string | null;
  activeLevelId: string | null;
  activeBossCityId: string | null;
  isFestivalOpen: boolean;
  soundMuted: boolean;
  setCurrentScreen: (screen: GameScreen) => void;
  setActiveCityId: (id: string | null) => void;
  setActiveLevelId: (id: string | null) => void;
  setActiveBossCityId: (id: string | null) => void;
  setIsFestivalOpen: (open: boolean) => void;
  toggleSound: () => void;
  // Profile & onboarding
  updateProfile: (profile: Partial<PlayerProfile>) => void;
  updateCharacter: (character: PlayerCharacter) => void;
  completeOnboarding: () => void;
  startAsGuest: (name: string) => void;
  // Gameplay
  recordQuestionResult: (
    question: Question,
    cityId: string,
    levelId: string,
    isCorrect: boolean,
    isFirstAttempt: boolean
  ) => { coinsAwarded: number; isDuplicate: boolean };
  recordDialogueCompleted: (dialogueId: string) => { coinsAwarded: number; isDuplicate: boolean };
  purchaseTranslation: (questionId: string) => { success: boolean; reason?: string };
  recordLevelCompleted: (
    cityId: string,
    levelId: string,
    scorePercent: number,
    perfectFirstTry: boolean
  ) => void;
  recordBossCompleted: (
    cityId: string,
    scorePercent: number
  ) => { passed: boolean; unlockedNextCityId?: string; bonusCoins: number };
  markMistakeMastered: (questionId: string) => void;
  visitFestivalStall: (stallId: string, rewardCoins?: number) => void;
  recordFinalAssessment: (scorePercent: number) => { passed: boolean; certificateId: string };
  completeStudyDay: (dayNumber: number) => void;
  resetAllProgress: () => void;
  exportSaveFile: () => void;
  importSaveFile: (file: File) => Promise<void>;
  // Life System (3 max lives, 500 coins refill, 15m regen)
  loseLife: () => number;
  refillLivesWithCoins: () => { success: boolean; error?: string };
  secondsUntilNextLife: number | null;
  awardCoins: (amount: number) => void;
  awardLife: () => void;
  // Database Auth & Progress
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordAndRestart: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  currentUserEmail: string | null;
}

export const LIFE_REFILL_COIN_COST = 500;
export const LIFE_REGEN_INTERVAL_SECONDS = 15 * 60; // 900 seconds (15 minutes)

export function calculateSecondsUntilNextLife(
  lives: number | undefined,
  lastLifeLostAt: string | undefined
): number | null {
  const currentLives = typeof lives === 'number' ? Math.min(3, lives) : 3;
  if (currentLives >= 3) return null;
  const now = Date.now();
  const lostAtMs = lastLifeLostAt ? new Date(lastLifeLostAt).getTime() : now;
  const safeLostAtMs = isNaN(lostAtMs) ? now : lostAtMs;
  const elapsedSeconds = Math.max(0, Math.floor((now - safeLostAtMs) / 1000));
  return Math.max(0, LIFE_REGEN_INTERVAL_SECONDS - (elapsedSeconds % LIFE_REGEN_INTERVAL_SECONDS));
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return authDatabaseService.getCurrentSessionEmail();
  });

  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const sessionEmail = authDatabaseService.getCurrentSessionEmail();
    if (sessionEmail) {
      const userProg = authDatabaseService.loadUserProgress(sessionEmail);
      if (userProg) return userProg;
    }
    return storageService.loadProgress();
  });
  
  // Track whether remote authoritative progress has finished loading from Supabase cloud
  const [isRemoteSyncReady, setIsRemoteSyncReady] = useState<boolean>(() => {
    const sessionEmail = authDatabaseService.getCurrentSessionEmail();
    if (!sessionEmail || !supabaseService.getConfig().isConfigured) return true;
    return false;
  });

  // Seed demo account and load authoritative progress from Supabase cloud on start
  useEffect(() => {
    authDatabaseService.init().catch(err => console.warn('Auth DB init error:', err));

    if (supabaseService.getConfig().isConfigured) {
      storageService.purgeLocalProgress();
    }

    const sessionEmail = authDatabaseService.getCurrentSessionEmail();
    if (sessionEmail && supabaseService.getConfig().isConfigured) {
      authDatabaseService.loadUserProgressAsync(sessionEmail).then(remoteProg => {
        if (remoteProg) {
          setProgress(remoteProg);
          setCurrentScreen('world-map');
        }
        setIsRemoteSyncReady(true);
      }).catch(err => {
        console.warn('Failed to load initial Supabase progress:', err);
        setIsRemoteSyncReady(true);
      });
    } else {
      setIsRemoteSyncReady(true);
      if (!sessionEmail) {
        setCurrentScreen('auth');
      }
    }
  }, []);

  // Determine initial screen: if client is not logged in, the 1st screen is Login ('auth')
  const getInitialScreen = (): GameScreen => {
    const sessionEmail = authDatabaseService.getCurrentSessionEmail();
    if (!sessionEmail) return 'auth';
    return 'world-map';
  };
  
  const [currentScreen, setCurrentScreen] = useState<GameScreen>(getInitialScreen);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [activeBossCityId, setActiveBossCityId] = useState<string | null>(null);
  const [isFestivalOpen, setIsFestivalOpen] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(soundService.getIsMuted());

  // Life Management Constants (3 max lives, 500 coins to refill, 15 minutes per free life)
  const secondsUntilNextLife = calculateSecondsUntilNextLife(
    progress.stats.lives,
    progress.stats.lastLifeLostAt
  );

  // Passive 15-Minute Life Regeneration Check (runs every 15s, re-renders ONLY when a life is actually awarded)
  useEffect(() => {
    const checkAndRegen = () => {
      const currentLives = typeof progress.stats.lives === 'number' ? Math.min(3, progress.stats.lives) : 3;
      if (currentLives >= 3) {
        return;
      }

      const now = Date.now();
      const lostAtMs = progress.stats.lastLifeLostAt ? new Date(progress.stats.lastLifeLostAt).getTime() : now;
      const safeLostAtMs = isNaN(lostAtMs) ? now : lostAtMs;
      const elapsedSeconds = Math.max(0, Math.floor((now - safeLostAtMs) / 1000));
      const earnedLives = Math.floor(elapsedSeconds / LIFE_REGEN_INTERVAL_SECONDS);

      if (earnedLives > 0) {
        const newLives = Math.min(3, currentLives + earnedLives);
        const remainderSeconds = elapsedSeconds % LIFE_REGEN_INTERVAL_SECONDS;
        const newLostAt = newLives >= 3 ? undefined : new Date(now - remainderSeconds * 1000).toISOString();

        setProgress(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            lives: newLives,
            maxLives: 3,
            lastLifeLostAt: newLostAt
          }
        }));
      }
    };

    checkAndRegen();
    const interval = setInterval(checkAndRegen, 15000);
    return () => clearInterval(interval);
  }, [progress.stats.lives, progress.stats.lastLifeLostAt]);

  // Deduct 1 life when a question is answered incorrectly
  const loseLife = useCallback((): number => {
    let remaining = 0;
    setProgress(prev => {
      const current = typeof prev.stats.lives === 'number' ? Math.min(3, prev.stats.lives) : 3;
      const updated = Math.max(0, current - 1);
      remaining = updated;
      const nowIso = new Date().toISOString();
      return {
        ...prev,
        stats: {
          ...prev.stats,
          lives: updated,
          maxLives: 3,
          lastLifeLostAt: prev.stats.lastLifeLostAt || nowIso
        }
      };
    });
    return remaining;
  }, []);

  // Spend 500 coins to restore 3 lives immediately
  const refillLivesWithCoins = useCallback((): { success: boolean; error?: string } => {
    if (progress.stats.coins < LIFE_REFILL_COIN_COST) {
      return {
        success: false,
        error: `No tienes suficientes monedas (necesitas ${LIFE_REFILL_COIN_COST} 🪙, tienes ${progress.stats.coins} 🪙).`
      };
    }

    setProgress(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        coins: Math.max(0, prev.stats.coins - LIFE_REFILL_COIN_COST),
        lives: 3,
        maxLives: 3,
        lastLifeLostAt: undefined
      }
    }));

    soundService.playLevelComplete();
    return { success: true };
  }, [progress.stats.coins]);

  // Save progress whenever it updates (immediate to local storage, debounced 800ms to Supabase cloud)
  useEffect(() => {
    // CRITICAL: Do NOT write uninitialized local progress to database while remote load is still in flight!
    if (!isRemoteSyncReady) {
      return;
    }

    storageService.saveProgress(progress);
    const emailToSave = currentUserEmail || progress.profile?.email;
    if (emailToSave) {
      const saveTimer = setTimeout(() => {
        authDatabaseService.saveUserProgress(emailToSave, progress);
      }, 800);
      return () => clearTimeout(saveTimer);
    }
  }, [progress, currentUserEmail, isRemoteSyncReady]);

  // Update streak if a new day has arrived
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (progress.stats.lastActiveDate !== today) {
      setProgress(prev => {
        const lastDate = new Date(prev.stats.lastActiveDate);
        const currentDate = new Date(today);
        const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        const newStreak = diffDays === 1 ? prev.stats.streak + 1 : (diffDays === 0 ? prev.stats.streak : 1);
        return {
          ...prev,
          stats: {
            ...prev.stats,
            streak: newStreak,
            lastActiveDate: today
          }
        };
      });
    }
  }, [progress.stats.lastActiveDate]);

  const toggleSound = useCallback(() => {
    setSoundMuted(prev => {
      const next = !prev;
      soundService.setMuted(next);
      return next;
    });
  }, []);

  // Profile & Onboarding
  const updateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setProgress(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates }
    }));
  }, []);

  const updateCharacter = useCallback((character: PlayerCharacter) => {
    setProgress(prev => ({
      ...prev,
      profile: { ...prev.profile, character }
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        onboardingStep: 5,
        tutorialCompleted: true
      }
    }));
    setCurrentScreen('world-map');
  }, []);

  const startAsGuest = useCallback((name: string) => {
    const guestId = `guest_${Date.now().toString(36)}`;
    setProgress(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        id: guestId,
        displayName: name || 'Viajero',
        isGuest: true,
        createdAt: new Date().toISOString(),
        onboardingStep: 2 // Moves to character creator
      }
    }));
  }, []);

  // Database Auth: Login existing user and restore their exact saved progress from Supabase
  const loginUser = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user, progress: loadedProgress } = await authDatabaseService.login(email, password);
      setIsRemoteSyncReady(true);
      setCurrentUserEmail(user.email);
      setProgress(loadedProgress);
      
      // Route user to where they left off
      // Direct user straight to their progress where they left off
      setCurrentScreen('world-map');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al iniciar sesión.' };
    }
  }, []);

  // Database Auth: Register new user account and persist their initial progress directly to Supabase
  const registerUser = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user, progress: registeredProgress } = await authDatabaseService.register(
        email, 
        password, 
        name,
        progress.profile.isGuest ? progress : undefined
      );
      setIsRemoteSyncReady(true);
      setCurrentUserEmail(user.email);
      setProgress(registeredProgress);
      // Direct registered player straight to their adventure where they start off
      setCurrentScreen('world-map');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al registrar la cuenta.' };
    }
  }, [progress]);

  // Database Auth: Reset password when forgotten, reset all game stats to zero, and restart adventure
  const resetPasswordAndRestart = useCallback(async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user, progress: resetProgress } = await authDatabaseService.resetPasswordAndRestart(email, newPassword);
      setIsRemoteSyncReady(true);
      setCurrentUserEmail(user.email);
      setProgress(resetProgress);
      setCurrentScreen('world-map');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al restablecer la contraseña.' };
    }
  }, []);

  // Database Auth: Log out user, save their current progress to Supabase, and return to 1st screen (Login page)
  const logoutUser = useCallback(() => {
    if (currentUserEmail) {
      authDatabaseService.saveUserProgress(currentUserEmail, progress);
    }
    authDatabaseService.logout();
    setCurrentUserEmail(null);
    storageService.purgeLocalProgress();
    const guestProgress: PlayerProgress = {
      ...INITIAL_PROGRESS,
      profile: {
        ...DEFAULT_PROFILE,
        id: '',
        displayName: 'Viajero',
        isGuest: false,
        createdAt: new Date().toISOString(),
        onboardingStep: 5,
        tutorialCompleted: true
      }
    };
    setProgress(guestProgress);
    setCurrentScreen('auth');
  }, [currentUserEmail, progress]);

  // Record single question attempt with anti-duplication safeguards
  const recordQuestionResult = useCallback((
    question: Question,
    cityId: string,
    levelId: string,
    isCorrect: boolean,
    isFirstAttempt: boolean
  ): { coinsAwarded: number; isDuplicate: boolean } => {
    let coinsAwarded = 0;
    let isDuplicate = false;

    setProgress(prev => {
      let newCoins = prev.stats.coins;
      let newXp = prev.stats.xp;
      const rewardedList = [...prev.rewardedQuestionFirstTries];
      const incorrectMap = { ...prev.incorrectQuestions };

      if (isCorrect) {
        newXp += 15;
        // Check if first-attempt reward was already claimed for this question ID
        if (isFirstAttempt) {
          if (!rewardedList.includes(question.id)) {
            coinsAwarded = REWARD_CONFIG.FIRST_ATTEMPT_CORRECT_COINS;
            newCoins += coinsAwarded;
            rewardedList.push(question.id);
          } else {
            isDuplicate = true;
          }
        }
        // If question was in mistakes list, mark mastered
        if (incorrectMap[question.id]) {
          incorrectMap[question.id] = {
            ...incorrectMap[question.id],
            mastered: true
          };
        }
      } else {
        // Track incorrect attempt for Spaced Review Notebook
        const existing = incorrectMap[question.id];
        incorrectMap[question.id] = {
          questionId: question.id,
          cityId,
          levelId,
          prompt: question.prompt,
          explanation: question.explanation,
          lastFailedAt: new Date().toISOString(),
          failCount: existing ? existing.failCount + 1 : 1,
          mastered: false
        };
      }

      // Manage lives deduction on wrong answer
      let currentLives = typeof prev.stats.lives === 'number' ? Math.min(3, prev.stats.lives) : 3;
      let newLastLifeLostAt = prev.stats.lastLifeLostAt;

      if (!isCorrect) {
        currentLives = Math.max(0, currentLives - 1);
        if (!newLastLifeLostAt) {
          newLastLifeLostAt = new Date().toISOString();
        }
      }

      // Check level-up from XP
      const newLevel = Math.floor(newXp / 300) + 1;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          coins: newCoins,
          xp: newXp,
          level: newLevel,
          lives: currentLives,
          maxLives: 3,
          lastLifeLostAt: currentLives < 3 ? newLastLifeLostAt : undefined
        },
        rewardedQuestionFirstTries: rewardedList,
        incorrectQuestions: incorrectMap
      };
    });

    if (coinsAwarded > 0) {
      soundService.playCoinReward();
    }

    return { coinsAwarded, isDuplicate };
  }, []);

  // Record dialogue completed with 250 coins and anti-duplication
  const recordDialogueCompleted = useCallback((dialogueId: string): { coinsAwarded: number; isDuplicate: boolean } => {
    let coinsAwarded = 0;
    let isDuplicate = false;

    setProgress(prev => {
      if (prev.rewardedDialogueIds.includes(dialogueId)) {
        isDuplicate = true;
        return prev;
      }

      coinsAwarded = REWARD_CONFIG.COMPLETED_DIALOGUE_COINS;
      const newCoins = prev.stats.coins + coinsAwarded;
      const newXp = prev.stats.xp + 40;
      const newLevel = Math.floor(newXp / 300) + 1;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          coins: newCoins,
          xp: newXp,
          level: newLevel
        },
        rewardedDialogueIds: [...prev.rewardedDialogueIds, dialogueId]
      };
    });

    if (coinsAwarded > 0) {
      soundService.playCoinReward();
    }

    return { coinsAwarded, isDuplicate };
  }, []);

  // Purchase English translation with balance check and anti-duplication
  const purchaseTranslation = useCallback((questionId: string): { success: boolean; reason?: string } => {
    let success = false;
    let reason: string | undefined;

    setProgress(prev => {
      // Already purchased?
      if (prev.purchasedTranslations.includes(questionId)) {
        success = true;
        return prev; // Already unlocked, no charge
      }

      // Sufficient balance?
      if (prev.stats.coins < REWARD_CONFIG.ENGLISH_TRANSLATION_COST_COINS) {
        reason = `Not enough coins. You need ${REWARD_CONFIG.ENGLISH_TRANSLATION_COST_COINS} coins, but you have ${prev.stats.coins}.`;
        return prev;
      }

      // Deduct coins safely
      success = true;
      const newCoins = prev.stats.coins - REWARD_CONFIG.ENGLISH_TRANSLATION_COST_COINS;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          coins: newCoins
        },
        purchasedTranslations: [...prev.purchasedTranslations, questionId]
      };
    });

    return { success, reason };
  }, []);

  // Record level completed
  const recordLevelCompleted = useCallback((
    cityId: string,
    levelId: string,
    scorePercent: number,
    perfectFirstTry: boolean
  ) => {
    setProgress(prev => {
      const existing = prev.completedLevels[levelId];
      const stars = scorePercent >= 90 ? 3 : scorePercent >= 70 ? 2 : 1;

      const completedLevels = {
        ...prev.completedLevels,
        [levelId]: {
          stars: Math.max(stars, existing ? existing.stars : 0),
          scorePercent: Math.max(scorePercent, existing ? existing.scorePercent : 0),
          firstTryPerfect: Boolean(perfectFirstTry || existing?.firstTryPerfect),
          completedAt: new Date().toISOString()
        }
      };

      const newXp = prev.stats.xp + 50;
      const newLevel = Math.floor(newXp / 300) + 1;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          xp: newXp,
          level: newLevel
        },
        completedLevels
      };
    });
  }, []);

  // Record boss completed, enforce mastery threshold (e.g. 80%), unlock next city
  const recordBossCompleted = useCallback((
    cityId: string,
    scorePercent: number
  ): { passed: boolean; unlockedNextCityId?: string; bonusCoins: number } => {
    const passed = scorePercent >= REWARD_CONFIG.BOSS_MASTERY_THRESHOLD_PERCENT;
    let unlockedNextCityId: string | undefined;
    let bonusCoins = 0;

    setProgress(prev => {
      const completedBosses = {
        ...prev.completedBosses,
        [cityId]: {
          scorePercent,
          passed,
          completedAt: new Date().toISOString()
        }
      };

      const unlockedCityIds = [...prev.unlockedCityIds];
      const rewardedCities = [...prev.rewardedCityCompletionIds];
      let newCoins = prev.stats.coins;
      let newXp = prev.stats.xp;

      if (passed) {
        // Unlock next city if exists
        const nextCity = getNextCity(cityId);
        if (nextCity && !unlockedCityIds.includes(nextCity.id)) {
          unlockedCityIds.push(nextCity.id);
          unlockedNextCityId = nextCity.id;
        }

        // City completion bonus (500 coins)
        if (!rewardedCities.includes(cityId)) {
          bonusCoins = REWARD_CONFIG.CITY_COMPLETION_BONUS_COINS;
          newCoins += bonusCoins;
          rewardedCities.push(cityId);
        }

        newXp += 200;
      }

      // Check achievements
      const achievements = { ...prev.achievements };
      if (passed) {
        achievements[`boss_${cityId}`] = new Date().toISOString();
        if (cityId === 'madrid') achievements.first_boss = new Date().toISOString();
        if (cityId === 'salamanca') achievements.module1_graduate = new Date().toISOString();
        if (cityId === 'granada') achievements.module2_graduate = new Date().toISOString();
        if (cityId === 'cadiz') achievements.module3_graduate = new Date().toISOString();
        if (cityId === 'zaragoza') achievements.module4_graduate = new Date().toISOString();
        if (cityId === 'santiago') achievements.camino_conqueror = new Date().toISOString();
      }

      const newLevel = Math.floor(newXp / 300) + 1;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          coins: newCoins,
          xp: newXp,
          level: newLevel
        },
        unlockedCityIds,
        completedBosses,
        rewardedCityCompletionIds: rewardedCities,
        achievements
      };
    });

    if (passed) {
      soundService.playVictoryFanfare();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if confetti unavailable in environment
      }
    }

    return { passed, unlockedNextCityId, bonusCoins };
  }, []);

  // Mark mistake as mastered in spaced review notebook
  const markMistakeMastered = useCallback((questionId: string) => {
    setProgress(prev => {
      const incorrectMap = { ...prev.incorrectQuestions };
      if (incorrectMap[questionId]) {
        incorrectMap[questionId] = {
          ...incorrectMap[questionId],
          mastered: true
        };
      }
      return {
        ...prev,
        stats: {
          ...prev.stats,
          xp: prev.stats.xp + 25
        },
        incorrectQuestions: incorrectMap
      };
    });
    soundService.playCorrect();
  }, []);

  // Visit festival stall
  const visitFestivalStall = useCallback((stallId: string, rewardCoins: number = 200) => {
    setProgress(prev => {
      if (prev.festivalVisitedStalls.includes(stallId)) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          coins: prev.stats.coins + rewardCoins,
          xp: prev.stats.xp + 50
        },
        festivalVisitedStalls: [...prev.festivalVisitedStalls, stallId]
      };
    });
    soundService.playCoinReward();
  }, []);

  // Award custom coins (e.g. from festival games, fortune wheel, tomatina)
  const awardCoins = useCallback((amount: number) => {
    setProgress(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        coins: Math.max(0, prev.stats.coins + amount)
      }
    }));
  }, []);

  // Award 1 life up to max 3
  const awardLife = useCallback(() => {
    setProgress(prev => {
      const current = typeof prev.stats.lives === 'number' ? prev.stats.lives : 3;
      const updated = Math.min(3, current + 1);
      return {
        ...prev,
        stats: {
          ...prev.stats,
          lives: updated,
          maxLives: 3,
          lastLifeLostAt: updated >= 3 ? undefined : prev.stats.lastLifeLostAt
        }
      };
    });
  }, []);

  // Record cumulative final assessment
  const recordFinalAssessment = useCallback((scorePercent: number): { passed: boolean; certificateId: string } => {
    const passed = scorePercent >= 70;
    const certificateId = `AE-A1-${Date.now().toString(36).toUpperCase()}`;

    setProgress(prev => {
      const achievements = { ...prev.achievements };
      if (passed) {
        achievements.fiesta_legend = new Date().toISOString();
      }
      return {
        ...prev,
        stats: {
          ...prev.stats,
          xp: prev.stats.xp + (passed ? 500 : 100),
          coins: prev.stats.coins + (passed ? 1000 : 100)
        },
        finalAssessmentCompleted: {
          scorePercent,
          passed,
          completedAt: new Date().toISOString(),
          certificateId
        },
        achievements
      };
    });

    if (passed) {
      soundService.playVictoryFanfare();
      try {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 }
        });
      } catch {
        // ignore
      }
    }

    return { passed, certificateId };
  }, []);

  // Mark study schedule day as completed
  const completeStudyDay = useCallback((dayNumber: number) => {
    setProgress(prev => {
      if (prev.completedStudyDays.includes(dayNumber)) return prev;
      return {
        ...prev,
        completedStudyDays: [...prev.completedStudyDays, dayNumber],
        stats: {
          ...prev.stats,
          coins: prev.stats.coins + 50,
          xp: prev.stats.xp + 30
        }
      };
    });
  }, []);

  // Reset all progress
  const resetAllProgress = useCallback(() => {
    const fresh = storageService.resetProgress();
    setProgress(fresh);
    setCurrentScreen('welcome');
    setActiveCityId(null);
    setActiveLevelId(null);
    setActiveBossCityId(null);
    setIsFestivalOpen(false);
  }, []);

  // Export progress
  const exportSaveFile = useCallback(() => {
    storageService.exportProgress(progress);
  }, [progress]);

  // Import progress
  const importSaveFile = useCallback(async (file: File) => {
    const loaded = await storageService.importProgress(file);
    setProgress(loaded);
  }, []);

  return (
    <GameContext.Provider
      value={{
        progress,
        currentScreen,
        activeCityId,
        activeLevelId,
        activeBossCityId,
        isFestivalOpen,
        soundMuted,
        setCurrentScreen,
        setActiveCityId,
        setActiveLevelId,
        setActiveBossCityId,
        setIsFestivalOpen,
        toggleSound,
        updateProfile,
        updateCharacter,
        completeOnboarding,
        startAsGuest,
        recordQuestionResult,
        recordDialogueCompleted,
        purchaseTranslation,
        recordLevelCompleted,
        recordBossCompleted,
        markMistakeMastered,
        visitFestivalStall,
        recordFinalAssessment,
        completeStudyDay,
        resetAllProgress,
        exportSaveFile,
        importSaveFile,
        loseLife,
        refillLivesWithCoins,
        secondsUntilNextLife,
        awardCoins,
        awardLife,
        loginUser,
        registerUser,
        resetPasswordAndRestart,
        logoutUser,
        currentUserEmail
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

/**
 * Localized hook for components needing a 1-second live countdown timer (e.g. Navbar, OutOfLivesModal).
 * Confines 1-second re-renders strictly to the mounting component without re-rendering the whole app tree.
 */
export function useLifeCountdown(): number | null {
  const { progress } = useGame();
  const [remaining, setRemaining] = useState<number | null>(() =>
    calculateSecondsUntilNextLife(progress.stats.lives, progress.stats.lastLifeLostAt)
  );

  useEffect(() => {
    const update = () => {
      setRemaining(calculateSecondsUntilNextLife(progress.stats.lives, progress.stats.lastLifeLostAt));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [progress.stats.lives, progress.stats.lastLifeLostAt]);

  return remaining;
}

