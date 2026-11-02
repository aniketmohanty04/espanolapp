import { City, Level, Question, PlayerProgress } from '../types';
import { MODULE1_CITIES } from './cities/module1Cities';
import { MODULE2_CITIES } from './cities/module2Cities';
import { MODULE3_CITIES } from './cities/module3Cities';
import { MODULE4_CITIES } from './cities/module4Cities';
import { MODULE5_CITIES } from './cities/module5Cities';

export const ALL_CITIES: City[] = [
  ...MODULE1_CITIES,
  ...MODULE2_CITIES,
  ...MODULE3_CITIES,
  ...MODULE4_CITIES,
  ...MODULE5_CITIES,
];

export function getCityById(cityId: string): City | undefined {
  return ALL_CITIES.find(c => c.id === cityId);
}

export function getCityByNumber(number: number): City | undefined {
  return ALL_CITIES.find(c => c.number === number);
}

export function getLevelById(cityId: string, levelId: string): Level | undefined {
  const city = getCityById(cityId);
  if (!city) return undefined;
  return city.levels.find(l => l.id === levelId);
}

export function getNextCity(currentCityId: string): City | undefined {
  const currentCity = getCityById(currentCityId);
  if (!currentCity) return undefined;
  return ALL_CITIES.find(c => c.number === currentCity.number + 1);
}

export function getAllQuestions(): Question[] {
  const questions: Question[] = [];
  for (const city of ALL_CITIES) {
    for (const level of city.levels) {
      questions.push(...level.questions);
    }
    if (city.bossMission) {
      questions.push(...city.bossMission.questions);
    }
  }
  return questions;
}

export function getQuestionById(questionId: string): Question | undefined {
  for (const city of ALL_CITIES) {
    for (const level of city.levels) {
      const q = level.questions.find(item => item.id === questionId);
      if (q) return q;
    }
    if (city.bossMission) {
      const bq = city.bossMission.questions.find(item => item.id === questionId);
      if (bq) return bq;
    }
  }
  return undefined;
}

/**
 * Reconciles and self-heals unlocked city IDs based on defeated bosses and existing unlocks.
 * Guarantees that:
 * 1. Madrid ('madrid') is always unlocked.
 * 2. Whenever a city's boss is passed (>=80%), the next city is automatically unlocked.
 * 3. Module boundaries (e.g. Salamanca -> Segovia for Module 2) properly unlock.
 * 4. Deduplicates and preserves chronological city progression ordering.
 */
export function reconcileProgression(progress: PlayerProgress): PlayerProgress {
  if (!progress) return progress;

  const unlocked = new Set<string>(
    progress.unlockedCityIds && progress.unlockedCityIds.length > 0
      ? progress.unlockedCityIds
      : ['madrid']
  );
  unlocked.add('madrid');

  for (let i = 0; i < ALL_CITIES.length - 1; i++) {
    const currentCity = ALL_CITIES[i];
    const nextCity = ALL_CITIES[i + 1];

    const bossPassed = Boolean(progress.completedBosses?.[currentCity.id]?.passed);
    if (bossPassed && nextCity) {
      unlocked.add(nextCity.id);
    }
  }

  // Preserve the canonical sequential order of ALL_CITIES
  const sortedUnlocked = ALL_CITIES
    .filter(c => unlocked.has(c.id))
    .map(c => c.id);

  const prevList = progress.unlockedCityIds || [];
  const isDifferent =
    sortedUnlocked.length !== prevList.length ||
    sortedUnlocked.some((id, idx) => id !== prevList[idx]);

  if (isDifferent) {
    return {
      ...progress,
      unlockedCityIds: sortedUnlocked
    };
  }

  return progress;
}
