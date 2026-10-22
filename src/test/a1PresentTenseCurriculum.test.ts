import { describe, it, expect } from 'vitest';
import { ALL_CITIES } from '../data/citiesData';
import { FESTIVAL_STALLS, FESTIVAL_CHARACTERS, CUMULATIVE_FINAL_ASSESSMENT } from '../data/festivalData';
import { Question } from '../types';

describe('A1 Present-Tense Syllabus Compliance Suite', () => {
  // Collect all questions across the entire project
  const allQuestions: { source: string; question: Question }[] = [];

  for (const city of ALL_CITIES) {
    for (const level of city.levels) {
      for (const q of level.questions) {
        allQuestions.push({ source: `${city.id} - Level ${level.levelNumber} (${q.id})`, question: q });
      }
    }
    if (city.bossMission) {
      for (const q of city.bossMission.questions) {
        allQuestions.push({ source: `${city.id} - Boss Mission (${q.id})`, question: q });
      }
    }
  }

  for (const stall of FESTIVAL_STALLS) {
    if (stall.miniQuiz) {
      allQuestions.push({ source: `Festival Stall: ${stall.title} (${stall.miniQuiz.id})`, question: stall.miniQuiz });
    }
  }

  for (const char of FESTIVAL_CHARACTERS) {
    if (char.interactiveQuestion) {
      allQuestions.push({
        source: `Festival Character: ${char.name} (${char.id})`,
        question: {
          id: `fest-char-${char.id}`,
          type: 'multiple-choice',
          prompt: char.interactiveQuestion.prompt,
          options: char.interactiveQuestion.options,
          correctAnswer: char.interactiveQuestion.correctAnswer,
          explanation: char.interactiveQuestion.explanation,
          hints: [],
          syllabusRef: 'FESTIVAL-CHAR',
          difficulty: 'medium'
        } as unknown as Question
      });
    }
  }

  for (const q of CUMULATIVE_FINAL_ASSESSMENT) {
    allQuestions.push({ source: `Cumulative Final Assessment (${q.id})`, question: q });
  }

  it('audits and verifies the complete question bank count (332 questions reviewed)', () => {
    // 235 city level questions + 47 boss mission questions + 6 stall quizzes + 14 character questions + 30 final = 332
    expect(allQuestions.length).toBe(332);
  });

  it('guarantees each of the 15 cities has exactly 10 levels and 1 boss mission with progressive difficulty', () => {
    expect(ALL_CITIES.length).toBe(15);
    for (const city of ALL_CITIES) {
      expect(city.levels.length).toBe(10);
      expect(city.bossMission).toBeDefined();
      expect(city.bossMission?.questions.length).toBeGreaterThanOrEqual(3);

      // Verify difficulty curve across the 10 levels
      expect(['easy']).toContain(city.levels[0].tier);
      expect(['easy']).toContain(city.levels[1].tier);
      expect(['medium']).toContain(city.levels[2].tier);
      expect(['medium']).toContain(city.levels[3].tier);
      expect(['tough']).toContain(city.levels[4].tier);
      expect(['tough']).toContain(city.levels[5].tier);
      expect(['hard']).toContain(city.levels[6].tier);
      expect(['hard']).toContain(city.levels[7].tier);
      expect(['hot']).toContain(city.levels[8].tier);
      expect(['hot']).toContain(city.levels[9].tier);
    }
  });

  it('ensures no past-tense irregular verbs appear in question prompts or answers', () => {
    const prohibitedPastVerbs = [
      /\bfui\b/i, /\bfuiste\b/i, /\bfue\b/i, /\bfuimos\b/i, /\bfuisteis\b/i, /\bfueron\b/i,
      /\bestuve\b/i, /\bestuviste\b/i, /\bestuvo\b/i, /\bestuvimos\b/i, /\bestuvisteis\b/i, /\bestuvieron\b/i,
      /\btuve\b/i, /\btuviste\b/i, /\btuvo\b/i, /\btuvimos\b/i, /\btuvisteis\b/i, /\btuvieron\b/i,
      /\bhice\b/i, /\bhiciste\b/i, /\bhizo\b/i, /\bhicimos\b/i, /\bhicisteis\b/i, /\bhicieron\b/i,
      /\bdije\b/i, /\bdijiste\b/i, /\bdijo\b/i, /\bdijimos\b/i, /\bdijisteis\b/i, /\bdijeron\b/i,
      /\bpuse\b/i, /\bpusiste\b/i, /\bpuso\b/i, /\bpusimos\b/i, /\bpusisteis\b/i, /\bpusieron\b/i,
      /\bpude\b/i, /\bpudiste\b/i, /\bpudo\b/i, /\bpudimos\b/i, /\bpudisteis\b/i, /\bpudieron\b/i,
      /\bquise\b/i, /\bquisiste\b/i, /\bquiso\b/i, /\bquisimos\b/i, /\bquisisteis\b/i, /\bquisieron\b/i,
      /\bsupe\b/i, /\bsupiste\b/i, /\bsupo\b/i, /\bsupimos\b/i, /\bsupisteis\b/i, /\bsupieron\b/i,
      /\bnaci\u00f3\b/i, /\bfund\u00f3\b/i, /\bproclam\u00f3\b/i, /\bredact\u00f3\b/i,
      /\berais\b/i, /\bescribieron\b/i,
      /\bha salido\b/i, /\bha estado\b/i, /\bhas recorrido\b/i, /\bte has ganado\b/i, /\bhe recorrido\b/i, /\bhe aprendido\b/i
    ];

    for (const { source, question } of allQuestions) {
      const textsToTest = [
        question.prompt,
        Array.isArray(question.correctAnswer) ? question.correctAnswer.join(' ') : (question.correctAnswer || ''),
        question.audioText || '',
        ...(question.options || []),
        ...(question.dialogue?.choices.map(c => c.text) || []),
        question.dialogue?.prompt || ''
      ];

      for (const text of textsToTest) {
        for (const pattern of prohibitedPastVerbs) {
          expect(
            pattern.test(text),
            `Found prohibited past-tense form ${pattern} in ${source}: "${text}"`
          ).toBe(false);
        }
      }
    }
  });

  it('ensures questions rewritten to A1 present tense maintain pedagogical purpose and proper grammar', () => {
    // Madrid airport greeting is present tense
    const m1q3 = allQuestions.find(q => q.question.id === 'm1-q3')?.question;
    expect(m1q3?.audioText).toContain('¿Cómo estás hoy?');
    expect(m1q3?.correctAnswer).toContain('Estoy muy contento de estar aquí');

    // Madrid nationality question uses present tense
    const m1q14 = allQuestions.find(q => q.question.id === 'm1-q14')?.question;
    expect(m1q14?.prompt).toContain('Si Ana es de España');

    // Salamanca university foundation uses present tense
    const m1sal1 = allQuestions.find(q => q.question.id === 'm1-sal-1')?.question;
    expect(m1sal1?.prompt).toContain('es del año 1218');

    // Salamanca SER distractor uses present tense
    const m1sal10 = allQuestions.find(q => q.question.id === 'm1-sal-10')?.question;
    expect(m1sal10?.options).toContain('estáis');
    expect(m1sal10?.options).not.toContain('erais');

    // Segovia SER/ESTAR distractor has no reference to "pasado"
    const m2seg9 = allQuestions.find(q => q.question.id === 'm2-seg-9')?.question;
    expect(m2seg9?.options?.some(o => o.includes('pasado'))).toBe(false);

    // Sevilla verb endings question uses present tense distractors
    const m2sev7 = allQuestions.find(q => q.question.id === 'm2-sev-7')?.question;
    expect(m2sev7?.options?.some(o => o.includes('-iste'))).toBe(false);

    // Granada boss mission writing verb uses present tense distractor
    const bgra2 = allQuestions.find(q => q.question.id === 'b-gra-2')?.question;
    expect(bgra2?.options).toContain('escribís');
    expect(bgra2?.options).not.toContain('escribieron');

    // Córdoba boss mission uses present tense
    const bcor2 = allQuestions.find(q => q.question.id === 'b-cor-2')?.question;
    expect(bcor2?.prompt).toContain('La gran fiesta histórica de Córdoba es el dieciséis');

    // Bilbao food dialogue uses present tense
    const m5bil13 = allQuestions.find(q => q.question.id === 'm5-bil-13')?.question;
    expect(m5bil13?.dialogue?.prompt).toContain('está insuperable');
    expect(m5bil13?.dialogue?.choices.some(c => c.text.includes('Ayer'))).toBe(false);

    // San Sebastián chef dialogue uses present tense
    const m5ss14 = allQuestions.find(q => q.question.id === 'm5-ss-14')?.question;
    expect(m5ss14?.dialogue?.prompt).toContain('¿Qué tal está el txangurro');
    expect(m5ss14?.correctAnswer).toContain('Todo está absolutamente delicioso');

    // Santiago pilgrim dialogue uses present tense
    const m5san12 = allQuestions.find(q => q.question.id === 'm5-san-12')?.question;
    expect(m5san12?.dialogue?.prompt).toContain('Conoces quince ciudades');

    // Festival final ceremony culmination uses present tense
    const final30 = allQuestions.find(q => q.question.id === 'final-30')?.question;
    expect(final30?.prompt).toContain('Recorro España, aprendo su lengua');
    expect(final30?.correctAnswer).toBe('Recorro España, aprendo su lengua y ahora puedo comunicarme con el mundo');
  });

  it('verifies festival NPC dialogues are free of past tense forms', () => {
    for (const char of FESTIVAL_CHARACTERS) {
      expect(char.dialogue).not.toContain('Has templado');
      expect(char.dialogue).not.toContain('Has aprendido');
      expect(char.dialogue).not.toContain('Construiste');
      expect(char.dialogue).not.toContain('Retrataste');
      expect(char.dialogue).not.toContain('Te has ganado');
      expect(char.dialogue).not.toContain('ha terminado');
      expect(char.dialogue).not.toContain('ha comenzado');
    }
  });
});
