import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordCaminoLearnedResponse,
  findTrainedCaminoResponse,
  getCaminoTrainingExemplars,
  enforceProperSpanishPedagogy,
  getSpanishCardHeading,
  resetCaminoKnowledge
} from '../services/caminoKnowledgeService';
import { CaminoResponse } from '../services/geminiService';

describe('Camino Knowledge & Self-Training Service', () => {
  beforeEach(() => {
    resetCaminoKnowledge();
  });

  it('retrieves pre-seeded knowledge for verbs without gender', () => {
    const res = findTrainedCaminoResponse('verbs which are neither masculine nor feminine');
    expect(res).not.toBeNull();
    expect(res?.text).toContain('ALL verbs are gender-neutral');
    expect(res?.spanishText).toContain('no tienen género');
  });

  it('retrieves pre-seeded knowledge for adjectives ending in -e', () => {
    const res = findTrainedCaminoResponse('all adjectives ending with e nor feminine nor masculine');
    expect(res).not.toBeNull();
    expect(res?.text).toContain('adjectives ending in "-e"');
    expect(res?.spanishText).toContain('inteligente');
  });

  it('records and trains Camino with new verified Gemini explanations', () => {
    const customResponse: CaminoResponse = {
      text: 'To order coffee politely in Madrid, say "Un café con leche, por favor".',
      spanishText: 'Un café solo / Un café con leche, por favor.',
      pronunciation: 'oon kah-FEH cohn LEH-cheh',
      englishText: 'A coffee with milk, please.',
      practicePrompt: 'Try asking for coffee with sugar (con azúcar).',
      source: 'gemini'
    };

    recordCaminoLearnedResponse('how to order coffee in madrid', customResponse, 'food');

    const retrieved = findTrainedCaminoResponse('how to order coffee in madrid');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.text).toContain('Un café con leche');
    expect(retrieved?.englishText).toBe('A coffee with milk, please.');
  });

  it('resolves contextual follow-up "give me the list" using conversational history', () => {
    const res = findTrainedCaminoResponse('give me the list', [
      { role: 'user', text: 'verbs which are neither masculine nor feminine' },
      { role: 'model', text: 'In Spanish grammar, verbs do not have a gender!' }
    ]);

    expect(res).not.toBeNull();
    expect(res?.text.toLowerCase()).toContain('verbs are gender-neutral');
  });

  it('enforces Spanish inverted question and exclamation marks in pedagogy', () => {
    const input: CaminoResponse = {
      text: 'Here is how to ask how someone is doing in Spanish:',
      spanishText: 'Cómo estás?',
      englishText: 'How are you?',
      source: 'gemini'
    };

    const enforced = enforceProperSpanishPedagogy(input);
    expect(enforced.spanishText).toBe('¿Cómo estás?');
  });

  it('provides few-shot training exemplars for Gemini prompt injection', () => {
    const exemplars = getCaminoTrainingExemplars('tell me about verbs');
    expect(exemplars).toContain('CAMINO PEDAGOGICAL TRAINING EXEMPLARS');
    expect(exemplars).toContain('"spanishText"');
  });

  it('retrieves pre-seeded knowledge for feeling bad sentence request', () => {
    const res = findTrainedCaminoResponse('write a sentence where you are feeling bad');
    expect(res).not.toBeNull();
    expect(res?.spanishText).toBe('Me siento mal.');
    expect(res?.englishText).toContain('I feel bad');
  });

  it('dynamically assigns Spanish card header titles and icons based on student intent', () => {
    // 1. Sentence generation
    expect(getSpanishCardHeading('write a sentence where you are feeling bad')).toEqual({
      title: 'Tu Frase en Español',
      icon: '✍️'
    });
    expect(getSpanishCardHeading('Can you try writing a sentence in Spanish telling me how you are feeling using muy bien?')).toEqual({
      title: 'Tu Frase en Español',
      icon: '✍️'
    });

    // 2. Translation
    expect(getSpanishCardHeading('how do you say summer in spanish')).toEqual({
      title: 'Traducción en Español',
      icon: '🌐'
    });

    // 3. Grammar
    expect(getSpanishCardHeading('difference between ser and estar')).toEqual({
      title: 'Explicación de Gramática',
      icon: '📚'
    });
    expect(getSpanishCardHeading('how to conjugate hablar')).toEqual({
      title: 'Explicación de Gramática',
      icon: '📚'
    });

    // 4. Vocabulary / lists
    expect(getSpanishCardHeading('all adjectives ending in e nor feminine nor masculine')).toEqual({
      title: 'Vocabulario en Español',
      icon: '📖'
    });

    // 5. Default
    expect(getSpanishCardHeading('hello camino')).toEqual({
      title: 'Respuesta en Español',
      icon: '🇪🇸'
    });
  });
});
