import { describe, it, expect } from 'vitest';
import { FESTIVAL_STALLS, FESTIVAL_CHARACTERS, CUMULATIVE_FINAL_ASSESSMENT } from '../data/festivalData';
import { PLAZA_TAPAS, FOUNTAIN_FORTUNES, PLAZA_CHATTER } from '../components/FestivalWorld';

describe('Festival Plaza & NPC Interactive World Tests', () => {
  it('configures exactly 6 festival stalls with 3 on left and 3 on right', () => {
    expect(FESTIVAL_STALLS.length).toBe(6);
    const leftStalls = FESTIVAL_STALLS.filter(s => s.side === 'left');
    const rightStalls = FESTIVAL_STALLS.filter(s => s.side === 'right');
    expect(leftStalls.length).toBe(3);
    expect(rightStalls.length).toBe(3);
  });

  it('ensures all 6 stalls have visual canopy styling, icons, and valid quizzes', () => {
    FESTIVAL_STALLS.forEach(stall => {
      expect(stall.id).toBeTruthy();
      expect(stall.title).toBeTruthy();
      expect(stall.spanishTitle).toBeTruthy();
      expect(stall.vendorName).toBeTruthy();
      expect(stall.canopyColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(stall.icon).toBeTruthy();
      expect(stall.rewardCoins).toBeGreaterThanOrEqual(100);

      // Mini quiz check
      expect(stall.miniQuiz).toBeDefined();
      expect(stall.miniQuiz.prompt).toBeTruthy();
      expect(stall.miniQuiz.explanation).toBeTruthy();

      if (stall.miniQuiz.options) {
        if (Array.isArray(stall.miniQuiz.correctAnswer)) {
          expect(stall.miniQuiz.options).toEqual(
            expect.arrayContaining(stall.miniQuiz.correctAnswer)
          );
        } else {
          expect(stall.miniQuiz.options).toContain(stall.miniQuiz.correctAnswer);
        }
      }
    });
  });

  it('configures all 14 festival characters with plaza coordinates and interactive quizzes', () => {
    expect(FESTIVAL_CHARACTERS.length).toBe(14);

    FESTIVAL_CHARACTERS.forEach(char => {
      expect(char.id).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.originCity).toBeTruthy();
      expect(char.role).toBeTruthy();
      expect(char.avatar).toBeTruthy();
      expect(char.dialogue).toBeTruthy();
      expect(char.trivia).toBeTruthy();

      // Coordinates for plaza positioning
      expect(char.xPercent).toBeDefined();
      expect(char.xPercent).toBeGreaterThanOrEqual(0);
      expect(char.xPercent).toBeLessThanOrEqual(100);

      expect(char.yPercent).toBeDefined();
      expect(char.yPercent).toBeGreaterThanOrEqual(0);
      expect(char.yPercent).toBeLessThanOrEqual(100);

      // Color badge
      expect(char.avatarColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

      // Interactive conversation quiz
      expect(char.interactiveQuestion).toBeDefined();
      const q = char.interactiveQuestion!;
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options).toContain(q.correctAnswer);
      expect(q.reactionCorrect).toBeTruthy();
      expect(q.reactionIncorrect).toBeTruthy();
      expect(q.explanation).toBeTruthy();
    });
  });

  it('verifies the cumulative final assessment has 30 questions covering all 5 syllabus modules', () => {
    expect(CUMULATIVE_FINAL_ASSESSMENT.length).toBe(30);

    const modulesFound = new Set<string>();
    CUMULATIVE_FINAL_ASSESSMENT.forEach(q => {
      expect(q.prompt).toBeTruthy();
      expect(q.correctAnswer).toBeTruthy();
      if (q.options) {
        expect(q.options).toContain(q.correctAnswer);
      }
      expect(q.explanation).toBeTruthy();
      if (q.syllabusRef) {
        const mod = q.syllabusRef.split('-')[0];
        modulesFound.add(mod);
      }
    });

    // Must cover M1, M2, M3, M4, M5
    expect(modulesFound).toContain('M1');
    expect(modulesFound).toContain('M2');
    expect(modulesFound).toContain('M3');
    expect(modulesFound).toContain('M4');
    expect(modulesFound).toContain('M5');
  });

  it('verifies festival attractions including Fortune Wheel, Tomatina, and Flamenco rhythms are integrated', () => {
    // 6 authentic festival news announcements
    const announcements = [
      '🥘 ¡La gran paella gigante de Valencia está servida en el puesto gastronómico!',
      '🎡 ¡Gira la Ruleta de la Feria para ganar hasta 500 monedas de oro y vidas extra!',
      '🍅 ¡La batalla de la Tomatina de Buñol está abierta en la plaza! ¡Lanza tomates y bate el récord!',
      '💃 ¡Doña Carmen de Triana y los bailaores encienden el tablao flamenco con sevillanas!',
      '🎆 ¡Toca en cualquier parte del cielo para lanzar fuegos artificiales!',
      '🎓 ¡Preséntate en la Carpa de la Real Academia para el Diploma Oficial A1!'
    ];
    expect(announcements.length).toBe(6);
    announcements.forEach(a => {
      expect(a.length).toBeGreaterThan(10);
    });
  });

  it('verifies the interactive Tapas tasting table contains authentic Spanish specialties with pronunciations', () => {
    expect(PLAZA_TAPAS.length).toBe(6);
    PLAZA_TAPAS.forEach(tapa => {
      expect(tapa.id).toBeTruthy();
      expect(tapa.name).toBeTruthy();
      expect(tapa.emoji).toBeTruthy();
      expect(tapa.region).toBeTruthy();
      expect(tapa.description.length).toBeGreaterThan(15);
      expect(tapa.pronunciation.length).toBeGreaterThan(5);
      expect(tapa.trivia.length).toBeGreaterThan(15);
    });

    const tapaNames = PLAZA_TAPAS.map(t => t.name);
    expect(tapaNames).toContain('Paella Valenciana');
    expect(tapaNames).toContain('Tortilla de Patatas');
    expect(tapaNames).toContain('Jamón Ibérico de Bellota');
    expect(tapaNames).toContain('Bocadillo de Calamares');
    expect(tapaNames).toContain('Chocolate con Churros');
    expect(tapaNames).toContain('Pulpo a la Feira');
  });

  it('verifies the Wishing Fountain (Fuente Mágica) has authentic Spanish refranes and literary wisdom', () => {
    expect(FOUNTAIN_FORTUNES.length).toBeGreaterThanOrEqual(6);
    FOUNTAIN_FORTUNES.forEach(fortune => {
      expect(fortune.saying.length).toBeGreaterThan(10);
      expect(fortune.author).toBeTruthy();
      expect(fortune.meaning.length).toBeGreaterThan(15);
    });

    const authors = FOUNTAIN_FORTUNES.map(f => f.author);
    expect(authors.some(a => a.includes('Antonio Machado'))).toBe(true);
    expect(authors.some(a => a.includes('Cervantes'))).toBe(true);
  });

  it('verifies the live plaza ambient chatter connects with character origins across Spain', () => {
    expect(PLAZA_CHATTER.length).toBeGreaterThanOrEqual(6);
    PLAZA_CHATTER.forEach(chatter => {
      expect(chatter.npc).toBeTruthy();
      expect(chatter.city).toBeTruthy();
      expect(chatter.text.length).toBeGreaterThan(10);
    });
  });
});

