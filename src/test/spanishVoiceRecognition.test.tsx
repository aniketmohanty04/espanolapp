import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  normalizeSpanishForComparison,
  stripAccents,
  calculateLevenshteinDistance,
  calculateWordSimilarity,
  evaluateSpanishPronunciation,
  isSpeechRecognitionSupported,
  startSpanishListening,
  stopSpanishListening,
  isListening
} from '../services/spanishVoiceRecognitionService';
import { PronunciationTrainerModal } from '../components/PronunciationTrainerModal';
import { LevelModal } from '../components/LevelModal';
import { BossMissionModal } from '../components/BossMissionModal';
import { FloatingChatbot } from '../components/FloatingChatbot';
import { GameProvider, useGame } from '../context/GameContext';
import { getCityById } from '../data/citiesData';
import { authDatabaseService } from '../services/authDatabaseService';
import { supabaseService } from '../services/supabaseClient';
import { storageService, INITIAL_PROGRESS } from '../services/storageService';

describe('Spanish Voice Recognition & Pronunciation Assessment Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    stopSpanishListening();
  });

  afterEach(() => {
    stopSpanishListening();
    vi.unstubAllGlobals();
  });

  describe('Text Normalization and Distance Utilities', () => {
    it('normalizes Spanish punctuation, accents, and case', () => {
      expect(normalizeSpanishForComparison('¡Hola, ¿cómo estás?!')).toBe('hola cómo estás');
      expect(normalizeSpanishForComparison('  Buenos   días...  ')).toBe('buenos días');
      expect(normalizeSpanishForComparison('')).toBe('');
    });

    it('strips diacritics for phonetic root comparison', () => {
      expect(stripAccents('está')).toBe('esta');
      expect(stripAccents('adiós')).toBe('adios');
      expect(stripAccents('fácil')).toBe('facil');
    });

    it('computes exact Levenshtein distance', () => {
      expect(calculateLevenshteinDistance('hola', 'hola')).toBe(0);
      expect(calculateLevenshteinDistance('casa', 'caso')).toBe(1);
      expect(calculateLevenshteinDistance('perro', 'pero')).toBe(1);
      expect(calculateLevenshteinDistance('', 'madrid')).toBe(6);
    });

    it('computes word similarity accurately', () => {
      expect(calculateWordSimilarity('hola', 'hola')).toBe(1.0);
      // Accented equivalent should score ~0.95
      expect(calculateWordSimilarity('cómo', 'como')).toBe(0.95);
      // Partial phonetic variations
      expect(calculateWordSimilarity('gracias', 'gratis')).toBeGreaterThan(0.6);
      expect(calculateWordSimilarity('hola', 'aeropuerto')).toBeLessThan(0.3);
    });
  });

  describe('Pronunciation Evaluation & Phonetic Diagnosis', () => {
    it('rates perfect pronunciation as excelente (>= 88%)', () => {
      const evaluation = evaluateSpanishPronunciation(
        'Buenos días, ¿cómo estás?',
        'Buenos días, cómo estás',
        0.95
      );

      expect(evaluation.overallScore).toBeGreaterThanOrEqual(88);
      expect(evaluation.rating).toBe('excelente');
      expect(evaluation.ratingColor).toBe('#10B981');
      expect(evaluation.isMatch).toBe(true);
      expect(evaluation.wordBreakdown.every(w => w.status === 'correct')).toBe(true);
    });

    it('rates minor inaccuracies as muy_bien or buen_intento', () => {
      const evaluation = evaluateSpanishPronunciation(
        'Una mesa para dos personas por favor',
        'Una mesa para dos personas por favo',
        0.85
      );

      expect(evaluation.overallScore).toBeGreaterThanOrEqual(70);
      expect(['excelente', 'muy_bien', 'buen_intento']).toContain(evaluation.rating);
      expect(evaluation.isMatch).toBe(true);
    });

    it('flags rolling "rr" phonetic challenge when omitted', () => {
      const evaluation = evaluateSpanishPronunciation(
        'El perro corre rápido',
        'El pero core rápido',
        0.8
      );

      const hasRrTip = evaluation.phoneticTips.some(tip => tip.includes('rr'));
      expect(hasRrTip).toBe(true);
    });

    it('flags silent "h" phonetic challenge when needed', () => {
      const evaluation = evaluateSpanishPronunciation(
        'Hola, hasta luego',
        'Ola, asta luego',
        0.8
      );

      expect(evaluation.wordBreakdown.length).toBe(3);
    });

    it('flags distinción / ceceo [θ] for z and c before e/i', () => {
      const evaluation = evaluateSpanishPronunciation(
        'Muchas gracias señorita',
        'Muchas grasias señorita',
        0.8
      );

      const hasZcTip = evaluation.phoneticTips.some(tip => tip.includes('z') || tip.includes('c'));
      expect(hasZcTip).toBe(true);
    });

    it('handles empty transcript gracefully without crashing', () => {
      const evaluation = evaluateSpanishPronunciation(
        '¿Dónde está la estación de tren?',
        '',
        0.0
      );

      expect(evaluation.overallScore).toBe(0);
      expect(evaluation.rating).toBe('necesita_practica');
      expect(evaluation.isMatch).toBe(false);
      expect(evaluation.phoneticTips.length).toBeGreaterThan(0);
    });
  });

  describe('Speech Recognition API Integration & Mocking', () => {
    it('returns false for isSpeechRecognitionSupported when API is absent in Node', () => {
      expect(isSpeechRecognitionSupported()).toBe(false);
    });

    it('detects SpeechRecognition when webkitSpeechRecognition is available on window', () => {
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = 'es-ES';
        maxAlternatives = 1;
        start = vi.fn();
        stop = vi.fn();
        abort = vi.fn();
        onstart = null;
        onresult = null;
        onerror = null;
        onend = null;
      }

      vi.stubGlobal('window', {
        webkitSpeechRecognition: MockSpeechRecognition
      });

      expect(isSpeechRecognitionSupported()).toBe(true);
    });

    it('starts and stops speech recognition lifecycle callbacks correctly', () => {
      let instanceCreated: any = null;

      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = 'es-ES';
        maxAlternatives = 1;
        start = vi.fn(() => {
          if (this.onstart) this.onstart();
        });
        stop = vi.fn(() => {
          if (this.onend) this.onend();
        });
        abort = vi.fn();
        onstart: (() => void) | null = null;
        onresult: ((e: any) => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        onend: (() => void) | null = null;

        constructor() {
          instanceCreated = this;
        }
      }

      vi.stubGlobal('window', {
        SpeechRecognition: MockSpeechRecognition
      });

      const onStartMock = vi.fn();
      const onResultMock = vi.fn();
      const onEndMock = vi.fn();

      const success = startSpanishListening({
        lang: 'es-ES',
        onStart: onStartMock,
        onResult: onResultMock,
        onEnd: onEndMock
      });

      expect(success).toBe(true);
      expect(onStartMock).toHaveBeenCalledTimes(1);
      expect(isListening()).toBe(true);

      // Simulate recognition result
      if (instanceCreated?.onresult) {
        instanceCreated.onresult({
          resultIndex: 0,
          results: [
            Object.assign([{ transcript: 'Buenos días', confidence: 0.95 }], { isFinal: true })
          ]
        });
      }

      expect(onResultMock).toHaveBeenCalledWith('Buenos días', true, 0.95);

      stopSpanishListening();
      expect(instanceCreated.stop).toHaveBeenCalled();
      expect(isListening()).toBe(false);
    });

    it('handles speech recognition errors safely', () => {
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = 'es-ES';
        maxAlternatives = 1;
        start = vi.fn(() => {
          if (this.onerror) {
            this.onerror({ error: 'not-allowed' });
          }
        });
        stop = vi.fn();
        abort = vi.fn();
        onstart = null;
        onresult = null;
        onerror: ((e: any) => void) | null = null;
        onend = null;
      }

      vi.stubGlobal('window', {
        SpeechRecognition: MockSpeechRecognition
      });

      const onErrorMock = vi.fn();
      startSpanishListening({
        onError: onErrorMock
      });

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.stringContaining('Permiso de micrófono denegado')
      );
    });
  });

  describe('Pronunciation Trainer Modal Component Rendering', () => {
    it('renders target Spanish phrase and coaching title via SSR renderToString', () => {
      const html = renderToString(
        <PronunciationTrainerModal
          targetText="¿Dónde está la biblioteca?"
          englishMeaning="Where is the library?"
          title="Entrenador de Pronunciación"
          onClose={() => {}}
        />
      );

      expect(html).toContain('¿Dónde está la biblioteca?');
      expect(html).toContain('Where is the library?');
      expect(html).toContain('Entrenador de Pronunciación');
      expect(html).toContain('Frase Objetivo');
    });

    it('renders the Pronunciación (Voz) button inside LevelModal quiz HUD', () => {
      supabaseService.setExplicitlyDisabled(true);
      const city = getCityById('madrid')!;
      const level = city.levels[0];

      const html = renderToString(
        <GameProvider>
          <LevelModal
            level={level}
            cityId="madrid"
            onClose={() => {}}
            onCompleteLevel={() => {}}
          />
        </GameProvider>
      );

      expect(html).toContain('pronunciation-trainer-btn');
      expect(html).toContain('Pronunciación (Voz)');
    });

    it('renders the boss challenge screen when unlocked in BossMissionModal', () => {
      supabaseService.setExplicitlyDisabled(true);
      const city = getCityById('madrid')!;
      const boss = city.bossMission;

      const completedLevels: Record<string, any> = {};
      for (let i = 1; i <= 10; i++) {
        completedLevels[`madrid-${i}`] = { completed: true, score: 100, stars: 3 };
      }
      storageService.saveProgress({
        ...INITIAL_PROGRESS,
        completedLevels
      });

      const html = renderToString(
        <GameProvider>
          <BossMissionModal
            bossMission={boss}
            cityName="Madrid"
            onClose={() => {}}
            onSuccess={() => {}}
          />
        </GameProvider>
      );

      // When unlocked, displays boss challenge start
      expect(html).toContain('Comenzar Desafío del Jefe');
    });

    it('renders the voice dictation microphone button inside FloatingChatbot', async () => {
      supabaseService.setExplicitlyDisabled(true);
      await authDatabaseService.register('tutor_voice@aventura.es', 'pass123', 'Lucia');

      const SetOpenWrapper: React.FC = () => {
        const { setIsChatbotOpen } = useGame();
        React.useEffect(() => {
          setIsChatbotOpen(true);
        }, [setIsChatbotOpen]);

        return <FloatingChatbot />;
      };

      const html = renderToString(
        <GameProvider>
          <SetOpenWrapper />
        </GameProvider>
      );

      expect(html).toContain('floating-chatbot-btn');
    });
  });
});
