/**
 * Gemini AI Service for Camino — The Spanish Guide in ¡Aventura Española!
 * Integrated with Google Gemini 3.8 Flash API.
 */

export const DEFAULT_GEMINI_API_KEY = '';
export const GEMINI_MODEL = 'gemini-3.8-flash';

export interface CaminoResponse {
  text: string;
  spanishText?: string;
  pronunciation?: string;
  englishText?: string;
  correctionNotice?: string;
  practicePrompt?: string;
  source: 'gemini' | 'fallback';
}

export interface CaminoContext {
  cityName?: string;
  cityId?: string;
  levelNumber?: number;
  streak?: number;
  playerName?: string;
}

// In-memory fallback for test and non-browser environments
const inMemoryStore: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return inMemoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
  inMemoryStore[key] = value;
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // fallback
  }
  delete inMemoryStore[key];
}

/**
 * Retrieves the currently active Gemini API key.
 * Checks storage first (if the player customized it in Settings),
 * then Vite environment variables, then the default key.
 */
export function getGeminiApiKey(): string {
  const local = getStorageItem('gemini_api_key');
  if (local && local.trim().length > 0) return local.trim();

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }

  return DEFAULT_GEMINI_API_KEY;
}

/**
 * Updates or resets the custom Gemini API key.
 */
export function setGeminiApiKey(key: string | null): void {
  if (!key || key.trim() === '' || key === DEFAULT_GEMINI_API_KEY) {
    removeStorageItem('gemini_api_key');
  } else {
    setStorageItem('gemini_api_key', key.trim());
  }
}

/**
 * Masked key for UI display in Settings
 */
export function getMaskedApiKey(): string {
  const key = getGeminiApiKey();
  if (key.length <= 10) return '••••••••';
  return `${key.substring(0, 7)}...${key.substring(key.length - 6)}`;
}

/**
 * Calls Gemini 3.8 Flash to generate an intelligent, culturally authentic Spanish guide response.
 * Specializes in Spanish fluency, direct translations, fault-finding in user Spanish, and encouragement.
 */
export async function askCaminoGemini(
  userQuery: string,
  context?: CaminoContext
): Promise<CaminoResponse> {
  const apiKey = getGeminiApiKey();

  const currentCity = context?.cityName || 'Madrid';
  const streak = context?.streak || 1;
  const playerName = context?.playerName || 'Viajero';

  const systemInstruction = `You are Camino (🤖), the witty, warm, and encouraging AI Spanish learning companion and travel guide in the adventure game "¡Aventura Española!".
The player (${playerName}) is currently in ${currentCity} (Day ${streak} streak).
Your primary role and mission:
1. SPANISH TRANSLATIONS & VOCABULARY: Always provide the accurate, authentic Spanish words with correct gender (el/la) and examples in Spanish.
2. FAULT FINDING & CORRECTION: When the user writes or attempts Spanish, actively inspect their grammar, spelling, gender agreement, verb conjugation, and phrasing. If there is any fault, point it out gently, provide the corrected Spanish, and explain the rule. If correct, praise their fluency!
3. FLUENCY & ENCOURAGEMENT: Always encourage learning Spanish fluently and invite the user to practice with a follow-up prompt.

CRITICAL RULES FOR JSON OUTPUT:
- "text": Warm, conversational response in English with Spanish flair (1-2 sentences).
- "spanishText": MUST BE PURE SPANISH ONLY! The Spanish translation, vocabulary, or corrected Spanish sentence with proper accents (¡ !, ¿ ?, á, é, í, ó, ú, ñ). NEVER put English words here.
- "pronunciation": Phonetic pronunciation guide (e.g., "ehl beh-RAH-noh").
- "englishText": English translation and clear grammar rule/tip.
- "correctionNotice": If the user wrote Spanish with mistakes, clearly explain what was corrected (or null if no mistakes).
- "practicePrompt": A fun, engaging practice challenge in Spanish for the user to try next.

Respond ONLY with valid JSON matching this schema:
{
  "text": "string",
  "spanishText": "string",
  "pronunciation": "string",
  "englishText": "string",
  "correctionNotice": "string or null",
  "practicePrompt": "string"
}`;

  if (!apiKey || apiKey.trim() === '') {
    return getFallbackCaminoResponse(userQuery, context);
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: userQuery }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 1200
        }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API error status ${response.status}:`, await response.text().catch(() => ''));
      return getFallbackCaminoResponse(userQuery, context);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return getFallbackCaminoResponse(userQuery, context);
    }

    // Clean and parse JSON response
    try {
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        text: parsed.text || '¡Aquí tienes lo que necesitas para tu aventura en español!',
        spanishText: parsed.spanishText || undefined,
        pronunciation: parsed.pronunciation || undefined,
        englishText: parsed.englishText || undefined,
        correctionNotice: parsed.correctionNotice && parsed.correctionNotice !== 'null' ? parsed.correctionNotice : undefined,
        practicePrompt: parsed.practicePrompt || undefined,
        source: 'gemini'
      };
    } catch {
      // If output wasn't strictly JSON, return text directly
      return {
        text: rawText,
        source: 'gemini'
      };
    }
  } catch (err) {
    console.warn('Gemini request failed, using intelligent offline fallback:', err);
    return getFallbackCaminoResponse(userQuery, context);
  }
}

/**
 * Offline intelligent fallback when offline or without internet
 */
function getFallbackCaminoResponse(
  userQuery: string,
  context?: CaminoContext
): CaminoResponse {
  const lower = userQuery.toLowerCase();
  const cityName = context?.cityName || 'España';

  // Fault Finding: "yo soy calor"
  if (lower.includes('soy calor') || lower.includes('soy caliente')) {
    return {
      text: "¡Cuidado! In Spanish, physical sensations like heat or cold use 'tener' (to have), not 'ser' (to be)!",
      spanishText: 'Tengo calor.',
      pronunciation: 'TEHN-goh kah-LOHR',
      englishText: "I am hot (literally: 'I have heat'). Saying 'soy calor' means 'I am heat itself'!",
      correctionNotice: "Changed 'yo soy calor' to 'Tengo calor'. Physical sensations always use 'tener'.",
      practicePrompt: "¿Puedes decir 'I am cold' usando el verbo 'tener' (frío)?",
      source: 'fallback'
    };
  }

  // Fault Finding: "yo querer" / "a el playa"
  if (lower.includes('yo querer') || lower.includes('a el playa') || lower.includes('el playa')) {
    return {
      text: "¡Buen intento! Two quick adjustments to speak like a native Spaniard:",
      spanishText: 'Quiero ir a la playa.',
      pronunciation: 'KYEH-roh eer ah lah PLAH-yah',
      englishText: "I want to go to the beach. ('Querer' conjugates to 'quiero' for 'yo', and 'playa' is feminine, taking 'la').",
      correctionNotice: "Conjugate 'querer' -> 'quiero', and 'playa' takes feminine article 'la' ('a la playa').",
      practicePrompt: "¿Qué quieres hacer cuando llegues a la playa?",
      source: 'fallback'
    };
  }

  // Summer / Verano
  if (lower.includes('summer') || lower.includes('verano')) {
    return {
      text: `¡Madrid gets wonderfully warm and lively during this sunny season! Here is how you say 'summer' in Spanish:`,
      spanishText: 'El verano\nEjemplo: En el verano hace mucho calor en Madrid.',
      pronunciation: 'ehl beh-RAH-noh',
      englishText: "The summer (masculine noun: 'el verano', plural: 'los veranos').",
      practicePrompt: "¿Te gusta más el verano o el invierno en España?",
      source: 'fallback'
    };
  }

  // Coffee in café
  if (lower.includes('coffee') || lower.includes('café') || lower.includes('order')) {
    return {
      text: 'In Spanish cafés, ordering is friendly, polite and natural:',
      spanishText: 'Un café con leche, por favor.',
      pronunciation: 'oon kah-FEH kohn LEH-cheh, pohr fah-BOHR',
      englishText: 'A coffee with milk, please. (Add "para tomar aquí" for here, or "para llevar" to go!)',
      practicePrompt: "¿Prefieres café con leche o un café solo?",
      source: 'fallback'
    };
  }

  // SER vs ESTAR
  if (lower.includes('ser') || lower.includes('estar')) {
    return {
      text: 'Here is the golden rule for SER vs. ESTAR in Spain:',
      spanishText: 'SER = Identity, essential traits, origin ("Soy de Madrid").\nESTAR = Location & temporary conditions ("El tren está en la estación").',
      pronunciation: 'sehr / ehs-TAHR',
      englishText: 'Remember the rhyme: "For how you feel and where you are, always use the verb ESTAR!"',
      practicePrompt: "¿Completas la frase? 'Madrid _____ la capital de España' (¿es o está?)",
      source: 'fallback'
    };
  }

  // Train / Station
  if (lower.includes('train') || lower.includes('ticket') || lower.includes('billete') || lower.includes('station')) {
    return {
      text: 'Essential Spanish phrases for the train station (Renfe):',
      spanishText: '¿Dónde está la estación de tren? / ¿Cuánto cuesta un billete a Barcelona?',
      pronunciation: 'DOHN-deh ehs-TAH lah ehs-tah-SYOHN deh trehn',
      englishText: 'Where is the train station? / How much is a ticket to Barcelona? Look for "Vías" (Platforms) and "Salidas" (Departures)!',
      practicePrompt: "¿Adónde quieres viajar en tren después de Madrid?",
      source: 'fallback'
    };
  }

  // Greetings
  if (lower.includes('hello') || lower.includes('greetings') || lower.includes('hi') || lower.includes('saludos')) {
    return {
      text: 'Common greetings you will hear across Spain every day:',
      spanishText: '¡Buenos días! (Morning) • ¡Buenas tardes! (Afternoon) • ¡Hola, buenas! (Casual greeting)',
      pronunciation: 'BWEH-nohs DEE-ahs • BWEH-nahs TAHR-dehs',
      englishText: 'In shops and plazas, locals warmly say "¡Buenas!" when entering.',
      practicePrompt: "¿Cómo saluda una persona por la noche en España?",
      source: 'fallback'
    };
  }

  // Tapas & Food
  if (lower.includes('tapas') || lower.includes('food') || lower.includes('comida')) {
    return {
      text: `In ${cityName}, tapas are a vibrant social ritual!`,
      spanishText: '¿Qué tapa me recomienda? / Una ración de tortilla de patatas, por favor.',
      pronunciation: 'keh TAH-pah meh reh-koh-MYEHN-dah',
      englishText: 'What tapa do you recommend? / A portion of Spanish potato omelet, please.',
      practicePrompt: "¿Cuál es tu comida española favorita?",
      source: 'fallback'
    };
  }

  return {
    text: `¡Excelente pregunta para tu viaje por ${cityName}!`,
    spanishText: 'Poco a poco se va lejos.',
    pronunciation: 'POH-koh ah POH-koh seh bah LEH-hohs',
    englishText: 'Little by little, one goes far. Practice makes fluent!',
    practicePrompt: "Escribe cualquier frase en español y te ayudaré a corregir fallos y mejorarla.",
    source: 'fallback'
  };
}
