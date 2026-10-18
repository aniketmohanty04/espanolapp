import { PlayerProgress } from '../types';

const STORAGE_KEY = 'aventura_espanola_progress_v1';

export const INITIAL_PROGRESS: PlayerProgress = {
  stats: {
    coins: 250, // Starting balance
    xp: 0,
    level: 1,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0]
  },
  unlockedCityIds: ['madrid'],
  completedLevels: {},
  completedBosses: {},
  purchasedTranslations: [],
  rewardedQuestionFirstTries: [],
  rewardedDialogueIds: [],
  rewardedCityCompletionIds: [],
  incorrectQuestions: {},
  achievements: {
    first_steps: new Date().toISOString()
  },
  completedStudyDays: [1],
  festivalVisitedStalls: []
};

export const storageService = {
  loadProgress(): PlayerProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return INITIAL_PROGRESS;
      const parsed = JSON.parse(data);
      // Ensure all fields exist
      return {
        ...INITIAL_PROGRESS,
        ...parsed,
        stats: {
          ...INITIAL_PROGRESS.stats,
          ...(parsed.stats || {})
        },
        unlockedCityIds: parsed.unlockedCityIds?.length ? parsed.unlockedCityIds : ['madrid'],
        completedLevels: parsed.completedLevels || {},
        completedBosses: parsed.completedBosses || {},
        purchasedTranslations: parsed.purchasedTranslations || [],
        rewardedQuestionFirstTries: parsed.rewardedQuestionFirstTries || [],
        rewardedDialogueIds: parsed.rewardedDialogueIds || [],
        rewardedCityCompletionIds: parsed.rewardedCityCompletionIds || [],
        incorrectQuestions: parsed.incorrectQuestions || {},
        achievements: parsed.achievements || {},
        completedStudyDays: parsed.completedStudyDays || [1],
        festivalVisitedStalls: parsed.festivalVisitedStalls || []
      };
    } catch (err) {
      console.warn('Failed to load player progress from localStorage:', err);
      return INITIAL_PROGRESS;
    }
  },

  saveProgress(progress: PlayerProgress): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (err) {
      console.error('Failed to save player progress:', err);
    }
  },

  resetProgress(): PlayerProgress {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to reset player progress:', err);
    }
    return INITIAL_PROGRESS;
  },

  exportProgress(progress: PlayerProgress): void {
    const jsonStr = JSON.stringify(progress, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aventura_espanola_progreso_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importProgress(file: File): Promise<PlayerProgress> {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || !parsed.stats || typeof parsed.stats.coins !== 'number') {
      throw new Error('Archivo de progreso no válido.');
    }
    const validated: PlayerProgress = {
      ...INITIAL_PROGRESS,
      ...parsed
    };
    this.saveProgress(validated);
    return validated;
  }
};
