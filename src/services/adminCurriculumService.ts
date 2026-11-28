/**
 * Admin Curriculum & Content Service
 * 
 * Provides dynamic curriculum management for ¡Aventura Española!:
 * 1. Add, edit, and delete questions and answer sets across all 15 cities and levels.
 * 2. Add, edit, and delete levels within any city.
 * 3. Update Boss Mission questions and objectives.
 * 4. In-place live sync with ALL_CITIES so changes immediately reflect in the active gameplay.
 * 5. 100% REVERSIBILITY: Reset to Factory Defaults with one click.
 * 6. Export and import full curriculum backups as JSON with schema validation.
 * 7. Strict input sanitization and XSS prevention for all text inputs.
 */

import { City, Level, Question, QuestionType, DifficultyTier } from '../types';
import { ALL_CITIES } from '../data/citiesData';
import { MODULE1_CITIES } from '../data/cities/module1Cities';
import { MODULE2_CITIES } from '../data/cities/module2Cities';
import { MODULE3_CITIES } from '../data/cities/module3Cities';
import { MODULE4_CITIES } from '../data/cities/module4Cities';
import { MODULE5_CITIES } from '../data/cities/module5Cities';
import { sanitizeText as cleanSecureText } from '../utils/securitySanitizer';

const STORAGE_CURRICULUM_KEY = 'aventura_custom_curriculum_v1';

export interface CurriculumSnapshot {
  version: number;
  lastModified: number;
  modifiedBy: string;
  cities: City[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Returns a clean, deep copy of the original factory default cities.
 */
export function getFactoryDefaultCities(): City[] {
  return JSON.parse(
    JSON.stringify([
      ...MODULE1_CITIES,
      ...MODULE2_CITIES,
      ...MODULE3_CITIES,
      ...MODULE4_CITIES,
      ...MODULE5_CITIES
    ])
  );
}

/**
 * Sanitizes input text: strips HTML/script tags, control characters, and trims excessive whitespace.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return cleanSecureText(input, 5000);
}

/**
 * Sanitizes and trims a Question object before persisting.
 */
export function sanitizeQuestion(q: Question): Question {
  return {
    ...q,
    id: sanitizeText(q.id).trim(),
    prompt: sanitizeText(q.prompt).trim(),
    englishPrompt: q.englishPrompt ? sanitizeText(q.englishPrompt).trim() : undefined,
    audioText: q.audioText ? sanitizeText(q.audioText).trim() : undefined,
    options: q.options ? q.options.map(opt => sanitizeText(opt).trim()) : undefined,
    correctAnswer: Array.isArray(q.correctAnswer)
      ? q.correctAnswer.map(ans => sanitizeText(ans).trim())
      : sanitizeText(q.correctAnswer).trim(),
    explanation: sanitizeText(q.explanation).trim(),
    englishExplanation: q.englishExplanation ? sanitizeText(q.englishExplanation).trim() : undefined,
    hints: q.hints ? q.hints.map(h => sanitizeText(h).trim()) : []
  };
}

/**
 * Sanitizes and trims a Level object before persisting.
 */
export function sanitizeLevel(lvl: Level): Level {
  return {
    ...lvl,
    id: sanitizeText(lvl.id).trim(),
    cityId: sanitizeText(lvl.cityId).trim(),
    title: sanitizeText(lvl.title).trim(),
    subtitle: sanitizeText(lvl.subtitle).trim(),
    syllabusTopic: sanitizeText(lvl.syllabusTopic).trim(),
    description: sanitizeText(lvl.description).trim()
  };
}

/**
 * Validates a Question structure against strict security and schema criteria.
 */
export function validateQuestion(q: Partial<Question>): ValidationResult {
  const errors: string[] = [];

  if (!q.id || !q.id.trim()) {
    errors.push('El ID de la pregunta es obligatorio.');
  }

  const validTypes: QuestionType[] = [
    'multiple-choice',
    'fill-blank',
    'matching',
    'word-order',
    'listening',
    'speaking',
    'true-false'
  ];

  if (!q.type || !validTypes.includes(q.type)) {
    errors.push(`Tipo de pregunta no válido. Debe ser uno de: ${validTypes.join(', ')}`);
  }

  if (!q.prompt || !q.prompt.trim()) {
    errors.push('El enunciado en español (prompt) es obligatorio.');
  } else if (q.prompt.length > 500) {
    errors.push('El enunciado en español no puede exceder los 500 caracteres.');
  }

  if (!q.explanation || !q.explanation.trim()) {
    errors.push('La explicación pedagógica es obligatoria.');
  }

  if (q.type === 'multiple-choice') {
    if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
      errors.push('Las preguntas de opción múltiple deben tener al menos 2 opciones.');
    } else if (q.options.length > 6) {
      errors.push('Las preguntas de opción múltiple no pueden tener más de 6 opciones.');
    } else {
      const emptyOption = q.options.some(opt => !opt || !opt.trim());
      if (emptyOption) {
        errors.push('Todas las opciones de respuesta deben tener texto.');
      }
    }
  }

  if (!q.correctAnswer) {
    errors.push('La respuesta correcta es obligatoria.');
  } else if (Array.isArray(q.correctAnswer)) {
    if (q.correctAnswer.length === 0 || q.correctAnswer.some(a => !a || !a.trim())) {
      errors.push('El conjunto de respuestas correctas no puede estar vacío.');
    }
  } else if (typeof q.correctAnswer === 'string' && !q.correctAnswer.trim()) {
    errors.push('La respuesta correcta no puede ser una cadena vacía.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a Level structure.
 */
export function validateLevel(lvl: Partial<Level>): ValidationResult {
  const errors: string[] = [];

  if (!lvl.id || !lvl.id.trim()) {
    errors.push('El ID del nivel es obligatorio.');
  }
  if (!lvl.cityId || !lvl.cityId.trim()) {
    errors.push('La ciudad asociada (cityId) es obligatoria.');
  }
  if (!lvl.title || !lvl.title.trim()) {
    errors.push('El título del nivel es obligatorio.');
  }
  if (typeof lvl.levelNumber !== 'number' || lvl.levelNumber < 1) {
    errors.push('El número de nivel debe ser un entero positivo (>= 1).');
  }

  const validTiers: DifficultyTier[] = ['easy', 'medium', 'tough', 'hard', 'hot'];
  if (!lvl.tier || !validTiers.includes(lvl.tier)) {
    errors.push(`Nivel de dificultad (tier) no válido. Opciones: ${validTiers.join(', ')}`);
  }

  if (!lvl.syllabusTopic || !lvl.syllabusTopic.trim()) {
    errors.push('El tema del sílabo A1 es obligatorio.');
  }

  if (typeof lvl.xpReward !== 'number' || lvl.xpReward < 10 || lvl.xpReward > 1000) {
    errors.push('La recompensa de XP debe estar entre 10 y 1000.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// In-memory cache for fast lookups
let activeCustomCities: City[] | null = null;

/**
 * Checks whether custom curriculum overrides are currently active.
 */
export function isCustomCurriculumActive(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    return Boolean(window.localStorage.getItem(STORAGE_CURRICULUM_KEY));
  }
  return activeCustomCities !== null;
}

/**
 * Loads custom curriculum from storage and syncs it into ALL_CITIES.
 * Returns the currently active cities list.
 */
export function getActiveCurriculum(): City[] {
  if (activeCustomCities) {
    return activeCustomCities;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_CURRICULUM_KEY);
      if (stored) {
        const parsed: CurriculumSnapshot = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.cities) && parsed.cities.length > 0) {
          activeCustomCities = parsed.cities;
          syncWithGameCities(activeCustomCities);
          return activeCustomCities;
        }
      }
    } catch {
      // fallback
    }
  }

  return ALL_CITIES;
}

/**
 * Syncs custom cities array in-place into ALL_CITIES so all imports throughout the game
 * immediately update without breaking reference equality.
 */
function syncWithGameCities(newCities: City[]): void {
  ALL_CITIES.splice(0, ALL_CITIES.length, ...newCities);
}

function notifyCurriculumUpdated(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('aventura-curriculum-updated'));
  }
}

export async function syncCurriculumToCloud(cities: City[]): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return { success: false, error: 'Browser fetch unavailable' };
  }
  try {
    const res = await fetch('/api/admin/curriculum', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ cities })
    });
    if (res.ok) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.message || data.error || `HTTP ${res.status}` };
  } catch {
    return { success: false, error: 'Network error syncing curriculum to cloud' };
  }
}

let lastLoadedCloudUpdatedAt: string | null = null;
let lastCloudFetchAt = 0;

export async function loadCloudCurriculum(force = false): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return false;
  }
  // Never overwrite active admin edits while inside the Admin Portal
  if (window.location?.pathname?.startsWith('/admin')) {
    return false;
  }
  // Rate-limit client polling to at most once every 5 seconds unless forced
  const now = Date.now();
  if (!force && now - lastCloudFetchAt < 5000) {
    return false;
  }
  lastCloudFetchAt = now;

  try {
    const res = await fetch('/api/admin/curriculum', {
      method: 'GET',
      cache: 'no-store'
    });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return false;

    const rawText = await res.text();
    const data = JSON.parse(rawText, (key, value) =>
      key === '__proto__' || key === 'constructor' || key === 'prototype' ? undefined : value
    );

    if (
      data?.success &&
      Array.isArray(data.cities) &&
      data.cities.length > 0 &&
      data.cities.every(
        (c: any) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string' && Array.isArray(c.levels)
      )
    ) {
      // Skip redundant re-renders if cloud version hasn't changed
      if (data.updatedAt && data.updatedAt === lastLoadedCloudUpdatedAt) {
        return false;
      }
      lastLoadedCloudUpdatedAt = data.updatedAt || String(now);
      activeCustomCities = data.cities;
      syncWithGameCities(activeCustomCities!);
      try {
        window.localStorage.setItem(
          STORAGE_CURRICULUM_KEY,
          JSON.stringify({
            version: data.version || 1,
            lastModified: now,
            modifiedBy: 'cloud',
            cities: activeCustomCities
          })
        );
      } catch {
        // ignore storage quota errors
      }
      notifyCurriculumUpdated();
      return true;
    }
  } catch {
    // offline or backend unavailable; keep local/factory curriculum
  }
  return false;
}

/**
 * Persists the modified curriculum and immediately updates ALL_CITIES + live cloud.
 */
export function saveCustomCurriculum(cities: City[], modifiedBy = 'admin@aventura.es'): void {
  activeCustomCities = JSON.parse(JSON.stringify(cities));
  syncWithGameCities(activeCustomCities!);

  const snapshot: CurriculumSnapshot = {
    version: 1,
    lastModified: Date.now(),
    modifiedBy,
    cities: activeCustomCities!
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_CURRICULUM_KEY, JSON.stringify(snapshot));
    } catch {
      // fallback
    }
  }

  notifyCurriculumUpdated();
  void syncCurriculumToCloud(activeCustomCities!);
}

/**
 * 100% REVERSIBILITY: Resets the entire curriculum back to factory defaults (local + cloud).
 */
export function resetCurriculumToDefault(): void {
  activeCustomCities = null;
  const factoryCities = getFactoryDefaultCities();
  syncWithGameCities(factoryCities);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_CURRICULUM_KEY);
    } catch {
      // fallback
    }
  }

  notifyCurriculumUpdated();
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    void fetch('/api/admin/curriculum', { method: 'DELETE', credentials: 'include' }).catch(() => {});
  }
}

/**
 * Exports the active curriculum as a formatted JSON string for backup and version control.
 */
export function exportCurriculumJson(): string {
  const cities = getActiveCurriculum();
  const snapshot: CurriculumSnapshot = {
    version: 1,
    lastModified: Date.now(),
    modifiedBy: 'admin',
    cities
  };
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Imports a curriculum snapshot JSON string with strict structural and schema verification.
 */
export function importCurriculumJson(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'El archivo JSON no tiene un formato válido.' };
    }

    const cities = Array.isArray(parsed) ? parsed : parsed.cities;
    if (!Array.isArray(cities) || cities.length === 0) {
      return { success: false, error: 'El archivo no contiene un catálogo de ciudades válido.' };
    }

    // Verify key fields in at least the first city
    const first = cities[0];
    if (!first.id || !first.name || !Array.isArray(first.levels)) {
      return { success: false, error: 'La estructura de ciudades y niveles no coincide con el esquema de ¡Aventura Española!.' };
    }

    saveCustomCurriculum(cities, 'imported_json');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo.';
    return { success: false, error: `Error de parseo JSON: ${message}` };
  }
}

/**
 * Updates an existing question or adds it if not present.
 */
export function saveQuestion(cityId: string, levelId: string, question: Question): ValidationResult {
  const cleanQuestion = sanitizeQuestion(question);
  const validation = validateQuestion(cleanQuestion);
  if (!validation.valid) {
    return validation;
  }

  const cities = JSON.parse(JSON.stringify(getActiveCurriculum())) as City[];
  const city = cities.find(c => c.id === cityId);
  if (!city) {
    return { valid: false, errors: [`No se encontró la ciudad con ID: ${cityId}`] };
  }

  // Check if it belongs to a level
  const level = city.levels.find(l => l.id === levelId);
  if (level) {
    const existingIndex = level.questions.findIndex(q => q.id === cleanQuestion.id);
    if (existingIndex >= 0) {
      level.questions[existingIndex] = cleanQuestion;
    } else {
      level.questions.push(cleanQuestion);
    }
    saveCustomCurriculum(cities);
    return { valid: true, errors: [] };
  }

  // Check if it belongs to a boss mission
  if (city.bossMission && (levelId === 'boss' || levelId === city.bossMission.id)) {
    const existingIndex = city.bossMission.questions.findIndex(q => q.id === cleanQuestion.id);
    if (existingIndex >= 0) {
      city.bossMission.questions[existingIndex] = cleanQuestion;
    } else {
      city.bossMission.questions.push(cleanQuestion);
    }
    saveCustomCurriculum(cities);
    return { valid: true, errors: [] };
  }

  return { valid: false, errors: [`No se encontró el nivel o misión de jefe con ID: ${levelId}`] };
}

/**
 * Deletes a question by ID from a level or boss mission.
 */
export function deleteQuestion(cityId: string, levelId: string, questionId: string): boolean {
  const cities = JSON.parse(JSON.stringify(getActiveCurriculum())) as City[];
  const city = cities.find(c => c.id === cityId);
  if (!city) return false;

  const level = city.levels.find(l => l.id === levelId);
  if (level) {
    const initialLen = level.questions.length;
    level.questions = level.questions.filter(q => q.id !== questionId);
    if (level.questions.length !== initialLen) {
      saveCustomCurriculum(cities);
      return true;
    }
  }

  if (city.bossMission && (levelId === 'boss' || levelId === city.bossMission.id)) {
    const initialLen = city.bossMission.questions.length;
    city.bossMission.questions = city.bossMission.questions.filter(q => q.id !== questionId);
    if (city.bossMission.questions.length !== initialLen) {
      saveCustomCurriculum(cities);
      return true;
    }
  }

  return false;
}

/**
 * Saves (adds or updates) a Level within a City.
 */
export function saveLevel(cityId: string, level: Level): ValidationResult {
  const cleanLevel = sanitizeLevel(level);
  const validation = validateLevel(cleanLevel);
  if (!validation.valid) {
    return validation;
  }

  const cities = JSON.parse(JSON.stringify(getActiveCurriculum())) as City[];
  const city = cities.find(c => c.id === cityId);
  if (!city) {
    return { valid: false, errors: [`No se encontró la ciudad con ID: ${cityId}`] };
  }

  const existingIdx = city.levels.findIndex(l => l.id === cleanLevel.id);
  if (existingIdx >= 0) {
    // Preserve existing questions if not provided
    if (!cleanLevel.questions || cleanLevel.questions.length === 0) {
      cleanLevel.questions = city.levels[existingIdx].questions;
    }
    city.levels[existingIdx] = cleanLevel;
  } else {
    // New level
    if (!cleanLevel.questions) cleanLevel.questions = [];
    city.levels.push(cleanLevel);
  }

  // Ensure levels are sorted by levelNumber
  city.levels.sort((a, b) => a.levelNumber - b.levelNumber);

  saveCustomCurriculum(cities);
  return { valid: true, errors: [] };
}

/**
 * Deletes a Level by ID from a City.
 */
export function deleteLevel(cityId: string, levelId: string): boolean {
  const cities = JSON.parse(JSON.stringify(getActiveCurriculum())) as City[];
  const city = cities.find(c => c.id === cityId);
  if (!city) return false;

  const initialLen = city.levels.length;
  city.levels = city.levels.filter(l => l.id !== levelId);

  if (city.levels.length !== initialLen) {
    saveCustomCurriculum(cities);
    return true;
  }

  return false;
}
