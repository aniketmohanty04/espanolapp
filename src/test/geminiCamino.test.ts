import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  getGeminiApiKey, 
  setGeminiApiKey, 
  getMaskedApiKey, 
  DEFAULT_GEMINI_API_KEY, 
  GEMINI_MODEL,
  askCaminoGemini 
} from '../services/geminiService';
import { resetCaminoKnowledge } from '../services/caminoKnowledgeService';

describe('Gemini Camino AI Service', () => {
  beforeEach(() => {
    resetCaminoKnowledge();
    setGeminiApiKey(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides the default key configuration and correct model identifier', () => {
    expect(typeof DEFAULT_GEMINI_API_KEY).toBe('string');
    expect(['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-3.8-flash']).toContain(GEMINI_MODEL);
  });

  it('masks the API key securely for UI display', () => {
    setGeminiApiKey('dummy-test-key-sample-value-123456');
    const masked = getMaskedApiKey();
    expect(masked).toContain('dummy-t');
    expect(masked).toContain('123456');
    expect(masked).toContain('...');
  });

  it('allows setting and clearing custom API key', () => {
    setGeminiApiKey('custom-test-key-12345');
    expect(getGeminiApiKey()).toBe('custom-test-key-12345');

    // Resetting to null restores default or environment key
    setGeminiApiKey(null);
    const expectedFallback = (import.meta as any).env?.VITE_GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY;
    expect(getGeminiApiKey()).toBe(expectedFallback);
  });

  it('handles successful Gemini API response and returns structured Camino format', async () => {
    setGeminiApiKey('mock-gemini-test-key-for-test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    text: '¡Claro que sí! Ordering coffee in Spain is delightful.',
                    spanishText: 'Un café con leche, por favor.',
                    englishText: 'A coffee with milk, please.'
                  })
                }
              ]
            }
          }
        ]
      })
    }));

    const response = await askCaminoGemini('How do I order coffee in Spanish?', {
      cityName: 'Madrid',
      streak: 5
    });

    expect(response.source).toBe('gemini');
    expect(response.text).toContain('Ordering coffee in Spain is delightful');
    expect(response.spanishText).toBe('Un café con leche, por favor.');
    expect(response.englishText).toBe('A coffee with milk, please.');
  });

  it('falls back gracefully to offline intelligent guide when API call fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('How do I order coffee in Spanish?', {
      cityName: 'Madrid'
    });

    expect(response.source).toBe('fallback');
    expect(response.text).toContain('In Spanish cafés');
    expect(response.spanishText).toBeDefined();
  });

  it('correctly translates summer to pure Spanish (El verano) in fallback mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('howd you say summer in espanol', {
      cityName: 'Madrid'
    });

    expect(response.source).toBe('fallback');
    expect(response.spanishText).toContain('El verano');
    expect(response.pronunciation).toBeDefined();
    expect(response.englishText).toContain('summer');
  });

  it('actively detects grammatical faults like "yo soy calor" and provides corrections', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('yo soy calor', {
      cityName: 'Madrid'
    });

    expect(response.source).toBe('fallback');
    expect(response.correctionNotice).toBeDefined();
    expect(response.correctionNotice).toContain('Tengo calor');
    expect(response.spanishText).toContain('Tengo calor');
  });

  it('intelligently conjugates verbs like "hablar" and "comer" in offline mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('conjugate the verb hablar', {
      cityName: 'Sevilla'
    });

    expect(response.source).toBe('fallback');
    expect(response.spanishText).toContain('hablo');
    expect(response.spanishText).toContain('hablamos');
    expect(response.englishText).toContain('to speak');
  });

  it('translates essential travel phrases like bathroom in offline mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('where is the bathroom', {
      cityName: 'Barcelona'
    });

    expect(response.source).toBe('fallback');
    expect(response.spanishText).toContain('¿Dónde está el baño?');
    expect(response.pronunciation).toBeDefined();
  });

  it('explains that verbs do not have gender and does not falsely match verb "ver"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('give me a list of verbs that donot have gender', {
      cityName: 'Toledo'
    });

    expect(response.source).toBe('fallback');
    expect(response.text.toLowerCase()).toContain('gender');
    expect(response.spanishText).toContain('hablar');
    // Ensure "verbs" did not falsely trigger conjugation of "ver"
    expect(response.text).not.toContain('conjugation of the verb "ver"');
  });

  it('resolves contextual follow-up "give me the list" using chatHistory in offline mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('give me the list', {
      cityName: 'Madrid',
      chatHistory: [
        { role: 'user', text: 'verbs which are neither masculine nor feminine' },
        { role: 'model', text: 'In Spanish grammar, verbs do not have a gender! Would you like to learn how verbs change?' }
      ]
    });

    expect(response.source).toBe('fallback');
    expect(response.text.toLowerCase()).toContain('verb');
    expect(response.spanishText).toContain('hablar');
  });

  it('does not confuse "which" with "hi" and returns adjectives instead of greetings for "give all adjectives which are not gender biased"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('give all adjectives which are not gender biased', {
      cityName: 'Toledo'
    });

    expect(response.source).toBe('fallback');
    // Ensure "which" did NOT trigger greetings:
    expect(response.text).not.toContain('Common greetings you will hear across Spain every day');
    expect(response.spanishText).not.toContain('¡Buenos días!');
    // Verify it answers with gender-neutral adjectives:
    expect(response.text.toLowerCase()).toContain('adjective');
    expect(response.text.toLowerCase()).toContain('inteligente');
    expect(response.spanishText).toContain('inteligente');
  });

  it('handles "all adjectives ending with e:nor feminine nor masculine" and provides invariable adjectives', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const response = await askCaminoGemini('all adjectives ending with e:nor feminine nor masculine', {
      cityName: 'Madrid'
    });

    expect(response.source).toBe('fallback');
    expect(response.text.toLowerCase()).toContain('adjective');
    expect(response.text.toLowerCase()).toContain('inteligente');
    expect(response.spanishText).toContain('inteligente');
  });
});
