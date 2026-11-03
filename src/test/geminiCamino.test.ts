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

describe('Gemini Camino AI Service — Dynamic AI (No Pre-Set Answers)', () => {
  beforeEach(() => {
    resetCaminoKnowledge();
    setGeminiApiKey(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides the default key configuration and correct model identifier', () => {
    expect(typeof DEFAULT_GEMINI_API_KEY).toBe('string');
    expect(['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest']).toContain(GEMINI_MODEL);
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

  it('queries Gemini dynamically and returns AI-generated response without pre-set answers', async () => {
    const mockGeminiAnswer = {
      text: 'To order coffee like a local in Spain, use this friendly phrase:',
      spanishText: 'Un café con leche, por favor.',
      pronunciation: 'oon kah-FEH kohn LEH-cheh, pohr fah-BOHR',
      englishText: 'A coffee with milk, please.',
      practicePrompt: 'Would you like to order coffee or tea?'
    };

    let capturedUrl = '';
    let capturedBody: any = null;

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url, init) => {
      capturedUrl = String(url);
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          text: mockGeminiAnswer.text,
          spanishText: mockGeminiAnswer.spanishText,
          pronunciation: mockGeminiAnswer.pronunciation,
          englishText: mockGeminiAnswer.englishText,
          practicePrompt: mockGeminiAnswer.practicePrompt,
          source: 'gemini'
        })
      };
    }));

    const response = await askCaminoGemini('How do I order coffee in Spanish?', {
      cityName: 'Madrid',
      streak: 3
    });

    // Ensure it queried the AI endpoint with the student prompt
    expect(capturedUrl).toContain('/api/camino-chat');
    expect(capturedBody.prompt).toBe('How do I order coffee in Spanish?');
    expect(capturedBody.systemInstruction).toContain('Camino');
    expect(capturedBody.systemInstruction).toContain('Madrid');

    // Ensure it directly returned Gemini AI response (no pre-set answers)
    expect(response.source).toBe('gemini');
    expect(response.text).toBe(mockGeminiAnswer.text);
    expect(response.spanishText).toBe(mockGeminiAnswer.spanishText);
    expect(response.englishText).toBe(mockGeminiAnswer.englishText);
    expect(response.practicePrompt).toBe(mockGeminiAnswer.practicePrompt);
  });

  it('gets nationality and origin dynamically from Gemini for "yo soy india" with AI pedagogical feedback', async () => {
    const mockNationalityAiResponse = {
      text: "¡Excelente! You correctly used 'ser' to describe your nationality. In Spanish, nationalities are adjectives that match gender (india for female, indio for male) and are not capitalized.",
      spanishText: '• Yo soy india (femenino)\n• Yo soy indio (masculino)\n• Soy de la India (país de origen)',
      pronunciation: 'yoh soy EEN-dyah',
      englishText: '• I am Indian (female)\n• I am Indian (male)\n• I am from India',
      correctionNotice: "Your sentence is grammatically correct! Note that 'india' is written in lowercase in Spanish.",
      practicePrompt: 'Try telling me where your friend is from using: Mi amigo es de...'
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockNationalityAiResponse,
        source: 'gemini'
      })
    }));

    const response = await askCaminoGemini('yo soy india', {
      cityName: 'Toledo'
    });

    expect(response.source).toBe('gemini');
    expect(response.text).toContain('nationality');
    expect(response.spanishText).toContain('Yo soy india');
    expect(response.correctionNotice).toContain('lowercase');
    expect(response.practicePrompt).toBeDefined();
  });

  it('gets gender-neutral adjectives list dynamically from Gemini without canned pre-set answers', async () => {
    const mockAdjectivesAiResponse = {
      text: "In Spanish, adjectives ending in '-e' or consonants do not change between masculine and feminine nouns. Here is a helpful list:",
      spanishText: '• Inteligente (Smart)\n• Grande (Big)\n• Amable (Kind)\n• Interesante (Interesting)\n• Fuerte (Strong)',
      pronunciation: 'een-teh-lee-HEN-teh, GRAHN-deh, ah-MAH-bleh',
      englishText: 'These adjectives stay the same for both masculine and feminine nouns (e.g. un chico inteligente, una chica inteligente).',
      practicePrompt: 'Choose one of these adjectives and make a simple sentence.'
    };

    let requestedPrompt = '';
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_, init) => {
      requestedPrompt = JSON.parse(init.body).prompt;
      return {
        ok: true,
        json: async () => ({
          ...mockAdjectivesAiResponse,
          source: 'gemini'
        })
      };
    }));

    const response = await askCaminoGemini('give all adjectives which are not gender biased', {
      cityName: 'Toledo'
    });

    expect(requestedPrompt).toBe('give all adjectives which are not gender biased');
    expect(response.source).toBe('gemini');
    expect(response.text).toContain('adjectives');
    expect(response.spanishText).toContain('Inteligente');
    expect(response.spanishText).toContain('Grande');
  });

  it('gets gender-neutral verb explanations dynamically from Gemini', async () => {
    const mockVerbAiResponse = {
      text: 'In Spanish grammar, verbs never have gender! They do not change whether a man or a woman is speaking or acting. Instead, verbs only change for person and tense.',
      spanishText: '• Yo hablo (I speak)\n• Él habla (He speaks)\n• Ella habla (She speaks)\n• Nosotros hablamos (We speak)',
      pronunciation: 'yoh AH-bloh, ehl AH-blah, eh-yah AH-blah',
      englishText: 'Notice that "hablo" is identical whether the speaker is male or female.',
      practicePrompt: 'Try using the verb "comer" (to eat) for "yo": Yo como...'
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockVerbAiResponse,
        source: 'gemini'
      })
    }));

    const response = await askCaminoGemini('verbs which are neither masculine nor feminine', {
      cityName: 'Toledo'
    });

    expect(response.source).toBe('gemini');
    expect(response.text).toContain('verbs never have gender');
    expect(response.spanishText).toContain('Yo hablo');
    expect(response.englishText).toContain('identical');
  });

  it('dynamically explains ser vs estar using Gemini with clear bilingual examples', async () => {
    const mockSerEstarResponse = {
      text: 'Both "ser" and "estar" translate to "to be", but "ser" is for permanent identity or origin, while "estar" is for locations and temporary conditions.',
      spanishText: '• Ser: Yo soy de Madrid. (Origin)\n• Estar: Estoy cansado. (Temporary condition)',
      pronunciation: 'SEHR vs ehs-TAHR',
      englishText: 'Use SER for DOCTOR (Description, Occupation, Characteristic, Time, Origin, Relationship). Use ESTAR for PLACE (Position, Location, Action, Condition, Emotion).',
      practicePrompt: 'Would you say "El café es caliente" or "El café está caliente"?'
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockSerEstarResponse,
        source: 'gemini'
      })
    }));

    const response = await askCaminoGemini('What is the difference between ser and estar?', {
      cityName: 'Madrid'
    });

    expect(response.source).toBe('gemini');
    expect(response.text).toContain('ser');
    expect(response.text).toContain('estar');
    expect(response.spanishText).toContain('Yo soy de Madrid');
    expect(response.englishText).toContain('DOCTOR');
  });

  it('detects grammar errors and returns Gemini dynamic correction notices', async () => {
    const mockErrorCorrectionResponse = {
      text: "¡Cuidado! In Spanish, physical sensations like heat or cold use the verb 'tener' (to have), never 'ser' or 'estar'.",
      spanishText: 'Tengo calor. / Tengo frío.',
      pronunciation: 'TEHN-goh kah-LOHR',
      englishText: 'I am hot (literally: I have heat). Saying "yo soy calor" means "I am heat itself"!',
      correctionNotice: "Changed 'yo soy calor' to 'Tengo calor'. Physical sensations always use 'tener'.",
      practicePrompt: 'Can you say "I am cold" using the verb tener (frío)?'
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockErrorCorrectionResponse,
        source: 'gemini'
      })
    }));

    const response = await askCaminoGemini('yo soy calor', {
      cityName: 'Madrid'
    });

    expect(response.source).toBe('gemini');
    expect(response.correctionNotice).toContain('Tengo calor');
    expect(response.spanishText).toContain('Tengo calor');
  });

  it('passes chatHistory dynamically to Gemini so it resolves multi-turn conversational follow-ups', async () => {
    let capturedHistory: any = null;

    const mockFollowUpResponse = {
      text: 'Here is the comprehensive list of subject pronouns in Spanish:',
      spanishText: '• Yo (I)\n• Tú (You)\n• Él (He)\n• Ella (She)\n• Nosotros (We)\n• Ellos (They)',
      pronunciation: 'yoh, too, ehl, eh-yah, noh-SOH-trohs, EH-yohs',
      englishText: 'Subject pronouns in Spanish indicate who is performing the action.'
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_, init) => {
      capturedHistory = JSON.parse(init.body).chatHistory;
      return {
        ok: true,
        json: async () => ({
          ...mockFollowUpResponse,
          source: 'gemini'
        })
      };
    }));

    const response = await askCaminoGemini('give me the list', {
      cityName: 'Madrid',
      chatHistory: [
        { role: 'user', text: 'what are subject pronouns in Spanish?' },
        { role: 'model', text: 'Subject pronouns replace nouns as the subject of the sentence.' }
      ]
    });

    expect(capturedHistory).toBeDefined();
    expect(capturedHistory.length).toBe(2);
    expect(capturedHistory[0].text).toContain('subject pronouns');
    expect(response.source).toBe('gemini');
    expect(response.spanishText).toContain('Yo (I)');
  });

  it('falls back gracefully to offline guide only when the network/API is completely unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unreachable')));

    const response = await askCaminoGemini('how do I order coffee?', {
      cityName: 'Madrid'
    });

    // Only in complete failure does it fall back
    expect(response.source).toBe('fallback');
    expect(response.text).toBeDefined();
    expect(response.spanishText).toBeDefined();
  });
});
