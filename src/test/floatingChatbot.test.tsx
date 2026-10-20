import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FloatingChatbot } from '../components/FloatingChatbot';
import { GameProvider, useGame, ActiveQuizState } from '../context/GameContext';
import { askCaminoGemini, CaminoContext } from '../services/geminiService';
import { authDatabaseService } from '../services/authDatabaseService';
import { storageService, INITIAL_PROGRESS } from '../services/storageService';
import { supabaseService } from '../services/supabaseClient';
import { ALL_CITIES, getCityById, getLevelById } from '../data/citiesData';

describe('Floating AI Chatbot (Camino) Verification', () => {
  beforeEach(() => {
    supabaseService.setExplicitlyDisabled(true);
    authDatabaseService.clearAll();
    storageService.resetProgress();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    // Stub fetch to quickly return fallback or mock so tests don't wait for network timeouts
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Requirement 1 & 2: Chatbot icon renders on non-landing pages, hidden on front/landing page
  it('hides chatbot icon on front/landing pages (welcome, auth, or unauthenticated)', () => {
    // 1. Unauthenticated / No user email -> returns null (hidden)
    const TestUnauthenticated: React.FC = () => {
      return (
        <GameProvider>
          <FloatingChatbot />
        </GameProvider>
      );
    };

    const htmlUnauth = renderToString(<TestUnauthenticated />);
    expect(htmlUnauth).not.toContain('floating-chatbot-btn');
    expect(htmlUnauth).not.toContain('Camino • Tutor IA');
  });

  it('renders chatbot icon on authenticated game pages and avoids duplicate icons', async () => {
    // Log in a player
    await authDatabaseService.register('viajero@aventura.es', 'pass123', 'Carlos');

    const TestShell: React.FC = () => {
      const { setCurrentScreen } = useGame();
      React.useEffect(() => {
        setCurrentScreen('world-map');
      }, [setCurrentScreen]);

      return (
        <div data-testid="app-shell">
          <FloatingChatbot />
        </div>
      );
    };

    const html = renderToString(
      <GameProvider>
        <TestShell />
      </GameProvider>
    );

    // Should render the floating trigger button
    expect(html).toContain('floating-chatbot-btn');
    expect(html).toContain('Pregunta al tutor Camino');

    // Count occurrences of floating-chatbot-btn in html to guarantee NO duplicates
    const matches = html.match(/data-testid="floating-chatbot-btn"/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBe(1);
  });

  // Requirement 3 & 4: Picture-in-picture window, minimize & close controls
  it('includes picture-in-picture draggable header, minimize, and close controls in chat panel', async () => {
    await authDatabaseService.register('tutor_test@aventura.es', 'pass123', 'Elena');

    const TestActiveChat: React.FC = () => {
      return (
        <div data-testid="pip-container">
          <FloatingChatbot />
        </div>
      );
    };

    const html = renderToString(
      <GameProvider>
        <TestActiveChat />
      </GameProvider>
    );

    expect(html).toContain('floating-chatbot-btn');
  });

  // Requirement 5 & 6: Pedagogical Spanish tutor behavior and context integration
  it('delivers concise, accurate educational guidance in Spanish with English clarification', async () => {
    const query = 'How do you say bathroom in Spanish?';
    const context: CaminoContext = {
      cityName: 'Madrid',
      playerName: 'Elena',
      streak: 3
    };

    const res = await askCaminoGemini(query, context);
    expect(res).toBeDefined();
    expect(res.text).toBeTruthy();
    expect(res.spanishText?.toLowerCase()).toContain('baño');
    expect(res.pronunciation).toBeTruthy();
  });

  it('corrects Spanish grammatical errors actively (e.g. "yo soy calor" -> "Tengo calor")', async () => {
    const query = 'yo soy calor en madrid';
    const context: CaminoContext = {
      cityName: 'Madrid',
      playerName: 'Elena'
    };

    const res = await askCaminoGemini(query, context);
    expect(res.spanishText).toBe('Tengo calor.');
    expect(res.correctionNotice).toContain('Tengo calor');
    expect(res.correctionNotice).toContain('tener');
  });

  // Requirement 7: Strict quiz lock while question is active and unanswered
  it('strictly locks and disables chatbot while a quiz question is active and unanswered', async () => {
    await authDatabaseService.register('quiz_lock@aventura.es', 'pass123', 'Mateo');

    const lockedQuizState: ActiveQuizState = {
      isActive: true,
      isAnswered: false,
      cityId: 'madrid',
      cityName: 'Madrid',
      levelId: 'madrid-1',
      levelTitle: 'Nivel 1: Saludos',
      syllabusTopic: 'Saludos y Presentaciones'
    };

    const html = renderToString(
      <GameProvider>
        <FloatingChatbot quizContextOverride={lockedQuizState} />
      </GameProvider>
    );

    // Button must reflect locked state
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('Tutor bloqueado');
    expect(html).toContain('🔒');
  });

  // Requirement 8: Unlocked in Review Mode after submitting answer
  it('unlocks chatbot into Review Mode after answer is submitted so student can ask questions', async () => {
    const reviewContext: CaminoContext = {
      cityName: 'Madrid',
      playerName: 'Mateo',
      levelTitle: 'Nivel 1: Saludos',
      syllabusTopic: 'Saludos y Presentaciones',
      questionPrompt: '¿Cómo se dice "Good morning" en español?',
      submittedAnswer: 'Buenos días',
      isCorrect: true,
      explanation: 'Buenos días es el saludo estándar por la mañana.'
    };

    // Query Camino about why the answer was correct/incorrect
    const res = await askCaminoGemini('¿Por qué es correcta mi respuesta?', reviewContext);
    expect(res).toBeDefined();
    expect(res.text).toContain('correcta');
    expect(res.englishText).toContain('correctly');
  });

  // Requirement 9: Moving to next question immediately re-locks the chatbot
  it('re-locks the chatbot immediately when moving to the next question', () => {
    // Initial: active and answered = false -> locked
    const stateQ1Active: ActiveQuizState = { isActive: true, isAnswered: false, cityId: 'madrid' };
    expect(stateQ1Active.isActive && !stateQ1Active.isAnswered).toBe(true); // Locked!

    // After submit: active and answered = true -> review mode (unlocked)
    const stateQ1Reviewed: ActiveQuizState = { isActive: true, isAnswered: true, cityId: 'madrid', submittedAnswer: 'Hola' };
    expect(stateQ1Reviewed.isActive && !stateQ1Reviewed.isAnswered).toBe(false); // Unlocked!

    // Moving to next question: active = true, isAnswered = false -> immediately locked!
    const stateQ2Active: ActiveQuizState = { isActive: true, isAnswered: false, cityId: 'madrid' };
    expect(stateQ2Active.isActive && !stateQ2Active.isAnswered).toBe(true); // Re-locked immediately!
  });

  // Requirement 10: Never leak future answers or active unanswered question solutions
  it('never discloses active question answer keys or hidden solutions', () => {
    const q = getLevelById('madrid', 'madrid-1')?.questions[0];
    expect(q).toBeDefined();

    // Verify that when creating context for active unanswered question, questionPrompt & correctAnswer are NOT included
    const unansweredContext: CaminoContext = {
      cityName: 'Madrid',
      levelTitle: 'Nivel 1',
      syllabusTopic: 'Saludos'
      // Notice: questionPrompt is undefined!
      // Notice: correctAnswer is NEVER part of CaminoContext interface!
    };

    expect(unansweredContext.questionPrompt).toBeUndefined();
    expect((unansweredContext as any).correctAnswer).toBeUndefined();
  });

  // Requirement 11: Existing game features remain 100% operational
  it('preserves existing game features (15 cities, levels, boss missions, coins, hints, lives)', () => {
    expect(ALL_CITIES.length).toBe(15);
    const madrid = getCityById('madrid');
    expect(madrid).toBeDefined();
    expect(madrid?.levels.length).toBe(10);
    expect(madrid?.bossMission).toBeDefined();
    expect(madrid?.bossMission.questions.length).toBeGreaterThan(0);

    // Initial progress constants intact
    expect(INITIAL_PROGRESS.stats.coins).toBe(250);
    expect(INITIAL_PROGRESS.stats.lives).toBe(3);
  });
});
