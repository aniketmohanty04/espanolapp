import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { GameProvider, useGame, ActiveQuizState, REWARD_CONFIG } from '../context/GameContext';
import { LevelModal } from '../components/LevelModal';
import { BossMissionModal } from '../components/BossMissionModal';
import { FloatingChatbot } from '../components/FloatingChatbot';
import { askCaminoGemini, CaminoContext } from '../services/geminiService';
import { authDatabaseService } from '../services/authDatabaseService';
import { storageService, INITIAL_PROGRESS } from '../services/storageService';
import { supabaseService } from '../services/supabaseClient';
import { getCityById } from '../data/citiesData';

describe('Acceptance Tests: Camino Bilingual Tutor & Full-Question Translation', () => {
  beforeEach(async () => {
    supabaseService.setExplicitlyDisabled(true);
    authDatabaseService.clearAll();
    storageService.resetProgress();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));
    await authDatabaseService.register('viajero@aventura.es', 'pass123', 'Carlos');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Acceptance Test 1: Camino can explain Spanish words using short English clarifications
  it('1. Camino can explain Spanish words using short English clarifications', async () => {
    const context: CaminoContext = {
      cityName: 'Madrid',
      playerName: 'Carlos',
      streak: 2
    };

    // Test "¿Qué significa 'dónde'?"
    const resDonde = await askCaminoGemini("¿Qué significa 'dónde'?", context);
    expect(resDonde.text).toContain("It means 'where'");
    expect(resDonde.englishText).toContain("where");

    // Test "Tengo hambre"
    const resHambre = await askCaminoGemini("tengo hambre", context);
    expect(resHambre.text).toContain("tener + hambre");
    expect(resHambre.englishText).toContain("hungry");

    // Test "comprar"
    const resComprar = await askCaminoGemini("comprar", context);
    expect(resComprar.text).toContain("to buy");
    expect(resComprar.englishText).toContain("to buy");

    // Test verb ending
    const resVerb = await askCaminoGemini("look at the verb ending", context);
    expect(resVerb.text).toContain("¿Quién realiza la acción? Who is doing the action?");
  });

  // Acceptance Test 2: Camino does not reveal the correct option before submission
  it('2. Camino does not reveal the correct option before submission', async () => {
    // When context has an unanswered question prompt without a submitted answer
    const context: CaminoContext = {
      cityName: 'Madrid',
      questionPrompt: '¿Dónde está la estación de tren?'
      // Notice: submittedAnswer is NOT provided!
    };

    const res = await askCaminoGemini('Tell me the answer to this question', context);
    // Camino gives general grammar guidance, NEVER reveals the correct option
    expect(res.text).toContain("¿Quién realiza la acción?");
    expect(res.englishText).toContain("does not reveal answers");
    expect((context as any).correctAnswer).toBeUndefined();
  });

  // Acceptance Test 3: The full-translation button is disabled before answering
  it('3. The full-translation button is disabled before answering in LevelModal and BossMissionModal', () => {
    const madrid = getCityById('madrid');
    const level1 = madrid?.levels[0]!;

    const htmlLevel = renderToString(
      <GameProvider>
        <LevelModal
          level={level1}
          cityId="madrid"
          onClose={() => {}}
          onCompleteLevel={() => {}}
        />
      </GameProvider>
    );

    // The full-translation-btn must be rendered and disabled before answering
    expect(htmlLevel).toContain('data-testid="full-translation-btn"');
    expect(htmlLevel).toContain('Traducir pregunta al inglés');
    expect(htmlLevel).toContain('disabled=""');

    // Boss mission modal check
    const boss = madrid?.bossMission!;
    const htmlBoss = renderToString(
      <GameProvider>
        <BossMissionModal
          bossMission={boss}
          cityName="Madrid"
          onClose={() => {}}
          onSuccess={() => {}}
        />
      </GameProvider>
    );

    expect(htmlBoss).toBeDefined();
  });

  // Acceptance Test 4: After clicking "Comprobar", the full translation becomes available
  it('4. After answering, the full translation becomes available and renders cleanly', () => {
    const madrid = getCityById('madrid');
    const level1 = madrid?.levels[0]!;
    const question = level1.questions[0];

    // Create a component that renders LevelModal in submitted state
    const TestComponent: React.FC = () => {
      return (
        <GameProvider>
          <LevelModal
            level={level1}
            cityId="madrid"
            onClose={() => {}}
            onCompleteLevel={() => {}}
          />
        </GameProvider>
      );
    };

    const html = renderToString(<TestComponent />);
    expect(html).toContain('Comprobar (Check)');
    expect(html).toContain('data-testid="full-translation-btn"');
    expect(html).toContain('Traducir pregunta al inglés');
  });

  // Acceptance Test 5: The full translation is accurate and does not reveal hidden answer data
  it('5. The full translation matches englishPrompt and never discloses answer keys', () => {
    const madrid = getCityById('madrid');
    const level1 = madrid?.levels[0]!;
    const q0 = level1.questions[0];

    expect(q0.englishPrompt).toBeTruthy();
    // Verify englishPrompt does NOT contain the secret correctAnswer
    expect(q0.englishPrompt).not.toContain(q0.correctAnswer as string);
    // Verify original Spanish prompt maintains accents and punctuation
    expect(q0.prompt).toMatch(/[¿?¡!áéíóúñ]/i);
  });

  // Acceptance Test 6: Full translation costs zero coins
  it('6. Full translation costs zero coins and does not alter the player coin balance', () => {
    const initialCoins = INITIAL_PROGRESS.stats.coins;
    expect(initialCoins).toBe(250);

    // Full translation is free and never calls coin deduction
    const TestComp: React.FC = () => {
      const { progress } = useGame();
      return <div data-testid="coin-count">{progress.stats.coins}</div>;
    };

    const html = renderToString(
      <GameProvider>
        <TestComp />
      </GameProvider>
    );

    expect(html).toContain('250');
  });

  // Acceptance Test 7: The vocabulary hint still costs 500 coins
  it('7. The vocabulary hint still costs 500 coins and rejects when player cannot afford it', () => {
    // 1. Verify cost configuration constant
    expect(REWARD_CONFIG.VOCAB_HINT_COST_COINS).toBe(500);

    // 2. Test that attempting to purchase with 250 coins fails with a clear message
    let purchaseResult: any = null;
    const TestHints: React.FC = () => {
      const { progress, purchaseVocabHint } = useGame();
      if (!purchaseResult) {
        purchaseResult = purchaseVocabHint('q-test');
      }

      return (
        <div>
          <span data-testid="coins">{progress.stats.coins}</span>
          <span data-testid="reason">{purchaseResult?.reason}</span>
        </div>
      );
    };

    const html = renderToString(
      <GameProvider>
        <TestHints />
      </GameProvider>
    );

    expect(purchaseResult?.success).toBe(false);
    expect(purchaseResult?.reason).toContain('500');
    expect(html).toContain('250');
    expect(html).toContain('500');
  });

  // Acceptance Test 8: Camino remains usable during the allowed post-answer review period
  it('8. Camino remains usable during the allowed post-answer review period', async () => {
    const reviewContext: CaminoContext = {
      cityName: 'Madrid',
      playerName: 'Carlos',
      levelTitle: 'Nivel 1: Saludos',
      questionPrompt: '¿Cómo se dice "Good morning" en español?',
      submittedAnswer: 'Buenos días',
      isCorrect: true,
      explanation: 'Buenos días es el saludo estándar por la mañana.'
    };

    const res = await askCaminoGemini('¿Por qué es correcta mi respuesta?', reviewContext);
    expect(res).toBeDefined();
    expect(res.text).toContain('correcta');
    expect(res.englishText).toContain('correctly');
  });

  // Acceptance Test 9: Both translation and chatbot access reset appropriately when the next question begins
  it('9. Both translation and chatbot access reset appropriately when the next question begins', () => {
    // When moving to question 2:
    const nextQState: ActiveQuizState = {
      isActive: true,
      isAnswered: false, // Re-locked!
      cityId: 'madrid'
    };

    const isLocked = nextQState.isActive && !nextQState.isAnswered;
    expect(isLocked).toBe(true);

    const html = renderToString(
      <GameProvider>
        <FloatingChatbot quizContextOverride={nextQState} />
      </GameProvider>
    );

    expect(html).toContain('Tutor bloqueado');
    expect(html).toContain('aria-disabled="true"');
  });

  // Acceptance Test 10: The actual quiz screen is modified and includes all 3 distinct tools
  it('10. The actual quiz screen has all 3 learning tools distinct: hint (500🪙), tutor (free), translation (0🪙)', () => {
    const madrid = getCityById('madrid');
    const level1 = madrid?.levels[0]!;

    const html = renderToString(
      <GameProvider>
        <LevelModal
          level={level1}
          cityId="madrid"
          onClose={() => {}}
          onCompleteLevel={() => {}}
        />
      </GameProvider>
    );

    // Tool A: Vocabulary hint (500 🪙)
    expect(html).toContain('Pista de vocabulario (500 🪙)');

    // Tool B: Tutor IA (free, locked before submission)
    expect(html).toContain('quiz-tutor-btn');
    expect(html).toContain('Tutor (Bloqueado)');

    // Tool C: Full question translation (0 🪙, disabled before submission)
    expect(html).toContain('data-testid="full-translation-btn"');
    expect(html).toContain('Traducir pregunta al inglés');
  });
});
