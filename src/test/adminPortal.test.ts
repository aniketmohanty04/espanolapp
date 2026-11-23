import { describe, it, expect, beforeEach } from 'vitest';
import { 
  authenticateAdmin, 
  isAdminAuthenticated, 
  logoutAdmin, 
  getLockoutRemainingSeconds,
  resetAttemptTracker,
  computeAdminHash,
  timingSafeEqual
} from '../services/adminAuthService';
import { 
  getActiveCurriculum, 
  isCustomCurriculumActive, 
  saveQuestion, 
  deleteQuestion, 
  saveLevel, 
  deleteLevel, 
  resetCurriculumToDefault, 
  exportCurriculumJson, 
  importCurriculumJson, 
  sanitizeText, 
  validateQuestion, 
  validateLevel,
  getFactoryDefaultCities
} from '../services/adminCurriculumService';
import { getCityById, ALL_CITIES } from '../data/citiesData';
import { Question, Level } from '../types';

describe('Admin Portal & Security Test Suite', () => {
  beforeEach(() => {
    logoutAdmin();
    resetAttemptTracker();
    resetCurriculumToDefault();
  });

  describe('1. Admin Authentication & Brute-Force Safeguards', () => {
    it('successfully authenticates with correct default admin credentials', async () => {
      expect(isAdminAuthenticated()).toBe(false);

      const res = await authenticateAdmin('admin@aventura.es', 'AventuraAdmin2026!');
      expect(res.success).toBe(true);
      expect(isAdminAuthenticated()).toBe(true);
    });

    it('rejects incorrect password and decrements remaining attempts', async () => {
      const res = await authenticateAdmin('admin@aventura.es', 'wrong_password_123');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Credenciales de administrador incorrectas');
      expect(isAdminAuthenticated()).toBe(false);
    });

    it('rejects invalid email address', async () => {
      const res = await authenticateAdmin('intruder@hacker.com', 'AventuraAdmin2026!');
      expect(res.success).toBe(false);
      expect(isAdminAuthenticated()).toBe(false);
    });

    it('triggers brute-force lockout after 5 consecutive failed attempts', async () => {
      for (let i = 0; i < 4; i++) {
        const res = await authenticateAdmin('admin@aventura.es', `wrong_pass_${i}`);
        expect(res.success).toBe(false);
        expect(getLockoutRemainingSeconds()).toBe(0);
      }

      // 5th failed attempt triggers lockout
      const fifth = await authenticateAdmin('admin@aventura.es', 'wrong_pass_5');
      expect(fifth.success).toBe(false);
      expect(fifth.error).toContain('Límite de 5 intentos alcanzado. Acceso bloqueado');
      expect(getLockoutRemainingSeconds()).toBeGreaterThan(0);

      // Subsequent attempt even with correct password is blocked during lockout
      const blocked = await authenticateAdmin('admin@aventura.es', 'AventuraAdmin2026!');
      expect(blocked.success).toBe(false);
      expect(blocked.error).toContain('Demasiados intentos fallidos');
    });

    it('logout terminates active session immediately', async () => {
      await authenticateAdmin('admin@aventura.es', 'AventuraAdmin2026!');
      expect(isAdminAuthenticated()).toBe(true);

      logoutAdmin();
      expect(isAdminAuthenticated()).toBe(false);
    });

    it('timingSafeEqual correctly compares strings with constant-time security', () => {
      expect(timingSafeEqual('secret_hash_abc', 'secret_hash_abc')).toBe(true);
      expect(timingSafeEqual('secret_hash_abc', 'secret_hash_xyz')).toBe(false);
      expect(timingSafeEqual('short', 'longer_string')).toBe(false);
    });
  });

  describe('2. Input Validation & XSS Prevention', () => {
    it('strips dangerous HTML and script tags via sanitizeText', () => {
      const dangerous = '<script>alert("hack")</script>¿Cómo estás? <img src=x onerror=alert(1)>';
      const clean = sanitizeText(dangerous);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('</script>');
      expect(clean).not.toContain('<img');
      expect(clean).toContain('¿Cómo estás?');
    });

    it('validates question schema and catches missing required fields', () => {
      const invalidQ: Partial<Question> = {
        id: '',
        type: 'multiple-choice',
        prompt: '',
        correctAnswer: ''
      };

      const res = validateQuestion(invalidQ);
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThanOrEqual(3);
      expect(res.errors).toContain('El ID de la pregunta es obligatorio.');
      expect(res.errors).toContain('El enunciado en español (prompt) es obligatorio.');
    });

    it('validates that multiple-choice questions have between 2 and 6 non-empty options', () => {
      const qOneOpt: Partial<Question> = {
        id: 'test-q1',
        type: 'multiple-choice',
        prompt: '¿Cómo te llamas?',
        options: ['Solo una opción'],
        correctAnswer: 'Solo una opción',
        explanation: 'Explicación válida'
      };

      const res = validateQuestion(qOneOpt);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('al menos 2 opciones'))).toBe(true);
    });

    it('validates Level structure and catches invalid tiers or negative level numbers', () => {
      const invalidLevel: Partial<Level> = {
        id: 'lvl-invalid',
        cityId: 'madrid',
        levelNumber: -1,
        title: '',
        tier: 'hot',
        syllabusTopic: '',
        xpReward: 5
      };

      const res = validateLevel(invalidLevel);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('entero positivo'))).toBe(true);
      expect(res.errors.some(e => e.includes('título'))).toBe(true);
    });
  });

  describe('3. Curriculum Operations: Questions & Levels', () => {
    it('adds a new question to a level and reflects in getCityById', () => {
      const newQuestion: Question = {
        id: 'madrid-custom-q99',
        type: 'multiple-choice',
        prompt: '¿Dónde está la Puerta del Sol?',
        englishPrompt: 'Where is Puerta del Sol?',
        options: ['En Madrid', 'En Barcelona', 'En Sevilla', 'En Valencia'],
        correctAnswer: 'En Madrid',
        explanation: 'La Puerta del Sol está en el centro de Madrid.',
        englishExplanation: 'Puerta del Sol is located at the center of Madrid.',
        hints: ['Es el centro de la capital'],
        syllabusRef: 'M1.General',
        difficulty: 'easy'
      };

      const saveRes = saveQuestion('madrid', 'madrid-1', newQuestion);
      expect(saveRes.valid).toBe(true);
      expect(isCustomCurriculumActive()).toBe(true);

      const city = getCityById('madrid');
      const level = city?.levels.find(l => l.id === 'madrid-1');
      const savedQ = level?.questions.find(q => q.id === 'madrid-custom-q99');

      expect(savedQ).toBeDefined();
      expect(savedQ?.prompt).toBe('¿Dónde está la Puerta del Sol?');
      expect(savedQ?.correctAnswer).toBe('En Madrid');
    });

    it('updates an existing question and modifies correct answer and explanation', () => {
      const city = getCityById('madrid');
      const firstQ = city!.levels[0].questions[0];

      const updatedQ: Question = {
        ...firstQ,
        prompt: '¡Enunciado modificado por el profesor admin!',
        correctAnswer: 'Respuesta nueva'
      };

      const saveRes = saveQuestion('madrid', 'madrid-1', updatedQ);
      expect(saveRes.valid).toBe(true);

      const reloadedCity = getCityById('madrid');
      const reloadedQ = reloadedCity!.levels[0].questions.find(q => q.id === firstQ.id);

      expect(reloadedQ?.prompt).toBe('¡Enunciado modificado por el profesor admin!');
      expect(reloadedQ?.correctAnswer).toBe('Respuesta nueva');
    });

    it('deletes a question from a level', () => {
      const city = getCityById('madrid');
      const targetQ = city!.levels[0].questions[0];
      const initialCount = city!.levels[0].questions.length;

      const deleted = deleteQuestion('madrid', 'madrid-1', targetQ.id);
      expect(deleted).toBe(true);

      const reloadedCity = getCityById('madrid');
      expect(reloadedCity!.levels[0].questions.length).toBe(initialCount - 1);
      expect(reloadedCity!.levels[0].questions.find(q => q.id === targetQ.id)).toBeUndefined();
    });

    it('adds a new Level to a City', () => {
      const newLvl: Level = {
        id: 'madrid-lvl-custom-11',
        cityId: 'madrid',
        levelNumber: 11,
        title: 'Nivel Extra 11: Tapeo Madrileño',
        subtitle: 'Costumbres gastronómicas',
        tier: 'medium',
        syllabusTopic: 'Comida y Restaurantes',
        description: 'Práctica avanzada de pedidos de tapas en Madrid.',
        questions: [],
        xpReward: 120,
        coinReward: 50
      };

      const res = saveLevel('madrid', newLvl);
      expect(res.valid).toBe(true);

      const city = getCityById('madrid');
      const added = city?.levels.find(l => l.id === 'madrid-lvl-custom-11');
      expect(added).toBeDefined();
      expect(added?.title).toBe('Nivel Extra 11: Tapeo Madrileño');
    });

    it('deletes a Level from a City', () => {
      const city = getCityById('madrid');
      const initialLevelCount = city!.levels.length;
      const targetLevelId = city!.levels[city!.levels.length - 1].id;

      const deleted = deleteLevel('madrid', targetLevelId);
      expect(deleted).toBe(true);

      const reloadedCity = getCityById('madrid');
      expect(reloadedCity!.levels.length).toBe(initialLevelCount - 1);
    });
  });

  describe('4. 100% REVERSIBILITY GUARANTEE', () => {
    it('restores exact factory default questions and levels upon resetCurriculumToDefault', () => {
      const factoryDefaults = getFactoryDefaultCities();
      const factoryMadridQ1 = factoryDefaults.find(c => c.id === 'madrid')!.levels[0].questions[0];

      // Mutate question in Madrid
      const mutated: Question = {
        ...factoryMadridQ1,
        prompt: 'PREGUNTA COMPLETAMENTE ALTERADA POR PRUEBA'
      };
      saveQuestion('madrid', 'madrid-1', mutated);
      expect(isCustomCurriculumActive()).toBe(true);

      // Verify mutation is active in game
      expect(getCityById('madrid')!.levels[0].questions[0].prompt).toBe(
        'PREGUNTA COMPLETAMENTE ALTERADA POR PRUEBA'
      );

      // EXECUTE REVERSIBILITY: Reset to factory defaults
      resetCurriculumToDefault();
      expect(isCustomCurriculumActive()).toBe(false);

      // Verify factory questions are restored with 100% precision
      const restoredMadrid = getCityById('madrid');
      expect(restoredMadrid!.levels[0].questions[0].prompt).toBe(factoryMadridQ1.prompt);
      expect(restoredMadrid!.levels[0].questions[0].id).toBe(factoryMadridQ1.id);
    });
  });

  describe('5. Curriculum JSON Export & Import', () => {
    it('exports valid JSON and imports it back accurately', () => {
      const exportedJson = exportCurriculumJson();
      expect(typeof exportedJson).toBe('string');

      const parsed = JSON.parse(exportedJson);
      expect(parsed.version).toBe(1);
      expect(Array.isArray(parsed.cities)).toBe(true);
      expect(parsed.cities.length).toBe(15);

      const importRes = importCurriculumJson(exportedJson);
      expect(importRes.success).toBe(true);
    });

    it('rejects malformed or corrupted JSON strings on import', () => {
      const malformed = '{"version": 1, "cities": "not an array"}';
      const res = importCurriculumJson(malformed);
      expect(res.success).toBe(false);
      expect(res.error).toContain('no contiene un catálogo de ciudades válido');
    });
  });
});
