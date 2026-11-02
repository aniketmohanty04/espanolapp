import { describe, it, expect } from 'vitest';
import { getEnglishGrammarExplanation } from '../utils/grammarExplanationService';
import { Question } from '../types';

describe('grammarExplanationService', () => {
  it('returns explicit englishExplanation when present', () => {
    const q: Partial<Question> = {
      id: 'custom-q',
      explanation: 'Explicación en español',
      englishExplanation: 'Specific English rule explained thoroughly'
    };
    expect(getEnglishGrammarExplanation(q)).toBe('Specific English rule explained thoroughly');
  });

  it('provides accurate English grammar rule for m1-tol-5 (María es profesora)', () => {
    const q: Partial<Question> = {
      id: 'm1-tol-5',
      prompt: 'Si Marcos es profesor, ¿cómo decimos la profesión de María?',
      explanation: 'Las profesiones masculinas terminadas en consonante forman el femenino añadiendo -a'
    };
    const rule = getEnglishGrammarExplanation(q);
    expect(rule).toContain('Grammar Rule');
    expect(rule).toContain('profesora');
    expect(rule).toContain('SER');
  });

  it('provides accurate English grammar rule for m1-tol-6 (Él es arquitecto / profession without un)', () => {
    const q: Partial<Question> = {
      id: 'm1-tol-6',
      prompt: '¿Cómo se dice "He is an architect" en español sin usar artículo indefinido innecesario?',
      explanation: 'En español, al expresar la profesión con el verbo SER normalmente no se utiliza artículo indefinido'
    };
    const rule = getEnglishGrammarExplanation(q);
    expect(rule).toContain('Grammar Rule');
    expect(rule).toContain('indefinite articles');
    expect(rule).toContain('arquitecto');
  });

  it('provides syllabus rule based on M1-PROF when question has no custom explanation', () => {
    const q: Partial<Question> = {
      id: 'some-prof-question',
      syllabusRef: 'M1-PROF'
    };
    const rule = getEnglishGrammarExplanation(q);
    expect(rule).toContain('Grammar Rule');
    expect(rule).toContain('professions');
    expect(rule).toContain('SER');
  });

  it('provides syllabus rule based on M1-ART for articles', () => {
    const q: Partial<Question> = {
      id: 'some-art-question',
      syllabusRef: 'M1-ART'
    };
    const rule = getEnglishGrammarExplanation(q);
    expect(rule.toLowerCase()).toContain('indefinite articles');
    expect(rule).toContain('gender');
  });

  it('handles null or empty question safely', () => {
    expect(getEnglishGrammarExplanation(null)).toContain('Grammar Rule');
    expect(getEnglishGrammarExplanation({})).toContain('Grammar Rule');
  });
});
