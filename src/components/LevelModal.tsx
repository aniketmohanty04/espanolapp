import React, { useState, useEffect } from 'react';
import { useGame, useLifeCountdown, REWARD_CONFIG } from '../context/GameContext';
import { Level, Question, DialogueChoice } from '../types';
import { 
  SpanishWaiterIllustration, 
  SpanishGuideIllustration, 
  TravelerVictoryIllustration 
} from './GameCharacters';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  Coins, 
  Sparkles, 
  Star,
  Heart,
  Lightbulb,
  Pause,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatLifeTimer } from './OutOfLivesModal';

interface LevelModalProps {
  level: Level;
  cityId: string;
  onClose: () => void;
  onCompleteLevel: () => void;
}

export const LevelModal: React.FC<LevelModalProps> = ({
  level,
  cityId,
  onClose,
  onCompleteLevel
}) => {
  const { 
    progress, 
    recordQuestionResult, 
    recordDialogueCompleted, 
    purchaseTranslation, 
    recordLevelCompleted,
    refillLivesWithCoins
  } = useGame();
  const secondsUntilNextLife = useLifeCountdown();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [fillBlankInput, setFillBlankInput] = useState<string>('');
  const [constructedWords, setConstructedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  
  // Dialogue state
  const [dialogueChosenChoice, setDialogueChosenChoice] = useState<DialogueChoice | null>(null);

  // Status and feedback
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [translationUnlocked, setTranslationUnlocked] = useState<boolean>(false);
  const [showTranslateModal, setShowTranslateModal] = useState<boolean>(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Lives / hearts synchronized with game state (max 3)
  const lives = typeof progress.stats.lives === 'number' ? progress.stats.lives : 3;

  // Level completion
  const [correctFirstTries, setCorrectFirstTries] = useState<number>(0);
  const [isLevelFinished, setIsLevelFinished] = useState<boolean>(false);
  const [finalStars, setFinalStars] = useState<number>(3);

  const currentQuestion: Question = level.questions[currentIndex];

  // Decide which character illustration to show
  const isFoodOrCafe = level.syllabusTopic.includes('Comida') || 
                       level.syllabusTopic.includes('Bebidas') || 
                       level.description.toLowerCase().includes('café') || 
                       level.description.toLowerCase().includes('tapas') || 
                       currentQuestion.type === 'dialogue';

  // Initialize question state on index change
  useEffect(() => {
    setSelectedOption('');
    setFillBlankInput('');
    setHasSubmitted(false);
    setIsCorrect(false);
    setAttemptCount(0);
    setShowTranslateModal(false);
    setTranslateError(null);
    setDialogueChosenChoice(null);

    const alreadyPurchased = progress.purchasedTranslations.includes(currentQuestion.id);
    setTranslationUnlocked(alreadyPurchased);

    if (currentQuestion.type === 'word-order' && currentQuestion.sentencePieces) {
      setConstructedWords([]);
      setAvailableWords([...currentQuestion.sentencePieces]);
    }
  }, [currentIndex, currentQuestion.id]);

  // Word order handlers
  const addWordToConstructed = (word: string, index: number) => {
    if (hasSubmitted) return;
    setConstructedWords(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
  };

  const removeWordFromConstructed = (word: string, index: number) => {
    if (hasSubmitted) return;
    setConstructedWords(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev => [...prev, word]);
  };

  // Spanish accent keyboard insertion
  const insertAccent = (char: string) => {
    setFillBlankInput(prev => prev + char);
  };

  // Submit Answer Check
  const handleCheckAnswer = () => {
    if (hasSubmitted) return;

    let userVal = '';
    if (currentQuestion.type === 'multiple-choice') {
      userVal = selectedOption;
    } else if (currentQuestion.type === 'fill-blank') {
      userVal = fillBlankInput.trim();
    } else if (currentQuestion.type === 'word-order') {
      userVal = constructedWords.join(' ').trim();
    } else if (currentQuestion.type === 'dialogue') {
      userVal = dialogueChosenChoice?.text || selectedOption;
    }

    if (!userVal) return;

    let correct = false;
    if (Array.isArray(currentQuestion.correctAnswer)) {
      correct = currentQuestion.correctAnswer.some(
        a => a.toLowerCase().trim() === userVal.toLowerCase().trim()
      );
    } else {
      correct = currentQuestion.correctAnswer.toLowerCase().trim() === userVal.toLowerCase().trim();
    }

    setHasSubmitted(true);
    setIsCorrect(correct);
    const isFirstTry = attemptCount === 0;

    recordQuestionResult(currentQuestion, cityId, level.id, correct, isFirstTry);

    if (correct) {
      if (isFirstTry) {
        setCorrectFirstTries(prev => prev + 1);
      }
      if (currentQuestion.type === 'dialogue') {
        recordDialogueCompleted(currentQuestion.id);
      }
    } else {
      setAttemptCount(prev => prev + 1);
    }
  };

  // Move to next question or complete level
  const handleNextQuestion = () => {
    if (currentIndex + 1 < level.questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Level Finished! (Panel 11)
      const totalQ = level.questions.length;
      const scorePercent = Math.round((correctFirstTries / totalQ) * 100);
      const stars = scorePercent >= 90 ? 3 : scorePercent >= 70 ? 2 : 1;
      setFinalStars(stars);
      setIsLevelFinished(true);

      recordLevelCompleted(cityId, level.id, scorePercent, scorePercent === 100);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }
    }
  };

  // Purchase Translation (Panel 10)
  const handlePurchaseTranslation = () => {
    const res = purchaseTranslation(currentQuestion.id);
    if (res.success) {
      setTranslationUnlocked(true);
      setShowTranslateModal(false);
      setTranslateError(null);
    } else {
      setTranslateError(res.reason || 'No tienes suficientes monedas.');
    }
  };

  // Fill in the blank word bank options
  const wordBankOptions = currentQuestion.options || ['en', 'a', 'de', 'con'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      
      {/* ========================================================
          LEVEL FINISHED SCREEN (PANEL 11)
          ======================================================== */}
      {isLevelFinished ? (
        <div className="relative w-full max-w-xl bg-[#FAF7F2] border-4 border-amber-400 rounded-3xl shadow-2xl p-6 sm:p-8 text-center my-auto overflow-hidden animate-slideUp text-[#24140E]">
          
          {/* Fireworks Glow Background */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-rose-500/10 via-amber-500/10 to-transparent pointer-events-none" />
          <div className="absolute top-10 left-10 w-40 h-40 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-10 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Red Banner Ribbon: ¡Nivel Completado! (Panel 11) */}
          <div className="relative inline-block mb-3">
            <div className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white font-black text-lg sm:text-2xl shadow-xl border-2 border-amber-300 uppercase tracking-wider glow-gold flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>¡Nivel Completado!</span>
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#6B584D] font-bold mb-4">
            {level.title} • {level.subtitle}
          </p>

          {/* Center Area: Cheering Traveler Hero + 3 Gold Stars (Panel 11) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-2">
            
            {/* Victory Traveler Hero Illustration */}
            <TravelerVictoryIllustration 
              character={progress.profile?.character}
              size={180}
              className="hover:scale-105 transition-transform"
            />

            {/* 3 Large Golden Stars Display (Panel 11) */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map(s => (
                  <div key={s} className="relative">
                    <Star
                      className={`w-12 h-12 sm:w-14 sm:h-14 transition-all duration-500 ${
                        s <= finalStars
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(255,196,0,0.8)] scale-110'
                          : 'text-stone-300 fill-stone-200'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Reward Golden Card (Panel 11) */}
              <div className="p-4 rounded-2xl bg-white border-2 border-amber-400/80 shadow-md min-w-[200px] space-y-2">
                <div className="flex items-center justify-center space-x-2 text-base font-black text-[#B45309]">
                  <Coins className="w-5 h-5 text-[#E05615] fill-amber-400" />
                  <span>+{level.coinReward} Monedas</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm font-bold text-sky-800">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>+{level.xpReward} XP</span>
                </div>
              </div>
            </div>

          </div>

          {/* Green Continue Button (Panel 11) */}
          <div className="mt-6 pt-2">
            <button
              onClick={() => {
                onCompleteLevel();
                onClose();
              }}
              className="w-full sm:w-72 py-4 px-8 rounded-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:to-green-500 text-white font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-emerald-400 glow-gold mx-auto flex items-center justify-center space-x-2"
            >
              <span>Continuar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      ) : (
        /* ========================================================
            GAMEPLAY SCREENS: CONVERSATION MCQ & FILL-IN-THE-BLANK (PANELS 8 & 9)
            ======================================================== */
        <div className="relative w-full max-w-4xl border-4 border-amber-300 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col bg-[#FAF7F2] text-[#24140E]" style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,248,238,0.92), rgba(250,247,242,0.96)), url(/game-art/spanish-cafe.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          
          {/* Top Game HUD Bar (Panels 8 & 9) */}
          <div className="px-4 sm:px-6 py-3 bg-white/95 border-b-2 border-[#EADFCF] flex items-center justify-between backdrop-blur-md">
            
            {/* Left: 3 Red Hearts / Lives (Panels 8 & 9) */}
            <div className="flex items-center space-x-1.5" title="Vidas restantes">
              {[1, 2, 3].map(h => (
                <Heart
                  key={h}
                  className={`w-6 h-6 transition-all ${
                    h <= lives
                      ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse'
                      : 'text-stone-300 fill-stone-200'
                  }`}
                />
              ))}
            </div>

            {/* Question Progress Pill */}
            <div className="px-3.5 py-1 rounded-full bg-[#FFF8EE] border border-amber-300 text-xs font-black text-[#B45309]">
              Pregunta {currentIndex + 1} de {level.questions.length}
            </div>

            {/* Right: Coins Counter & Pause Button (Panels 8 & 9) */}
            <div className="flex items-center space-x-2.5">
              <div className="flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-white border border-[#EADFCF] text-[#B45309] font-black text-xs sm:text-sm shadow-xs">
                <Coins className="w-4 h-4 text-[#E05615] fill-amber-400/30" />
                <span>{progress.stats.coins.toLocaleString()}</span>
              </div>

              {/* Pause / Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] hover:text-[#24140E] border border-[#E0D5C7] transition-colors"
                title="Pausar o salir"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar under HUD */}
          <div className="w-full bg-[#EADFCF] h-1.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#E05615] to-[#F3B33D] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / level.questions.length) * 100}%` }}
            />
          </div>

          {/* Main Gameplay Arena: Character on Left, Interactive Question on Right */}
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* LEFT SIDE: Authentic Illustrated Spanish Character (Panels 8 & 9) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative">
              
              {/* Comic Speech Bubble (Panels 8 & 9) */}
              <div className="relative mb-3 max-w-[260px] p-3.5 rounded-2xl bg-white text-[#24140E] font-black text-sm sm:text-base shadow-md border-2 border-[#EADFCF] text-center animate-fadeIn">
                <div className="flex items-center justify-center space-x-1.5 mb-1">
                  <span className="text-[11px] font-black text-[#B45309] uppercase tracking-wider">
                    {currentQuestion.dialogue?.npcName || (isFoodOrCafe ? 'Camarero Español' : 'Guía Sofía')}
                  </span>
                </div>

                <p className="leading-snug">
                  "{currentQuestion.dialogue?.prompt || currentQuestion.prompt}"
                </p>

                {/* Speech Bubble Arrow pointing to character */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
              </div>

              {/* Character Illustration */}
              {isFoodOrCafe ? (
                <SpanishWaiterIllustration size={230} />
              ) : (
                <SpanishGuideIllustration size={230} />
              )}

              {/* Need Help / Translate Button (Panel 10 trigger) */}
              <button
                onClick={() => setShowTranslateModal(true)}
                className="mt-2 flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-[#FFF8EE] hover:bg-[#FFEEDC] text-[#B45309] text-xs font-black border border-amber-300 transition-all hover:scale-105 shadow-xs"
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#E05615]" />
                <span>¿Necesitas ayuda? (Traducir)</span>
              </button>
            </div>

            {/* RIGHT SIDE: Interactive Question Area (Panels 8 & 9) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              
              {/* Question Modality 1: Multiple Choice (Panel 8) */}
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    const isSelected = selectedOption === option;
                    const isAnswer = hasSubmitted && option === currentQuestion.correctAnswer;
                    const isWrongSelection = hasSubmitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={idx}
                        disabled={hasSubmitted}
                        onClick={() => setSelectedOption(option)}
                        className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between shadow-xs active:scale-98 ${
                          isAnswer
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs'
                            : isWrongSelection
                            ? 'bg-rose-50 border-rose-500 text-rose-950'
                            : isSelected
                            ? 'bg-amber-50/80 border-[#E05615] text-[#24140E] shadow-xs font-bold'
                            : 'bg-white hover:bg-[#FFFDF9] border-[#E8DFD5] hover:border-amber-400 text-[#24140E]'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          {/* Circular Letter Badge */}
                          <div className={`w-9 h-9 rounded-full font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${
                            isAnswer
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-[#E05615] text-white'
                              : 'bg-[#FAF7F2] text-[#B45309] border border-[#E0D5C7]'
                          }`}>
                            {letter}
                          </div>
                          <span className="leading-tight">{option}</span>
                        </div>

                        {/* Green checkmark on correct */}
                        {isAnswer && (
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow font-black text-base shrink-0">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Question Modality 2: Fill in the Blank (Panel 9) */}
              {currentQuestion.type === 'fill-blank' && (
                <div className="space-y-4">
                  {/* Sentence Card with Highlighted Blank (Panel 9) */}
                  <div className="p-5 rounded-2xl bg-white border-2 border-[#EADFCF] shadow-xs text-center">
                    <span className="text-xs font-black text-[#7A6B60] uppercase tracking-wider block mb-2">
                      Completa la frase seleccionando o escribiendo:
                    </span>
                    <div className="text-lg sm:text-xl font-black text-[#24140E] flex flex-wrap items-center justify-center gap-2">
                      <span>{currentQuestion.prompt.split('______')[0] || 'Está'}</span>
                      <span className="px-4 py-1 rounded-xl bg-[#FFF8EE] border-2 border-amber-400 text-[#B45309] font-mono text-lg min-w-[90px] inline-block shadow-inner">
                        {fillBlankInput || '_____'}
                      </span>
                      <span>{currentQuestion.prompt.split('______')[1] || 'la derecha.'}</span>
                    </div>
                  </div>

                  {/* Word Bank Chips (Panel 9: [ en ] [ a ] [ de ] [ con ]) */}
                  {!hasSubmitted && (
                    <div className="space-y-2">
                      <span className="text-xs font-black text-[#B45309] uppercase tracking-wider">
                        Banco de Palabras (toca una opción):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {wordBankOptions.map((word, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFillBlankInput(word)}
                            className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-xs active:scale-95 border-2 ${
                              fillBlankInput === word
                                ? 'bg-[#F3B33D] text-[#24140E] border-[#E05615]'
                                : 'bg-white hover:bg-[#F2ECE1] text-[#24140E] border-[#E0D5C7]'
                            }`}
                          >
                            {word}
                          </button>
                        ))}
                      </div>

                      {/* Spanish Accent Bar */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="text-xs text-[#7A6B60] mr-1 font-semibold">Tildes:</span>
                        {['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'].map(char => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => insertAccent(char)}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-[#F2ECE1] text-[#24140E] font-bold text-xs border border-[#E0D5C7] transition-all shadow-xs"
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Question Modality 3: Word Ordering */}
              {currentQuestion.type === 'word-order' && (
                <div className="space-y-3">
                  <div className="min-h-[70px] p-4 rounded-2xl bg-white border-2 border-dashed border-[#EADFCF] flex flex-wrap items-center gap-2">
                    {constructedWords.length === 0 ? (
                      <span className="text-xs text-[#7A6B60] italic">
                        Pulsa sobre las palabras para ordenar la frase...
                      </span>
                    ) : (
                      constructedWords.map((word, idx) => (
                        <button
                          key={`c-${idx}`}
                          disabled={hasSubmitted}
                          onClick={() => removeWordFromConstructed(word, idx)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#F3B33D] text-[#24140E] font-black text-sm shadow hover:bg-[#F5BA31] transition-colors"
                        >
                          {word} ✕
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {availableWords.map((word, idx) => (
                      <button
                        key={`a-${idx}`}
                        disabled={hasSubmitted}
                        onClick={() => addWordToConstructed(word, idx)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#24140E] font-bold text-sm border border-[#E0D5C7] shadow-xs active:scale-95 transition-all"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Modality 4: Interactive Dialogue Choices */}
              {currentQuestion.type === 'dialogue' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-[#E05615]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#B45309]">
                      Elige tu respuesta en español:
                    </span>
                  </div>

                  {/* Dialogue Choices list */}
                  <div className="space-y-2.5">
                    {(currentQuestion.dialogue?.choices || (currentQuestion.options ? currentQuestion.options.map((opt, i): DialogueChoice => ({
                      id: `choice-${i}`,
                      text: opt,
                      isCorrect: opt === currentQuestion.correctAnswer,
                      npcResponse: opt === currentQuestion.correctAnswer ? '¡Excelente!' : 'Respuesta incorrecta.',
                      explanation: currentQuestion.explanation
                    })) : [])).map((choice, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = selectedOption === choice.text || dialogueChosenChoice?.id === choice.id;
                      const isAnswer = hasSubmitted && choice.isCorrect;
                      const isWrongSelection = hasSubmitted && isSelected && !choice.isCorrect;

                      return (
                        <button
                          key={choice.id || idx}
                          disabled={hasSubmitted}
                          onClick={() => {
                            setDialogueChosenChoice(choice);
                            setSelectedOption(choice.text);
                          }}
                          className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between shadow-xs active:scale-98 ${
                            isAnswer
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs'
                              : isWrongSelection
                              ? 'bg-rose-50 border-rose-500 text-rose-950'
                              : isSelected
                              ? 'bg-amber-50/80 border-[#E05615] text-[#24140E] shadow-xs font-bold'
                              : 'bg-white hover:bg-[#FFFDF9] border-[#E8DFD5] hover:border-amber-400 text-[#24140E]'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className={`w-9 h-9 rounded-full font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${
                              isAnswer
                                ? 'bg-emerald-600 text-white'
                                : isSelected
                                ? 'bg-[#E05615] text-white'
                                : 'bg-[#FAF7F2] text-[#B45309] border border-[#E0D5C7]'
                            }`}>
                              {letter}
                            </div>
                            <div>
                              <span className="leading-tight block">{choice.text}</span>
                              {translationUnlocked && choice.englishHint && (
                                <span className="text-xs text-[#7A6B60] italic font-normal block mt-0.5">
                                  "{choice.englishHint}"
                                </span>
                              )}
                            </div>
                          </div>

                          {isAnswer && (
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow font-black text-base shrink-0">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive NPC Reply when submitted */}
                  {hasSubmitted && dialogueChosenChoice?.npcResponse && (
                    <div className="p-3.5 rounded-2xl bg-[#FFF8EE] border border-amber-300 text-xs sm:text-sm animate-fadeIn flex items-start space-x-3 shadow-xs">
                      <div className="w-7 h-7 rounded-full bg-amber-500/15 text-[#B45309] border border-amber-300 flex items-center justify-center shrink-0 text-sm">
                        💬
                      </div>
                      <div>
                        <span className="font-black text-[#B45309] block mb-0.5 text-xs">
                          Respuesta de {currentQuestion.dialogue?.npcName || (isFoodOrCafe ? 'Camarero' : 'Guía')}:
                        </span>
                        <p className="text-[#524136] italic font-medium">
                          "{dialogueChosenChoice.npcResponse}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback and Grammar Explanation */}
              {hasSubmitted && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm animate-fadeIn ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <p className="font-black text-sm sm:text-base flex items-center space-x-1.5">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>¡Correcto! ¡Muy bien!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Respuesta incorrecta. {lives > 0 ? '¡Inténtalo de nuevo!' : 'Te has quedado sin vidas.'}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-[#4A3B32] leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons: Check / Continue (Panels 8 & 9) */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                {!hasSubmitted ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={
                      (currentQuestion.type === 'multiple-choice' && !selectedOption) ||
                      (currentQuestion.type === 'fill-blank' && !fillBlankInput.trim()) ||
                      (currentQuestion.type === 'word-order' && constructedWords.length === 0) ||
                      (currentQuestion.type === 'dialogue' && !dialogueChosenChoice && !selectedOption)
                    }
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] disabled:opacity-40 text-white font-black text-base shadow-md active:scale-95 transition-all"
                  >
                    Comprobar (Check)
                  </button>
                ) : isCorrect ? (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : lives > 0 ? (
                  <button
                    onClick={() => {
                      setHasSubmitted(false);
                      setIsCorrect(false);
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#F3B33D] hover:bg-[#F5BA31] text-[#24140E] font-black text-base shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Reintentar</span>
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                    {/* Wait 15m Timer Pill */}
                    <div className="px-3.5 py-2 rounded-2xl bg-sky-50 border border-sky-300 text-sky-900 text-xs font-bold flex items-center space-x-1.5 shadow-xs">
                      <Clock className="w-4 h-4 text-sky-600 animate-pulse" />
                      <span>1 Vida gratis en:</span>
                      <span className="font-mono font-black text-rose-600">{formatLifeTimer(secondsUntilNextLife)}</span>
                    </div>

                    {/* Spend 500 Coins for 3 Lives */}
                    {progress.stats.coins >= 500 ? (
                      <button
                        onClick={() => {
                          const res = refillLivesWithCoins();
                          if (res.success) {
                            setHasSubmitted(false);
                            setIsCorrect(false);
                          }
                        }}
                        className="px-5 py-3 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] text-white font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
                        title="Gastar 500 monedas para recargar 3 vidas"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Recargar 3 Vidas (500 🪙)</span>
                      </button>
                    ) : (
                      <div className="px-4 py-2.5 rounded-full bg-stone-100 border border-stone-300 text-stone-500 font-bold text-xs" title="Monedas insuficientes">
                        <span>Faltan {500 - progress.stats.coins} 🪙 para vidas</span>
                      </div>
                    )}

                    {/* Return to Map Button */}
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-full bg-white hover:bg-[#F2ECE1] border border-[#E0D5C7] text-[#524136] font-bold text-xs transition-colors cursor-pointer"
                    >
                      Salir al Mapa
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          HINT / TRANSLATION MODAL (PANEL 10)
          ======================================================== */}
      {showTranslateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#FFFBEB] border-4 border-amber-400 rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 text-slate-900 animate-slideUp">
            
            {/* Close */}
            <button
              onClick={() => setShowTranslateModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-200/60 hover:bg-amber-300 text-amber-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Lightbulb Icon (Panel 10) */}
            <div className="w-16 h-16 rounded-full bg-amber-400/30 border-2 border-amber-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
              💡
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-950 font-serif">
              ¿Necesitas Ayuda? (Need Help?)
            </h3>

            <p className="text-sm font-semibold text-slate-700">
              ¿Quieres traducir esta frase al inglés para resolverla más fácilmente?
            </p>

            {/* Translation Actions */}
            {!translationUnlocked ? (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handlePurchaseTranslation}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base shadow-lg border-2 border-amber-500 flex items-center justify-center space-x-2 transition-transform hover:scale-102"
                >
                  <Coins className="w-5 h-5 text-amber-900 fill-amber-900/30" />
                  <span>1.000 Monedas</span>
                </button>

                <button
                  onClick={handlePurchaseTranslation}
                  className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-base shadow-lg transition-transform hover:scale-102"
                >
                  Traducir (Translate)
                </button>

                {translateError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-100 p-2 rounded-xl">
                    {translateError}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-400 text-emerald-950 text-sm font-bold">
                ✓ ¡Traducción desbloqueada para esta pregunta!
              </div>
            )}

            {/* Preview Box at Bottom (Panel 10) */}
            <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 text-xs sm:text-sm text-slate-800 text-left font-medium space-y-1">
              <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                Frase en español:
              </span>
              <p className="font-bold">"{currentQuestion.dialogue?.prompt || currentQuestion.prompt}"</p>
              {translationUnlocked && (
                <div className="pt-2 border-t border-amber-200 mt-2">
                  <span className="font-bold text-emerald-800 block text-[11px] uppercase tracking-wider">
                    Traducción al inglés:
                  </span>
                  <p className="font-bold text-emerald-950 italic">
                    "{currentQuestion.dialogue?.englishPrompt || currentQuestion.englishPrompt || 'How much does this cost?'}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowTranslateModal(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
              >
                Cerrar y volver a la pregunta
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
