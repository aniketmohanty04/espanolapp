/**
 * Spanish Voice Recognition & Pronunciation Assessment Service
 *
 * Implements Web Speech API SpeechRecognition with:
 * 1. Low-latency microphone capture in Peninsular Spanish ('es-ES') with fallback to 'es'.
 * 2. Phonetic accuracy scoring & Levenshtein-based word matching against target Spanish text.
 * 3. Specific phonetic diagnostic feedback for beginner Spanish learners (silent 'h',
 *    distinción / ceceo [θ], rolling 'rr' vs tap 'r', vowel clarity [a, e, i, o, u], and accent stress).
 * 4. Safe offline fallback & test-friendly mocking.
 */

export interface PronunciationWordFeedback {
  word: string;
  spokenWord?: string;
  status: 'correct' | 'near' | 'incorrect';
  similarity: number; // 0 to 1
  tip?: string;
}

export interface PronunciationEvaluation {
  overallScore: number; // 0 to 100
  accuracyPercent: number; // 0 to 100
  rating: 'excelente' | 'muy_bien' | 'buen_intento' | 'necesita_practica';
  ratingLabel: string;
  ratingColor: string;
  targetText: string;
  spokenText: string;
  isMatch: boolean; // true if score >= 70 or semantic match
  wordBreakdown: PronunciationWordFeedback[];
  phoneticTips: string[];
}

export interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean, confidence: number) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Browser API declarations for environments lacking SpeechRecognition types
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    mozSpeechRecognition?: SpeechRecognitionConstructor;
    msSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || win.mozSpeechRecognition || win.msSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionClass() !== null;
}

/**
 * Explicitly requests microphone permissions via getUserMedia.
 * This ensures the browser displays the prompt and confirms hardware availability.
 */
export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: true };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return { granted: true };
  } catch (err: unknown) {
    const errorObj = err as { name?: string };
    const isDenied = errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError';
    return {
      granted: false,
      error: isDenied
        ? 'Permiso de micrófono bloqueado. Haz clic en el candado 🔒 en la barra de direcciones de tu navegador y permite el micrófono.'
        : 'No se pudo acceder al micrófono. Verifica que esté conectado y no esté en uso por otra app.'
    };
  }
}

export interface AudioVolumeAnalyzer {
  getVolume: () => number; // 0 to 100
  stop: () => void;
}

/**
 * Creates an AudioContext Analyzer to measure real-time microphone volume levels.
 */
export async function createAudioVolumeAnalyzer(): Promise<AudioVolumeAnalyzer | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof window === 'undefined') {
    return null;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      stream.getTracks().forEach(t => t.stop());
      return null;
    }
    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.4;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    return {
      getVolume: () => {
        try {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          return Math.min(100, Math.round((avg / 128) * 100));
        } catch {
          return 0;
        }
      },
      stop: () => {
        try {
          source.disconnect();
          ctx.close();
          stream.getTracks().forEach(t => t.stop());
        } catch {
          // ignore
        }
      }
    };
  } catch {
    return null;
  }
}

let activeRecognition: SpeechRecognitionInstance | null = null;
let isCurrentlyListening = false;

export function isListening(): boolean {
  return isCurrentlyListening;
}

/**
 * Normalizes Spanish text for fair, case-insensitive, punctuation-free comparison.
 */
export function normalizeSpanishForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[¿?¡!.,:;()"'_/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips diacritics for approximate phonetic root comparison (e.g., 'cómo' -> 'como').
 */
export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Computes Levenshtein Distance between two strings.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Computes word similarity between 0 and 1.
 */
export function calculateWordSimilarity(target: string, spoken: string): number {
  const normTarget = normalizeSpanishForComparison(target);
  const normSpoken = normalizeSpanishForComparison(spoken);

  if (normTarget === normSpoken) return 1.0;
  if (stripAccents(normTarget) === stripAccents(normSpoken)) return 0.95;

  const maxLen = Math.max(normTarget.length, normSpoken.length);
  if (maxLen === 0) return 1.0;

  const dist = calculateLevenshteinDistance(normTarget, normSpoken);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Detects common Spanish phonetic trouble spots for language learners.
 */
function analyzePhoneticChallenges(targetWord: string, spokenWord: string = ''): string | undefined {
  const normTarget = targetWord.toLowerCase();
  const normSpoken = spokenWord.toLowerCase();

  // 1. Silent H
  if (normTarget.startsWith('h') && !normSpoken.startsWith('h')) {
    return "En español, la 'h' es siempre muda. No la pronuncies como en inglés.";
  }

  // 2. Double RR (vibrante múltiple) vs single R
  if (normTarget.includes('rr') && !normSpoken.includes('rr')) {
    return "Practica la 'rr' vibrante múltiple apoyando con firmeza la punta de la lengua en el paladar.";
  }

  // 3. Z / C before e, i (Ceceo / Distinción [θ] en España)
  if (/(?:z|c[ei])/.test(normTarget)) {
    return "En España, la 'z' y la 'c' ante 'e'/'i' se pronuncian con la lengua entre los dientes [θ] (como 'th' en inglés).";
  }

  // 4. J and G before e, i ([x])
  if (/(?:j|g[ei])/.test(normTarget)) {
    return "La 'j' y la 'g' ante 'e'/'i' tienen un sonido gutural suave desde el fondo de la garganta.";
  }

  // 5. LL and Y
  if (normTarget.includes('ll')) {
    return "La doble 'll' se pronuncia similar a una 'y' suave en la mayoría de España.";
  }

  // 6. Letter Ñ
  if (normTarget.includes('ñ')) {
    return "La 'ñ' tiene un sonido nasal palatal único, similar a 'ny' en inglés (como en 'canyon').";
  }

  return undefined;
}

/**
 * Evaluates the spoken Spanish transcript against the target Spanish text.
 */
export function evaluateSpanishPronunciation(
  targetText: string,
  spokenText: string,
  speechConfidence: number = 0.9
): PronunciationEvaluation {
  const normTarget = normalizeSpanishForComparison(targetText);
  const normSpoken = normalizeSpanishForComparison(spokenText);

  const targetTokens = normTarget.split(/\s+/).filter(Boolean);
  const spokenTokens = normSpoken.split(/\s+/).filter(Boolean);

  if (targetTokens.length === 0) {
    return {
      overallScore: 0,
      accuracyPercent: 0,
      rating: 'necesita_practica',
      ratingLabel: 'Sin audio detectable',
      ratingColor: '#EF4444',
      targetText,
      spokenText,
      isMatch: false,
      wordBreakdown: [],
      phoneticTips: ['Haz clic en el micrófono e intenta pronunciar la frase en español.']
    };
  }

  const wordBreakdown: PronunciationWordFeedback[] = [];
  const phoneticTipsSet = new Set<string>();
  let totalWordScore = 0;

  // Align words greedily
  const usedSpokenIndices = new Set<number>();

  for (let i = 0; i < targetTokens.length; i++) {
    const targetWord = targetTokens[i];
    let bestSimilarity = 0;
    let bestSpokenWord = '';
    let bestSpokenIndex = -1;

    // Search window near the current word index
    for (let j = 0; j < spokenTokens.length; j++) {
      if (usedSpokenIndices.has(j)) continue;
      const sim = calculateWordSimilarity(targetWord, spokenTokens[j]);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestSpokenWord = spokenTokens[j];
        bestSpokenIndex = j;
      }
    }

    if (bestSpokenIndex !== -1 && bestSimilarity >= 0.5) {
      usedSpokenIndices.add(bestSpokenIndex);
    }

    let status: 'correct' | 'near' | 'incorrect' = 'incorrect';
    if (bestSimilarity >= 0.85) {
      status = 'correct';
    } else if (bestSimilarity >= 0.6) {
      status = 'near';
    }

    const tip = analyzePhoneticChallenges(targetWord, bestSpokenWord);
    if (tip && status !== 'correct') {
      phoneticTipsSet.add(tip);
    }

    wordBreakdown.push({
      word: targetWord,
      spokenWord: bestSpokenWord || undefined,
      status,
      similarity: Math.round(bestSimilarity * 100) / 100,
      tip
    });

    totalWordScore += bestSimilarity;
  }

  // Base raw word accuracy (0 to 100)
  const wordAccuracy = Math.round((totalWordScore / targetTokens.length) * 100);

  // Global sentence Levenshtein ratio
  const globalDist = calculateLevenshteinDistance(normTarget, normSpoken);
  const maxLen = Math.max(normTarget.length, normSpoken.length) || 1;
  const sentenceSimilarity = Math.round(Math.max(0, 1 - globalDist / maxLen) * 100);

  // Confidence factor adjustment from speech recognizer (scaled slightly)
  const confFactor = Math.min(1.0, Math.max(0.7, speechConfidence));

  // Blended overall score
  const blendedScore = Math.round((wordAccuracy * 0.65 + sentenceSimilarity * 0.35) * confFactor);
  const finalScore = Math.min(100, Math.max(0, blendedScore));

  let rating: PronunciationEvaluation['rating'] = 'necesita_practica';
  let ratingLabel = 'Necesita práctica';
  let ratingColor = '#EF4444'; // Red

  if (finalScore >= 88) {
    rating = 'excelente';
    ratingLabel = '¡Pronunciación Excelente! 🌟';
    ratingColor = '#10B981'; // Emerald Green
  } else if (finalScore >= 75) {
    rating = 'muy_bien';
    ratingLabel = '¡Muy bien hablado! 👏';
    ratingColor = '#059669'; // Green
  } else if (finalScore >= 55) {
    rating = 'buen_intento';
    ratingLabel = 'Buen intento, se entiende 👍';
    ratingColor = '#F59E0B'; // Amber
  } else {
    rating = 'necesita_practica';
    ratingLabel = 'Sigue practicando 🎧';
    ratingColor = '#EF4444'; // Red
  }

  // General encouraging phonetic tip if no specific word tip was triggered
  if (phoneticTipsSet.size === 0) {
    if (finalScore >= 85) {
      phoneticTipsSet.add('¡Tu entonación y claridad son excelentes! Hablas con gran naturalidad.');
    } else {
      phoneticTipsSet.add('Consejo: En español las 5 vocales (A, E, I, O, U) son siempre cortas, puras y claras.');
    }
  }

  return {
    overallScore: finalScore,
    accuracyPercent: wordAccuracy,
    rating,
    ratingLabel,
    ratingColor,
    targetText,
    spokenText,
    isMatch: finalScore >= 70 || normTarget === normSpoken,
    wordBreakdown,
    phoneticTips: Array.from(phoneticTipsSet).slice(0, 3)
  };
}

/**
 * Starts listening to speech input in Spanish using Web Speech Recognition.
 */
export function startSpanishListening(options: VoiceRecognitionOptions = {}): boolean {
  if (typeof window === 'undefined') return false;

  stopSpanishListening();

  const RecognitionClass = getSpeechRecognitionClass();
  if (!RecognitionClass) {
    options.onError?.('El reconocimiento de voz no es compatible con este navegador.');
    return false;
  }

  try {
    const recognition = new RecognitionClass();
    recognition.lang = options.lang || 'es-ES'; // Peninsular Spanish standard
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.maxAlternatives = options.maxAlternatives ?? 3;

    recognition.onstart = () => {
      isCurrentlyListening = true;
      options.onStart?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let highestConfidence = 0.9;

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptPart = item[0]?.transcript || '';
        const confidence = item[0]?.confidence || 0.9;
        if (confidence > highestConfidence) highestConfidence = confidence;

        if (item.isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcriptPart.trim();
        } else {
          interimTranscript += (interimTranscript ? ' ' : '') + transcriptPart.trim();
        }
      }

      const deliveredTranscript = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
      const isFinal = Boolean(finalTranscript) && !interimTranscript;

      options.onResult?.(deliveredTranscript, isFinal, highestConfidence);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // In continuous mode, Chrome intermittently emits 'no-speech' if the speaker pauses.
      // Do not abort recognition session on harmless 'no-speech' events.
      if (event.error === 'no-speech') {
        return;
      }

      isCurrentlyListening = false;
      const errorMsg = event.error === 'not-allowed'
        ? 'Permiso de micrófono bloqueado. Haz clic en el candado 🔒 en la barra de direcciones de tu navegador y permite el micrófono.'
        : event.error === 'audio-capture'
        ? 'No se detectó ningún micrófono. Asegúrate de conectar tu micrófono.'
        : event.error === 'network'
        ? 'Error de red en el reconocimiento de voz. Verifica tu conexión a internet o VPN.'
        : `Error de reconocimiento de voz: ${event.error}`;
      options.onError?.(errorMsg);
    };

    recognition.onend = () => {
      isCurrentlyListening = false;
      activeRecognition = null;
      options.onEnd?.();
    };

    activeRecognition = recognition;
    recognition.start();
    return true;
  } catch (err) {
    isCurrentlyListening = false;
    activeRecognition = null;
    options.onError?.(err instanceof Error ? err.message : 'Error desconocido al iniciar micrófono');
    return false;
  }
}

/**
 * Stops any active speech recognition session.
 */
export function stopSpanishListening(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // safe fallback
    }
    activeRecognition = null;
  }
  isCurrentlyListening = false;
}
