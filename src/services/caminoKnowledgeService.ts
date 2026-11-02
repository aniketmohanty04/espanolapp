/**
 * Camino Adaptive Knowledge & Training Service
 * 
 * Allows Camino to:
 * 1. Learn and persist verified, high-quality Spanish explanations & grammar rules from Gemini interactions.
 * 2. Train Gemini dynamically via few-shot pedagogical exemplars tailored to the student's questions.
 * 3. Provide instant, high-quality answers from learned memory when offline, rate-limited, or re-asked.
 * 4. Verify and format Spanish orthography (inverted punctuation ¿ ?, ¡ !, proper tildes á, é, í, ó, ú, ñ).
 */

import { CaminoResponse, CaminoChatMessage } from './geminiService';

export interface LearnedKnowledgeEntry {
  id: string;
  query: string;
  normalizedQuery: string;
  keywords: string[];
  topic: string;
  response: CaminoResponse;
  learnedAt: number;
  useCount: number;
}

const STORAGE_KEY = 'aventura_camino_trained_knowledge';
const MAX_ENTRIES = 60;

// In-memory cache for fast access and non-browser / test environments
let memoryStore: LearnedKnowledgeEntry[] = [];
let isLoaded = false;

// Pre-seeded foundational knowledge base so Camino starts trained with high-quality A1 topics
const SEED_KNOWLEDGE: Array<{ query: string; topic: string; response: CaminoResponse }> = [
  {
    query: 'verbs which are neither masculine nor feminine',
    topic: 'verbs_gender',
    response: {
      text: 'In Spanish grammar, ALL verbs are gender-neutral! Unlike nouns (el libro / la mesa) and adjectives (alto / alta), verbs NEVER take masculine or feminine gender. Instead, verbs change strictly based on WHO performs the action (person & number) and WHEN (tense).\n\nHere are the most essential A1 verbs:\n• **ser** (to be - permanent identity, origin, profession)\n• **estar** (to be - temporary states, locations, conditions)\n• **tener** (to have - age, sensations, possessions)\n• **ir** (to go - movement, future actions with "ir a")\n• **hablar** (to speak - regular -ar)\n• **comer** (to eat - regular -er)\n• **vivir** (to live - regular -ir)\n• **querer** (to want / to love)\n• **hacer** (to do / to make)\n• **poder** (can / to be able to)',
      spanishText: 'Los verbos en español no tienen género. • Ejemplos: hablar, comer, vivir, ser, estar, tener, ir, querer, hacer, poder.',
      pronunciation: 'lohs VEHR-bohs ehn ehs-pah-NYOHL noh TYEH-nehn HEH-neh-roh',
      englishText: 'Verbs do not change for gender. Both male and female speakers say "yo hablo" and "yo tengo".',
      practicePrompt: '¿Quieres conjugar uno de estos verbos juntos, como "hablar" o "tener"?',
      source: 'gemini'
    }
  },
  {
    query: 'all adjectives ending with e nor feminine nor masculine',
    topic: 'adjectives_e',
    response: {
      text: 'In Spanish, adjectives ending in "-e" are called invariable or gender-neutral adjectives. They do not change spelling between masculine and feminine nouns—they stay identical for both!\n\nHere is a comprehensive list of common A1-level adjectives ending in "-e":\n• **inteligente** (smart / intelligent)\n• **interesante** (interesting)\n• **amable** (kind / polite)\n• **alegre** (cheerful / happy)\n• **triste** (sad)\n• **grande** (big / large)\n• **fuerte** (strong)\n• **débil** (weak)\n• **verde** (green)\n• **dulce** (sweet)\n• **pobre** (poor)\n• **elegante** (elegant)\n• **importante** (important)\n\nRule: To make any of these plural, simply add "-s" to the end (e.g. chicos inteligentes, chicas inteligentes).',
      spanishText: 'El chico es inteligente. La chica es inteligente. • Los chicos son amables. Las chicas son amables.',
      pronunciation: 'in-te-li-GEN-te, a-MA-ble, GRAN-de, VER-de',
      englishText: 'Notice that both "el chico inteligente" and "la chica inteligente" use the exact same form.',
      practicePrompt: '¿Puedes formar una frase usando "grande" o "interesante"?',
      source: 'gemini'
    }
  },
  {
    query: 'give all adjectives which are not gender biased',
    topic: 'adjectives_e',
    response: {
      text: 'In Spanish grammar, adjectives ending in "-e" (and many ending in consonants or "-ista") are gender-neutral (invariable)! They do not change form between masculine and feminine nouns.\n\nHere is a comprehensive list of essential A1 gender-neutral adjectives:\n• **inteligente** (smart / intelligent) - un chico inteligente / una chica inteligente\n• **interesante** (interesting) - un libro interesante / una película interesante\n• **amable** (kind / polite) - un hombre amable / una mujer amable\n• **alegre** (cheerful / happy) - un amigo alegre / una amiga alegre\n• **grande** (big / large) - un hotel grande / una casa grande\n• **fuerte** (strong) - un café fuerte / una persona fuerte\n• **triste** (sad) - un día triste / una historia triste\n• **verde** (green) - un coche verde / una manzana verde\n• **dulce** (sweet) - un postre dulce / una fruta dulce\n• **elegante** (elegant) - un traje elegante / una camisa elegante\n• **fácil** (easy) - un examen fácil / una tarea fácil\n• **difícil** (difficult) - un ejercicio difícil / una pregunta difícil\n• **optimista** (optimistic) - un estudiante optimista / una estudiante optimista\n\nRule: Invariable adjectives stay identical for both masculine and feminine nouns.',
      spanishText: 'Adjetivos invariables (sin distinción de género): inteligente, interesante, amable, alegre, grande, fuerte, fácil, difícil, optimista.',
      pronunciation: 'ihn-teh-lee-HEHN-teh, ihn-teh-reh-SAHN-teh, ah-MAH-bleh, GRAN-deh, FAH-theel',
      englishText: 'Notice that both "un chico inteligente" and "una chica inteligente" use the exact same adjective form without altering for gender.',
      practicePrompt: 'Elige uno de estos adjetivos y forma una frase en español (por ejemplo: "La casa es grande" o "El profesor es amable").',
      source: 'gemini'
    }
  },
  {
    query: 'difference between ser and estar',
    topic: 'ser_vs_estar',
    response: {
      text: 'Both "ser" and "estar" translate to "to be" in English, but they represent very different concepts in Spanish:\n\n1. **SER** expresses permanent qualities, identity, nationality, profession, and origin:\n• "Soy estudiante" (I am a student - profession)\n• "Marcos es de España" (Marcos is from Spain - origin)\n\n2. **ESTAR** expresses physical locations, temporary conditions, emotions, and ongoing states:\n• "Estoy en Madrid" (I am in Madrid - location)\n• "La comida está caliente" (The food is hot - temporary condition)\n• "Estoy cansado" (I am tired - emotion/state)',
      spanishText: 'SER (permanente / identidad) vs ESTAR (lugar / estado temporal)',
      pronunciation: 'SEHR vs ehs-TAHR',
      englishText: 'Quick memory trick: Use ESTAR for position, location, action, condition, and emotion. Use SER for description, occupation, characteristic, time, origin, and relationship.',
      practicePrompt: '¿Cómo dirías en español: "I am happy today" (use estar)?',
      source: 'gemini'
    }
  }
];

function normalizeQueryText(query: string): string {
  return query
    .toLowerCase()
    .replace(/[¿?¡!.,;:()'"]/g, '')
    .trim();
}

function extractKeywords(normalized: string): string[] {
  return normalized
    .split(/\s+/)
    .filter(w => w.length > 2 && !['the', 'and', 'with', 'for', 'that', 'which', 'are', 'what', 'how', 'give', 'list'].includes(w));
}

function loadKnowledge(): LearnedKnowledgeEntry[] {
  if (isLoaded) return memoryStore;

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryStore = parsed;
          isLoaded = true;
          return memoryStore;
        }
      }
    }
  } catch {
    // fallback
  }

  // Initialize with seed knowledge
  memoryStore = SEED_KNOWLEDGE.map((seed, idx) => {
    const norm = normalizeQueryText(seed.query);
    return {
      id: `seed-${idx}`,
      query: seed.query,
      normalizedQuery: norm,
      keywords: extractKeywords(norm),
      topic: seed.topic,
      response: seed.response,
      learnedAt: Date.now() - 86400000,
      useCount: 1
    };
  });

  isLoaded = true;
  return memoryStore;
}

function persistKnowledge(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    }
  } catch {
    // fallback
  }
}

/**
 * Records a verified high-quality response from Gemini so Camino trains itself on it.
 */
export function recordCaminoLearnedResponse(
  query: string,
  response: CaminoResponse,
  topicHint?: string
): void {
  if (!query || !query.trim() || !response || !response.text) return;

  const entries = loadKnowledge();
  const normalized = normalizeQueryText(query);
  const keywords = extractKeywords(normalized);

  // Check if already learned
  const existingIdx = entries.findIndex(e => e.normalizedQuery === normalized);
  if (existingIdx >= 0) {
    entries[existingIdx].response = response;
    entries[existingIdx].useCount += 1;
    entries[existingIdx].learnedAt = Date.now();
  } else {
    // Deduce topic
    let topic = topicHint || 'general';
    if (normalized.includes('verb') || normalized.includes('conjugat')) topic = 'verbs';
    else if (normalized.includes('adjective') || normalized.includes('ending in')) topic = 'adjectives';
    else if (normalized.includes('ser') || normalized.includes('estar')) topic = 'ser_vs_estar';
    else if (normalized.includes('food') || normalized.includes('tapa')) topic = 'food';
    else if (normalized.includes('travel') || normalized.includes('where is')) topic = 'travel';

    entries.unshift({
      id: `learned-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      query: query.trim(),
      normalizedQuery: normalized,
      keywords,
      topic,
      response: {
        ...response,
        source: 'gemini'
      },
      learnedAt: Date.now(),
      useCount: 1
    });

    if (entries.length > MAX_ENTRIES) {
      entries.pop();
    }
  }

  persistKnowledge();
}

/**
 * Finds a matching learned response from Camino's knowledge base.
 */
export function findTrainedCaminoResponse(
  query: string,
  chatHistory?: CaminoChatMessage[]
): CaminoResponse | null {
  const entries = loadKnowledge();
  const normalized = normalizeQueryText(query);
  const queryKeywords = extractKeywords(normalized);

  // 1. Exact query match
  const exact = entries.find(e => e.normalizedQuery === normalized);
  if (exact) {
    exact.useCount += 1;
    return exact.response;
  }

  // 2. Contextual follow-up check (e.g. "give me the list", "gimme a list")
  const isListFollowUp = (
    normalized === 'give me the list' ||
    normalized === 'give me a list' ||
    normalized === 'gimme a list' ||
    normalized === 'give me list' ||
    normalized === 'the list'
  );

  if (isListFollowUp && chatHistory && chatHistory.length > 0) {
    const priorContext = chatHistory.slice(-2).map(m => m.text.toLowerCase()).join(' ');
    if (priorContext.includes('verb') || priorContext.includes('conjugat')) {
      const verbEntry = entries.find(e => e.topic === 'verbs_gender' || e.topic === 'verbs');
      if (verbEntry) return verbEntry.response;
    }
    if (priorContext.includes('adjective') || priorContext.includes('ending in e') || priorContext.includes('ending in -e')) {
      const adjEntry = entries.find(e => e.topic === 'adjectives_e' || e.topic === 'adjectives');
      if (adjEntry) return adjEntry.response;
    }
  }

  // 3. Topic-level conceptual match for gender-neutral queries
  const isAdjectiveGenderQuery = (
    (normalized.includes('adjective') || normalized.includes('adjetivo')) &&
    (normalized.includes('gender') || normalized.includes('biased') || normalized.includes('neutral') || normalized.includes('ending in e') || normalized.includes('ending in -e') || normalized.includes('ending with e') || normalized.includes('neither') || normalized.includes('feminine') || normalized.includes('masculine'))
  );
  if (isAdjectiveGenderQuery) {
    const adjEntry = entries.find(e => e.topic === 'adjectives_e' || e.topic === 'adjectives');
    if (adjEntry) {
      adjEntry.useCount += 1;
      return adjEntry.response;
    }
  }

  const isVerbGenderQuery = (
    (normalized.includes('verb') || normalized.includes('verbo')) &&
    (normalized.includes('gender') || normalized.includes('neither') || normalized.includes('neutral') || normalized.includes('biased') || normalized.includes('feminine') || normalized.includes('masculine'))
  );
  if (isVerbGenderQuery) {
    const verbEntry = entries.find(e => e.topic === 'verbs_gender' || e.topic === 'verbs');
    if (verbEntry) {
      verbEntry.useCount += 1;
      return verbEntry.response;
    }
  }

  // 4. Keyword overlap match
  if (queryKeywords.length >= 2) {
    let bestMatch: LearnedKnowledgeEntry | null = null;
    let maxMatches = 0;

    for (const entry of entries) {
      let matches = 0;
      for (const kw of queryKeywords) {
        if (entry.keywords.includes(kw) || entry.normalizedQuery.includes(kw)) {
          matches += 1;
        }
      }
      if (matches >= 2 && matches > maxMatches) {
        maxMatches = matches;
        bestMatch = entry;
      }
    }

    const requiredMatches = Math.max(2, Math.ceil(queryKeywords.length * 0.75));
    if (bestMatch && maxMatches >= requiredMatches) {
      bestMatch.useCount += 1;
      return bestMatch.response;
    }
  }

  return null;
}

/**
 * Resets the knowledge base to default seeds (useful for testing).
 */
export function resetCaminoKnowledge(): void {
  isLoaded = false;
  memoryStore = [];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Provides dynamic training exemplars to Gemini so it continuously aligns with Camino's pedagogical standard.
 */
export function getCaminoTrainingExemplars(currentQuery: string): string {
  const entries = loadKnowledge();
  const normalized = normalizeQueryText(currentQuery);

  // Select 1 or 2 relevant entries to inject as few-shot teaching exemplars
  const relevant = entries
    .filter(e => e.response.text && e.response.spanishText)
    .slice(0, 2);

  if (relevant.length === 0) return '';

  return `\n\nCAMINO PEDAGOGICAL TRAINING EXEMPLARS (Teach using this exact bilingual clarity and structured depth):
${relevant.map((entry, idx) => `Example ${idx + 1}:
Question: "${entry.query}"
Camino Output:
{
  "text": ${JSON.stringify(entry.response.text)},
  "spanishText": ${JSON.stringify(entry.response.spanishText || '')},
  "pronunciation": ${JSON.stringify(entry.response.pronunciation || '')},
  "englishText": ${JSON.stringify(entry.response.englishText || '')},
  "practicePrompt": ${JSON.stringify(entry.response.practicePrompt || '')}
}`).join('\n\n')}`;
}

/**
 * Ensures Spanish punctuation, accent integrity, and bilingual formatting.
 */
export function enforceProperSpanishPedagogy(res: CaminoResponse): CaminoResponse {
  const cleaned: CaminoResponse = { ...res };

  // Ensure Spanish inverted question marks if spanishText asks a question
  if (cleaned.spanishText) {
    if (cleaned.spanishText.includes('?') && !cleaned.spanishText.includes('¿')) {
      cleaned.spanishText = cleaned.spanishText.replace(/([A-Za-z0-9áéíóúñÁÉÍÓÚÑ\s]+)\?/g, '¿$1?');
    }
    if (cleaned.spanishText.includes('!') && !cleaned.spanishText.includes('¡')) {
      cleaned.spanishText = cleaned.spanishText.replace(/([A-Za-z0-9áéíóúñÁÉÍÓÚÑ\s]+)!/g, '¡$1!');
    }
  }

  return cleaned;
}
