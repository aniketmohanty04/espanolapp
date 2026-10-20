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

export function getBestSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. High priority: European Spanish voices (es-ES, Microsoft Helena, Microsoft Laura, Jorge, Mónica)
    const esSpain = voices.find(v => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return (
        lang === 'es-es' ||
        (lang.startsWith('es') &&
          (name.includes('helena') ||
            name.includes('laura') ||
            name.includes('spain') ||
            name.includes('españa') ||
            name.includes('castilian')))
      );
    });
    if (esSpain) return esSpain;

    // 2. High priority: Google Español / Google Spanish (exceptional clarity in Chrome)
    const googleEs = voices.find(v => {
      const lang = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      return lang.startsWith('es') && (name.includes('google') || name.includes('natural'));
    });
    if (googleEs) return googleEs;

    // 3. Priority: Any native Spanish voice (es-MX, es-US, Microsoft Sabina, Microsoft Raul, Paulina)
    const anyEs = voices.find(v => v.lang.toLowerCase().startsWith('es'));
    if (anyEs) return anyEs;

    return null;
  } catch {
    return null;
  }
}

// Keep active reference to prevent Chromium garbage collection from abruptly cutting speech
let activeUtterance: SpeechSynthesisUtterance | null = null;
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
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

export function speakSpanish(text: string, options: SpeakSpanishOptions = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  const cleaned = cleanSpanishTextForSpeech(text);
  if (!cleaned) return false;

  try {
    if (speechTimeoutId) {
      clearTimeout(speechTimeoutId);
      speechTimeoutId = null;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Chromium audio pipeline reset delay (60ms)
    // Calling speak immediately after cancel can cause the new speech to be aborted
    speechTimeoutId = setTimeout(() => {
      try {
        // Prepend a soft lead-in pause (', ')
        // This causes the TTS engine to pause ~150ms before pronouncing the first word.
        // During this pause, the Windows/Chrome audio hardware awakens and initializes,
        // preventing the first word or initial syllable from being clipped!
        const textToSpeak = `, ${cleaned}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        const spanishVoice = getBestSpanishVoice();
        if (spanishVoice) {
          utterance.voice = spanishVoice;
          utterance.lang = spanishVoice.lang;
        } else {
          utterance.lang = 'es-ES';
        }

        utterance.rate = options.rate ?? 0.88;
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

export function stopSpanishSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (speechTimeoutId) {
        clearTimeout(speechTimeoutId);
        speechTimeoutId = null;
      }
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch {
      // safe fallback
    }
  }
}
