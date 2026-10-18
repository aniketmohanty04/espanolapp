import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  getGeminiApiKey, 
  setGeminiApiKey, 
  getMaskedApiKey, 
  DEFAULT_GEMINI_API_KEY, 
  GEMINI_MODEL,
  askCaminoGemini 
} from '../services/geminiService';

describe('Gemini Camino AI Service', () => {
  beforeEach(() => {
    setGeminiApiKey(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides the default empty key configuration and correct model identifier', () => {
    expect(DEFAULT_GEMINI_API_KEY).toBe('');
    expect(GEMINI_MODEL).toBe('gemini-3.8-flash');
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
});
