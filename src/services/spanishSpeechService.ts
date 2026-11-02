/**
 * Spanish Speech Service
 * High-fidelity Web Speech API synthesizer for authentic Spanish language learning.
 *
 * Resolves critical browser and OS audio synthesis quirks:
 * 1. Windows / Chromium First-Word Clipping Bug:
 *    When audio hardware or the speech pipeline awakens from an idle state, the first 150-250ms
 *    of audio are often muted or dropped. Prepending a soft lead-in pause (', ') primes the
 *    hardware buffer so 100% of the first word is clearly spoken.
 * 2. Inverted Punctuation Mark Spelling Glitch (¡ and ¿):
 *    In written Spanish, ¡ and ¿ are visual punctuation. When speech synthesizers encounter
 *    leading ¡ or ¿ without separation, they treat the first word as an invalid token or symbol,
 *    causing the engine to spell out the letters (e.g. 'B-U-E-N-O-S') or skip the word entirely.
 * 3. Authentic Spanish Voice Discovery:
 *    On Windows, the default system voice is typically English (Microsoft David), which mangles
 *    Spanish or spells out accented words. This service actively discovers native Spanish voices
 *    (Google español, Microsoft Helena, Microsoft Laura, Microsoft Sabina, etc.).
 * 4. Cancellation Race Condition:
 *    Calling window.speechSynthesis.speak() immediately after cancel() drops utterances in Chrome.
 *    A 60ms decoupling timer allows the browser's audio pipeline to reset cleanly.
 */

export function cleanSpanishTextForSpeech(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  // 1. Take primary sentence before newlines
  let text = raw.split('\n')[0].trim();

  // 2. Remove inline example markers like 'Ejemplo: ...' or 'Example: ...'
  text = text.replace(/(?:Ejemplo|Example|Ex)\s*:\s*.*$/i, '').trim();

  // 3. If there are alternative options separated by ' / ', take the primary phrase
  if (text.includes(' / ')) {
    text = text.split(' / ')[0].trim();
  }

  // 4. Remove parenthesized English translations/notes like '(Morning)', '(de agua / de zumo)'
  text = text.replace(/\([^)]*\)/g, ' ').trim();

  // 5. Remove bracketed text like '[palabra]'
  text = text.replace(/\[[^\]]*\]/g, ' ').trim();

  // 6. Strip emojis (e.g. 🇪🇸, 🥘, 🔍, 🤖, etc.)
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

  // 7. Strip markdown bold, italic, code, hashtags (*, _, `, #, ~)
  text = text.replace(/[*_#`~]/g, '').trim();

  // 8. Strip quotation marks
  text = text.replace(/["«»“”]/g, '').trim();

  // 9. CRITICAL FIX: Strip inverted Spanish punctuation marks (¡ and ¿)
  // In spoken Spanish, ¡ and ¿ are silent visual markers. In Chromium/Windows TTS,
  // prepended ¡ or ¿ makes the tokenizer treat the first word as an invalid token or acronym,
  // causing it to spell the first word letter-by-letter or choke!
  text = text.replace(/[¡¿]/g, '').trim();

  // 10. Strip leading non-alphabetical characters (bullets, numbers, dashes, spaces)
  text = text.replace(/^[•\-\*–—\d.)\s]+/, '').trim();

  // 11. Normalize multiple spaces
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Formats Spanish text to insert gentle, natural micro-pauses between words
 * so language learners hear each word distinctly without words slurring together.
 */
export function formatSpanishWithWordPauses(raw: string): string {
  const cleaned = cleanSpanishTextForSpeech(raw);
  if (!cleaned) return '';

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return cleaned;

  return tokens
    .map((word, i) => {
      if (i === tokens.length - 1) return word;
      // If word already ends in sentence punctuation, preserve it
      if (/[,.:;!?¡¿]$/.test(word)) return word;
      // Never insert comma after 1-2 letter connector words to avoid acronym spelling
      if (/^(es|el|la|un|de|en|y|a|al|o|se|te|me|su|mi)$/i.test(word)) return word;
      // Insert soft pause separator
      return `${word},`;
    })
    .join(' ');
}

export function getBestSpanishVoice(preferredLang?: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const isMexico = preferredLang?.toLowerCase().startsWith('es-mx');

    // 1. If Mexico is preferred, search for Mexican Spanish voices
    if (isMexico) {
      const esMx = voices.find(v => {
        const lang = v.lang.toLowerCase().replace('_', '-');
        const name = v.name.toLowerCase();
        return (
          lang === 'es-mx' ||
          (lang.startsWith('es') && (name.includes('mexic') || name.includes('sabina') || name.includes('raul') || name.includes('dalia')))
        );
      });
      if (esMx) return esMx;
    }

    // 2. High priority: European Spanish voices (es-ES, Microsoft Helena, Microsoft Laura, Jorge, Mónica, Álvaro, Elvira)
    const esSpain = voices.find(v => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      const name = v.name.toLowerCase();
      return (
        lang === 'es-es' ||
        (lang.startsWith('es') &&
          (name.includes('helena') ||
            name.includes('laura') ||
            name.includes('alvaro') ||
            name.includes('álvaro') ||
            name.includes('elvira') ||
            name.includes('spain') ||
            name.includes('españa') ||
            name.includes('castilian')))
      );
    });
    if (!isMexico && esSpain) return esSpain;

    // 3. High priority: Google Español / Google Spanish (exceptional clarity in Chrome)
    const googleEs = voices.find(v => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      const name = v.name.toLowerCase();
      return (lang.startsWith('es') || name.includes('spanish') || name.includes('español')) &&
        (name.includes('google') || name.includes('natural'));
    });
    if (googleEs) return googleEs;

    // 4. Return European voice if available
    if (esSpain) return esSpain;

    // 5. Priority: Any native Spanish voice (es-MX, es-US, es-419, Microsoft Sabina, Microsoft Raul, Paulina)
    const anyEs = voices.find(v => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      const name = v.name.toLowerCase();
      return lang.startsWith('es') || name.includes('spanish') || name.includes('español');
    });
    if (anyEs) return anyEs;

    return null;
  } catch {
    return null;
  }
}

// Common Spanish word phonetic dictionary for 100% accurate human-grade guides
const COMMON_SPANISH_PHONETICS: Record<string, string> = {
  'maria': 'mah-REE-ah',
  'maría': 'mah-REE-ah',
  'es': 'ess',
  'profesora': 'proh-feh-SOH-rah',
  'profesor': 'proh-feh-SOHR',
  'buenos': 'BWEH-nohs',
  'días': 'DEE-ahs',
  'dias': 'DEE-ahs',
  'buenas': 'BWEH-nahs',
  'tardes': 'TAHR-dehs',
  'noches': 'NOH-chehs',
  'hola': 'OH-lah',
  'gracias': 'GRAH-syahs',
  'muchas': 'MOO-chahs',
  'por': 'por',
  'favor': 'fah-BOHR',
  'hasta': 'AHS-tah',
  'luego': 'LWEH-goh',
  'pronto': 'PROHN-toh',
  'mañana': 'mah-NYAH-nah',
  'manana': 'mah-NYAH-nah',
  'adios': 'ah-DYOHS',
  'adiós': 'ah-DYOHS',
  'como': 'KOH-moh',
  'cómo': 'KOH-moh',
  'estas': 'ehs-TAHS',
  'estás': 'ehs-TAHS',
  'muy': 'mwee',
  'bien': 'byen',
  'yo': 'yoh',
  'el': 'ehl',
  'la': 'lah',
  'un': 'oon',
  'una': 'OO-nah',
  'soy': 'soy',
  'estoy': 'ehs-TOY',
  'donde': 'DOHN-deh',
  'dónde': 'DOHN-deh',
  'esta': 'ehs-TAH',
  'está': 'ehs-TAH',
  'tren': 'trehn',
  'estacion': 'ehs-tah-SYOHN',
  'estación': 'ehs-tah-SYOHN',
  'madrid': 'mah-DREED',
  'toledo': 'toh-LEH-doh',
  'espana': 'ehs-PAH-nyah',
  'españa': 'ehs-PAH-nyah',
  'billete': 'bee-YEH-teh',
  'cafe': 'kah-FEH',
  'café': 'kah-FEH',
  'con': 'kohn',
  'leche': 'LEH-cheh',
  'agua': 'AH-gwah',
  'si': 'see',
  'sí': 'see',
  'no': 'noh'
};

/**
 * Generates an intuitive phonetic guide for Spanish text (e.g. "María es profesora" -> "mah-REE-ah ess proh-feh-SOH-rah")
 */
export function getSpanishPhoneticGuide(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const clean = text.replace(/^[¡¿"\s]+|[!?"\s]+$/g, '').trim();
  if (!clean) return '';

  const words = clean.split(/\s+/);
  return words
    .map(word => {
      const punctMatch = word.match(/([.,;:!?]+)$/);
      const punct = punctMatch ? punctMatch[1] : '';
      const rawWord = word.replace(/[.,;:!?¡¿"']/g, '').toLowerCase();

      if (COMMON_SPANISH_PHONETICS[rawWord]) {
        return COMMON_SPANISH_PHONETICS[rawWord] + punct;
      }

      // Algorithmic phonetic approximation for Spanish
      const p = rawWord
        .replace(/ch/g, 'ch')
        .replace(/ll/g, 'y')
        .replace(/rr/g, 'rr')
        .replace(/ñ/g, 'ny')
        .replace(/qu([ei])/g, 'k$1')
        .replace(/gu([ei])/g, 'g$1')
        .replace(/c([ei])/g, 'th$1')
        .replace(/z/g, 'th')
        .replace(/j/g, 'kh')
        .replace(/ge/g, 'khe')
        .replace(/gi/g, 'khi')
        .replace(/v/g, 'b')
        .replace(/^h/g, '')
        .replace(/y$/g, 'ee');

      return p + punct;
    })
    .join(' ');
}

/**
 * Returns a direct streamable native Spanish audio URL for guaranteed authentic pronunciation
 */
export function getSpanishAudioUrl(text: string, lang: string = 'es-ES'): string {
  const cleaned = cleanSpanishTextForSpeech(text);
  const tl = lang.toLowerCase().startsWith('es-mx') ? 'es-MX' : 'es-ES';
  return `/api/spanish-tts?text=${encodeURIComponent(cleaned)}&lang=${tl}`;
}

// Keep active reference to prevent Chromium garbage collection from abruptly cutting speech
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
let speechTimeoutId: ReturnType<typeof setTimeout> | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.onvoiceschanged = () => {
      // Warm-up voice cache as soon as the browser loads them asynchronously
      getBestSpanishVoice();
    };
  } catch {
    // Ignore in non-browser environments
  }
}

export interface SpeakSpanishOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string; // e.g. 'es-ES' or 'es-MX'
  pauseBetweenWords?: boolean; // When true, inserts slight micro-pauses between words for distinct clarity
  preferNativeAudio?: boolean; // When true or when no native Spanish OS voice is found, uses audio stream
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

function speakViaSpeechSynthesis(
  cleaned: string,
  options: SpeakSpanishOptions,
  spanishVoice: SpeechSynthesisVoice | null
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  try {
    if (speechTimeoutId) {
      clearTimeout(speechTimeoutId);
      speechTimeoutId = null;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Chromium audio pipeline reset delay (60ms)
    speechTimeoutId = setTimeout(() => {
      try {
        let baseText = options.pauseBetweenWords
          ? formatSpanishWithWordPauses(cleaned)
          : cleaned;

        const voice = spanishVoice || getBestSpanishVoice(options.lang);
        // If no Spanish voice is available and we must fall back to an English OS voice,
        // phonetically adapt "es" -> "ess" so Microsoft David never spells out the letters "E-S"!
        if (!voice) {
          baseText = baseText.replace(/\bes\b/gi, 'ess');
        }

        const textToSpeak = voice ? `, ${baseText}` : baseText;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = options.lang || 'es-ES';
        }

        // Calibrated beginner rate: slower, calmer cadence (0.74 if pauseBetweenWords, 0.80 standard)
        const defaultRate = options.pauseBetweenWords ? 0.74 : 0.80;
        utterance.rate = options.rate ?? defaultRate;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;

        utterance.onstart = () => {
          options.onStart?.();
        };

        const cleanup = () => {
          activeUtterance = null;
        };

        utterance.onend = () => {
          cleanup();
          options.onEnd?.();
        };

        utterance.onerror = (evt) => {
          cleanup();
          options.onError?.(evt);
        };

        activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        options.onError?.(err);
      }
    }, 60);

    return true;
  } catch (err) {
    options.onError?.(err);
    return false;
  }
}

export function speakSpanish(text: string, options: SpeakSpanishOptions = {}): boolean {
  if (typeof window === 'undefined') return false;

  const cleaned = cleanSpanishTextForSpeech(text);
  if (!cleaned) return false;

  stopSpanishSpeech();

  const lang = options.lang || 'es-ES';
  const spanishVoice = getBestSpanishVoice(lang);

  // If preferNativeAudio is set OR no genuine native Spanish voice exists locally in this browser/OS,
  // play authentic native Spanish audio via HTML5 Audio element!
  const hasLocalSpanishVoice = Boolean(spanishVoice);
  const shouldUseNativeAudio = Boolean(
    (options.preferNativeAudio || !hasLocalSpanishVoice) &&
    typeof Audio !== 'undefined'
  );

  if (shouldUseNativeAudio) {
    try {
      const audioUrl = getSpanishAudioUrl(cleaned, lang);
      const audio = new Audio(audioUrl);
      activeAudio = audio;
      if (options.rate && options.rate !== 1.0) {
        audio.playbackRate = options.rate;
      }
      audio.onplay = () => {
        options.onStart?.();
      };
      audio.onended = () => {
        if (activeAudio === audio) activeAudio = null;
        options.onEnd?.();
      };
      audio.onerror = () => {
        if (activeAudio === audio) activeAudio = null;
        // Fall back to SpeechSynthesis if Audio element fails or is offline
        speakViaSpeechSynthesis(cleaned, options, spanishVoice);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (activeAudio === audio) activeAudio = null;
          // Fall back to SpeechSynthesis if Audio playback was blocked by autoplay
          speakViaSpeechSynthesis(cleaned, options, spanishVoice);
        });
      }
      return true;
    } catch {
      // Audio element failed, fall back to speechSynthesis
    }
  }

  return speakViaSpeechSynthesis(cleaned, options, spanishVoice);
}

export function stopSpanishSpeech(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (speechTimeoutId) {
        clearTimeout(speechTimeoutId);
        speechTimeoutId = null;
      }
      window.speechSynthesis.cancel();
      if (activeUtterance) {
        activeUtterance = null;
      }
    } catch {
      // safe fallback
    }
  }
}

export function isSpanishSpeechActive(): boolean {
  return Boolean(activeAudio || activeUtterance);
}
