import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanSpanishTextForSpeech,
  formatSpanishWithWordPauses,
  getBestSpanishVoice,
  speakSpanish,
  stopSpanishSpeech
} from '../services/spanishSpeechService';

describe('Spanish Speech Service & Text Sanitization', () => {
  describe('cleanSpanishTextForSpeech', () => {
    it('strips leading inverted exclamation marks (¡) so the first word is a clean dictionary word', () => {
      const raw = '¡Buenos días!';
      expect(cleanSpanishTextForSpeech(raw)).toBe('Buenos días!');
    });

    it('strips leading inverted question marks (¿) so the first word is not treated as a symbol', () => {
      const raw = '¿Dónde está la estación de tren?';
      expect(cleanSpanishTextForSpeech(raw)).toBe('Dónde está la estación de tren?');
    });

    it('removes parenthesized English translations and notes', () => {
      const raw = '¡Buenos días! (Morning)   ¡Buenas tardes! (Afternoon)   ¡Hola, buenas! (Casual greeting)';
      const cleaned = cleanSpanishTextForSpeech(raw);
      expect(cleaned).not.toContain('(Morning)');
      expect(cleaned).not.toContain('(Afternoon)');
      expect(cleaned).not.toContain('¡');
      expect(cleaned.startsWith('Buenos días!')).toBe(true);
    });

    it('takes the primary Spanish phrase and discards newline example lines', () => {
      const raw = 'El tenedor\nEjemplo: ¿Me trae un tenedor limpio, por favor?';
      expect(cleanSpanishTextForSpeech(raw)).toBe('El tenedor');
    });

    it('removes inline example phrases when on the same line', () => {
      const raw = 'El cuchillo Ejemplo: Un cuchillo para cortar la carne.';
      expect(cleanSpanishTextForSpeech(raw)).toBe('El cuchillo');
    });

    it('takes only the first phrase when options are separated by slashes', () => {
      const raw = '¿Dónde está la estación de tren? / ¿Cuánto cuesta un billete a Barcelona?';
      expect(cleanSpanishTextForSpeech(raw)).toBe('Dónde está la estación de tren?');
    });

    it('strips markdown syntax like bold, italic, and backticks', () => {
      const raw = '**¡Buen provecho!**';
      expect(cleanSpanishTextForSpeech(raw)).toBe('Buen provecho!');
    });

    it('strips emojis and special symbols', () => {
      const raw = '🥘 ¡La gran paella gigante de Valencia!';
      expect(cleanSpanishTextForSpeech(raw)).toBe('La gran paella gigante de Valencia!');
    });

    it('strips bullet points, dashes, and leading whitespace', () => {
      const raw = '• - ¡Hola a todos!';
      expect(cleanSpanishTextForSpeech(raw)).toBe('Hola a todos!');
    });

    it('handles empty or whitespace strings gracefully', () => {
      expect(cleanSpanishTextForSpeech('')).toBe('');
      expect(cleanSpanishTextForSpeech('   ')).toBe('');
      expect(cleanSpanishTextForSpeech(null as unknown as string)).toBe('');
    });

    it('formats Spanish text with gentle pauses between words for clear learner cadence', () => {
      const raw = '¡Buenos días, ¿cómo estás?!';
      const paused = formatSpanishWithWordPauses(raw);
      expect(paused).toBe('Buenos , días, cómo , estás?!');
    });

    it('handles single word strings without trailing commas', () => {
      expect(formatSpanishWithWordPauses('¡Hola!')).toBe('Hola!');
      expect(formatSpanishWithWordPauses('')).toBe('');
    });
  });

  describe('Speech Synthesis Execution', () => {
    let mockCancel: ReturnType<typeof vi.fn>;
    let mockSpeak: ReturnType<typeof vi.fn>;
    let mockGetVoices: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.useFakeTimers();
      mockCancel = vi.fn();
      mockSpeak = vi.fn();
      mockGetVoices = vi.fn().mockReturnValue([
        { name: 'Microsoft David Desktop', lang: 'en-US', default: true },
        { name: 'Google español', lang: 'es-ES', default: false },
        { name: 'Microsoft Helena', lang: 'es-ES', default: false }
      ]);

      (globalThis as any).window = {
        speechSynthesis: {
          cancel: mockCancel,
          speak: mockSpeak,
          getVoices: mockGetVoices
        }
      };

      class MockSpeechSynthesisUtterance {
        text: string;
        lang = '';
        voice: any = null;
        rate = 1;
        pitch = 1;
        volume = 1;
        onstart: any = null;
        onend: any = null;
        onerror: any = null;
        constructor(text: string) {
          this.text = text;
        }
      }

      (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('selects the authentic Spanish voice over the default English system voice', () => {
      const voice = getBestSpanishVoice();
      expect(voice).toBeDefined();
      expect(voice?.lang).toBe('es-ES');
      expect(voice?.name).toContain('español');
    });

    it('prepends lead-in comma pause to prime audio hardware and cancel previous speech', () => {
      const success = speakSpanish('¡Buenos días!');
      expect(success).toBe(true);
      expect(mockCancel).toHaveBeenCalled();

      // Utterance is queued after the 60ms audio buffer reset delay
      vi.advanceTimersByTime(60);

      expect(mockSpeak).toHaveBeenCalledTimes(1);
      const callArg = mockSpeak.mock.calls[0][0];
      // Lead-in comma pause primes the audio hardware buffer so 'Buenos' is never clipped
      expect(callArg.text).toBe(', Buenos días!');
      expect(callArg.lang).toBe('es-ES');
    });

    it('allows stopping active Spanish speech immediately', () => {
      speakSpanish('¡Hola!');
      stopSpanishSpeech();
      expect(mockCancel).toHaveBeenCalled();
    });

    it('applies inter-word micro-pauses and learner-friendly cadence when pauseBetweenWords is true', () => {
      speakSpanish('Buenos días', { pauseBetweenWords: true });
      vi.advanceTimersByTime(60);
      expect(mockSpeak).toHaveBeenCalled();
      const callArg = mockSpeak.mock.calls[0][0];
      expect(callArg.text).toBe(', Buenos , días');
      expect(callArg.rate).toBeLessThanOrEqual(0.75);
    });
  });
});
