import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveContextualMeaning, getQuestionVocabHints } from '../utils/vocabHintHelper';
import { askCaminoGemini, CaminoContext, setGeminiApiKey } from '../services/geminiService';
import { ALL_CITIES } from '../data/citiesData';
import { Question } from '../types';

describe('Context-Aware Vocabulary, Camino Tutor & English Translation Suite', () => {
  beforeEach(() => {
    setGeminiApiKey(null);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline test mode')));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. resolveContextualMeaning — All Polysemic Words & Exact User Examples', () => {
    it('resolves "mañana" contextually without alternative slashes', () => {
      // User example 1: "¿Qué vas a hacer mañana?" -> mañana = tomorrow
      expect(resolveContextualMeaning('mañana', '¿Qué vas a hacer mañana?')).toBe('tomorrow');
      expect(resolveContextualMeaning('mañana', 'Mañana voy al museo.')).toBe('tomorrow');
      expect(resolveContextualMeaning('mañana', 'Hasta mañana por la tarde.')).toBe('tomorrow');

      // User example 2: "Estudio por la mañana." -> mañana = morning
      expect(resolveContextualMeaning('mañana', 'Estudio por la mañana.')).toBe('morning');
      expect(resolveContextualMeaning('mañana', 'Por la mañana tomo café con leche.')).toBe('morning');
      expect(resolveContextualMeaning('mañana', 'Toda la mañana estuvo nublado.')).toBe('morning');

      // Ambiguity flag when context is insufficient
      expect(resolveContextualMeaning('mañana', '')).toBe('ambiguous: tomorrow or morning depending on context');
      expect(resolveContextualMeaning('mañana', 'mañana')).toBe('ambiguous: tomorrow or morning depending on context');
    });

    it('resolves "frío" / "fría" contextually without alternative slashes', () => {
      // User example 3: "Tengo frío." -> frío = cold (feeling cold)
      expect(resolveContextualMeaning('frío', 'Tengo frío.')).toBe('cold (feeling cold)');
      expect(resolveContextualMeaning('frío', '¿Tienes frío tú también?')).toBe('cold (feeling cold)');

      // User example 4: "La comida está fría." -> fría = cold (the food's temperature)
      expect(resolveContextualMeaning('fría', 'La comida está fría.')).toBe("cold (the food's temperature)");
      expect(resolveContextualMeaning('frío', 'El café está frío.')).toBe("cold (the food's temperature)");
      expect(resolveContextualMeaning('fría', 'Una botella de agua fría.')).toBe("cold (the food's temperature)");

      // Weather usage
      expect(resolveContextualMeaning('frío', 'Hoy hace mucho frío.')).toBe('cold (weather)');

      // Ambiguity flag when context is insufficient
      expect(resolveContextualMeaning('frío', '')).toBe('ambiguous: feeling cold or temperature depending on context');
    });

    it('resolves "llevo" / "llevar" contextually without alternative slashes', () => {
      // User example 5: "Llevo una chaqueta." -> llevo = I am wearing
      expect(resolveContextualMeaning('llevo', 'Llevo una chaqueta.')).toBe('I am wearing');
      expect(resolveContextualMeaning('llevo', 'Llevo unos pantalones negros.')).toBe('I am wearing');

      // User example 6: "Llevo dos horas aquí." -> llevo = I have been
      expect(resolveContextualMeaning('llevo', 'Llevo dos horas aquí.')).toBe('I have been');
      expect(resolveContextualMeaning('llevo', 'Llevo tres días en Madrid.')).toBe('I have been');

      // Takeaway and carrying objects
      expect(resolveContextualMeaning('llevar', 'Un café para llevar.')).toBe('for takeaway');
      expect(resolveContextualMeaning('llevo', 'Llevo la maleta al hotel.')).toBe('I carry');

      // Ambiguity flag
      expect(resolveContextualMeaning('llevo', '')).toBe('ambiguous: wearing, duration, or carrying depending on context');
    });

    it('resolves "tiempo" contextually without alternative slashes', () => {
      // Weather usage
      expect(resolveContextualMeaning('tiempo', 'Hace buen tiempo en Sevilla.')).toBe('weather');
      expect(resolveContextualMeaning('tiempo', '¿Qué tiempo hace hoy?')).toBe('weather');

      // Duration / availability usage
      expect(resolveContextualMeaning('tiempo', '¿Tienes tiempo para hablar?')).toBe('time');
      expect(resolveContextualMeaning('tiempo', 'No tengo mucho tiempo hoy.')).toBe('time');
      expect(resolveContextualMeaning('tiempo', 'Llegamos a tiempo.')).toBe('time');

      // Ambiguity flag
      expect(resolveContextualMeaning('tiempo', '')).toBe('ambiguous: weather or time depending on context');
    });

    it('resolves "cuenta" contextually without alternative slashes', () => {
      // Restaurant bill
      expect(resolveContextualMeaning('cuenta', 'La cuenta, por favor.')).toBe('bill');
      expect(resolveContextualMeaning('cuenta', 'Camarero, ¿nos trae la cuenta?')).toBe('bill');

      // Realize expression
      expect(resolveContextualMeaning('cuenta', 'Me doy cuenta de algo importante.')).toBe('realize');

      // Bank account
      expect(resolveContextualMeaning('cuenta', 'Tengo una cuenta bancaria en el banco.')).toBe('bank account');

      // Ambiguity flag
      expect(resolveContextualMeaning('cuenta', '')).toBe('ambiguous: bill, bank account, or realization depending on context');
    });

    it('resolves "carta" contextually without alternative slashes', () => {
      // Restaurant menu
      expect(resolveContextualMeaning('carta', 'La carta del restaurante tiene muchos platos.')).toBe('menu');
      expect(resolveContextualMeaning('carta', '¿Podemos ver la carta de postres?')).toBe('menu');

      // Written letter
      expect(resolveContextualMeaning('carta', 'Escribo una carta a mi amigo.')).toBe('letter');
      expect(resolveContextualMeaning('carta', 'Envié una carta postal por correo.')).toBe('letter');

      // Ambiguity flag
      expect(resolveContextualMeaning('carta', '')).toBe('ambiguous: menu or letter depending on context');
    });

    it('resolves "banco" contextually without alternative slashes', () => {
      // Park / square bench
      expect(resolveContextualMeaning('banco', 'El banco de la plaza es de madera.')).toBe('bench');
      expect(resolveContextualMeaning('banco', 'Nos sentamos en un banco del parque.')).toBe('bench');

      // Financial bank
      expect(resolveContextualMeaning('banco', 'El banco para sacar dinero abre a las ocho.')).toBe('bank');
      expect(resolveContextualMeaning('banco', 'Voy al banco a ingresar euros.')).toBe('bank');

      // Ambiguity flag
      expect(resolveContextualMeaning('banco', '')).toBe('ambiguous: bank or bench depending on context');
    });

    it('resolves "vino" contextually without alternative slashes', () => {
      // Wine beverage
      expect(resolveContextualMeaning('vino', 'Una copa de vino tinto.')).toBe('wine');
      expect(resolveContextualMeaning('vino', 'Me gusta tomar vino con la comida.')).toBe('wine');

      // Verb form "came" (past of venir)
      expect(resolveContextualMeaning('vino', 'Él vino ayer a visitarme.')).toBe('came');
      expect(resolveContextualMeaning('vino', 'Ella vino tarde a la reunión.')).toBe('came');

      // Ambiguity flag
      expect(resolveContextualMeaning('vino', '')).toBe('ambiguous: wine or came depending on context');
    });

    it('resolves "camino" contextually without alternative slashes', () => {
      // Verb form "I walk"
      expect(resolveContextualMeaning('camino', 'Camino por el parque todas las tardes.')).toBe('I walk');
      expect(resolveContextualMeaning('camino', 'Yo camino rápido.')).toBe('I walk');

      // Noun "path / trail"
      expect(resolveContextualMeaning('camino', 'El camino es largo pero hermoso.')).toBe('path');
      expect(resolveContextualMeaning('camino', 'Recorremos el Camino de Santiago.')).toBe('path');

      // Ambiguity flag
      expect(resolveContextualMeaning('camino', '')).toBe('ambiguous: path or I walk depending on context');
    });

    it('resolves "bajo" / "sobre" contextually without alternative slashes', () => {
      // bajo: under vs short
      expect(resolveContextualMeaning('bajo', 'Bajo la mesa está mi mochila.')).toBe('under');
      expect(resolveContextualMeaning('bajo', 'Un chico bajo de estatura.')).toBe('short');

      // sobre: on top of vs about vs envelope
      expect(resolveContextualMeaning('sobre', 'El libro está sobre la mesa.')).toBe('on top of');
      expect(resolveContextualMeaning('sobre', 'Un libro sobre España y su cultura.')).toBe('about');
      expect(resolveContextualMeaning('sobre', 'Un sobre para la carta con sello.')).toBe('envelope');
    });

    it('resolves "tomar", "derecho", "planta", "ordenar" and "nada" contextually', () => {
      // tomar: drink vs take transport
      expect(resolveContextualMeaning('tomar', 'Vamos a tomar un café con leche.')).toBe('to drink');
      expect(resolveContextualMeaning('tomar', 'Debes tomar el autobús número 5.')).toBe('to take');

      // derecho / derecha: direction vs straight ahead vs law
      expect(resolveContextualMeaning('derecha', 'Gira a la derecha en la plaza.')).toBe('right');
      expect(resolveContextualMeaning('derecho', 'Sigue derecho por esta calle.')).toBe('straight ahead');
      expect(resolveContextualMeaning('derecho', 'Estudio derecho en la universidad.')).toBe('law');

      // planta: floor vs botanical plant
      expect(resolveContextualMeaning('planta', 'La primera planta del hotel tiene terraza.')).toBe('floor');
      expect(resolveContextualMeaning('planta', 'Una planta verde en la ventana.')).toBe('plant');

      // ordenar: arrange vs order food
      expect(resolveContextualMeaning('ordena', 'Ordene las palabras en orden correcto.')).toBe('arrange');
      expect(resolveContextualMeaning('ordené', 'Ordené una paella de marisco.')).toBe('ordered');

      // nada: you are welcome vs nothing vs swims
      expect(resolveContextualMeaning('nada', 'De nada, un placer ayudarte.')).toBe('you are welcome');
      expect(resolveContextualMeaning('nada', 'No hay nada en la mesa.')).toBe('nothing');
      expect(resolveContextualMeaning('nada', 'Él nada en la piscina municipal.')).toBe('swims');
    });
  });

  describe('2. getQuestionVocabHints — Zero Slashes Guarantee Across All Game Questions', () => {
    it('extracts contextual hints without slashes for tomorrow vs morning questions', () => {
      const qTomorrow: Question = {
        id: 'test-q-tomorrow',
        type: 'multiple-choice',
        prompt: '¿Qué vas a hacer mañana por la tarde en el centro?',
        options: ['Voy al museo', 'Compro fruta', 'Estudio'],
        correctAnswer: 'Voy al museo',
        difficulty: 'easy',
        explanation: 'Explicación de prueba.',
        hints: ['Pista de prueba'],
        syllabusRef: 'TEST'
      };

      const hintsTomorrow = getQuestionVocabHints(qTomorrow);
      expect(hintsTomorrow.length).toBeGreaterThanOrEqual(2);
      expect(hintsTomorrow.length).toBeLessThanOrEqual(4);

      const mananaHint = hintsTomorrow.find(h => h.word.toLowerCase() === 'mañana');
      if (mananaHint) {
        expect(mananaHint.translation).toBe('tomorrow');
        expect(mananaHint.translation).not.toContain('/');
      }

      // Check that NO hint has a slash
      for (const h of hintsTomorrow) {
        expect(h.translation).not.toContain('/');
      }
    });

    it('extracts contextual hints without slashes for morning questions', () => {
      const qMorning: Question = {
        id: 'test-q-morning',
        type: 'multiple-choice',
        prompt: 'Estudio por la mañana antes de ir a clase.',
        options: ['Sí', 'No'],
        correctAnswer: 'Sí',
        difficulty: 'easy',
        explanation: 'Explicación de mañana.',
        hints: ['Pista de mañana'],
        syllabusRef: 'TEST'
      };

      const hintsMorning = getQuestionVocabHints(qMorning);
      const mananaHint = hintsMorning.find(h => h.word.toLowerCase() === 'mañana');
      if (mananaHint) {
        expect(mananaHint.translation).toBe('morning');
        expect(mananaHint.translation).not.toContain('/');
      }
    });

    it('guarantees that EVERY level question across all game cities produces zero slash alternatives', () => {
      let totalQuestionsTested = 0;

      for (const city of ALL_CITIES) {
        for (const level of city.levels) {
          for (const q of level.questions) {
            totalQuestionsTested++;
            const hints = getQuestionVocabHints(q);
            expect(hints.length).toBeGreaterThanOrEqual(2);
            expect(hints.length).toBeLessThanOrEqual(4);

            for (const h of hints) {
              expect(h.translation, `Hint "${h.word}" in question ${q.id} contains a slash: "${h.translation}"`).not.toContain('/');
            }
          }
        }

        // Test boss questions as well
        if (city.bossMission) {
          for (const q of city.bossMission.questions) {
            totalQuestionsTested++;
            const hints = getQuestionVocabHints(q);
            for (const h of hints) {
              expect(h.translation, `Boss hint "${h.word}" in ${q.id} contains a slash`).not.toContain('/');
            }
          }
        }
      }

      expect(totalQuestionsTested).toBeGreaterThan(100);
    });
  });

  describe('3. Camino Tutor AI Service — Context-Aware Fallback & Ambiguity Flagging', () => {
    it('answers "mañana = tomorrow" when question or query context is tomorrow', async () => {
      const res = await askCaminoGemini('What does mañana mean in "¿Qué vas a hacer mañana?"?');
      expect(res.source).toBe('fallback');
      expect(res.englishText).toContain('tomorrow');
      expect(res.text).toContain('tomorrow');
      expect(res.englishText).not.toContain('tomorrow / morning');
    });

    it('answers "mañana = morning" when question or query context is morning', async () => {
      const res = await askCaminoGemini('What does mañana mean in "Estudio por la mañana."?');
      expect(res.source).toBe('fallback');
      expect(res.englishText).toContain('morning');
      expect(res.text).toContain('morning');
      expect(res.englishText).not.toContain('tomorrow / morning');
    });

    it('flags genuine ambiguity when student asks about "mañana" with NO sentence context', async () => {
      const res = await askCaminoGemini('what does mañana mean?');
      expect(res.source).toBe('fallback');
      expect(res.englishText).toContain('Ambiguous without context');
      expect(res.text).toContain('dos significados');
    });

    it('explains "Tengo frío" as cold feeling and "La comida está fría" as food temperature', async () => {
      const resTengo = await askCaminoGemini('Explain "Tengo frío"');
      expect(resTengo.englishText).toContain('cold (feeling cold)');

      const resComida = await askCaminoGemini('What does fría mean in "La comida está fría"?');
      expect(resComida.englishText).toContain("cold (the food's temperature)");
    });

    it('explains "llevo una chaqueta" (wearing) vs "llevo dos horas aquí" (have been)', async () => {
      const resWearing = await askCaminoGemini('What does llevo mean in "Llevo una chaqueta"?');
      expect(resWearing.englishText).toContain('I am wearing');

      const resDuration = await askCaminoGemini('What does llevo mean in "Llevo dos horas aquí"?');
      expect(resDuration.englishText).toContain('I have been');
    });

    it('explains "Hace buen tiempo" (weather) vs "¿Tienes tiempo?" (time)', async () => {
      const resWeather = await askCaminoGemini('What does tiempo mean in "Hace buen tiempo"?');
      expect(resWeather.englishText).toContain('weather');

      const resTime = await askCaminoGemini('What does tiempo mean in "¿Tienes tiempo?"?');
      expect(resTime.englishText).toContain('time');
    });

    it('explains "La cuenta, por favor" (bill) vs "Me doy cuenta" (realize) vs "Cuenta bancaria" (account)', async () => {
      const resBill = await askCaminoGemini('What does cuenta mean in "La cuenta, por favor"?');
      expect(resBill.englishText).toContain('the bill');

      const resRealize = await askCaminoGemini('What does darse cuenta mean in "Me doy cuenta de algo"?');
      expect(resRealize.englishText).toContain('realize');

      const resBank = await askCaminoGemini('What does cuenta mean in "Tengo una cuenta bancaria"?');
      expect(resBank.englishText).toContain('bank account');
    });

    it('explains "vino" as wine vs came based on context', async () => {
      const resWine = await askCaminoGemini('What does vino mean in "Una copa de vino"?');
      expect(resWine.englishText).toContain('wine');

      const resCame = await askCaminoGemini('What does vino mean in "Él vino ayer"?');
      expect(resCame.englishText).toContain('came');
    });

    it('explains "camino" as I walk vs path based on context', async () => {
      const resWalk = await askCaminoGemini('What does camino mean in "Camino por el parque"?');
      expect(resWalk.englishText).toContain('I walk');

      const resPath = await askCaminoGemini('What does camino mean in "El camino es largo"?');
      expect(resPath.englishText).toContain('path');
    });

    it('never reveals the correct answer to an unanswered active question', async () => {
      const ctx: CaminoContext = {
        cityName: 'Madrid',
        questionPrompt: '¿Qué vas a hacer mañana?'
        // No submittedAnswer -> strictly locked before submission
      };

      const res = await askCaminoGemini('What is the correct answer to this question?', ctx);
      expect(res.englishText).toContain('does not reveal answers');
      expect(res.text).toContain('¿Quién realiza la acción?');
    });
  });
});
