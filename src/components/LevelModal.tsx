import React, { useState, useEffect } from 'react';
import { useGame, REWARD_CONFIG } from '../context/GameContext';
import { Level, Question, DialogueChoice } from '../types';
import { soundService } from '../services/soundService';
import { 
  X, 
  Volume2, 
  HelpCircle, 
  Languages, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Coins, 
  Sparkles, 
  Star,
  MessageSquare
} from 'lucide-react';

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
    recordLevelCompleted 
  } = useGame();

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
  const [activeHintIndex, setActiveHintIndex] = useState<number>(-1);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [translationUnlocked, setTranslationUnlocked] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Level summary metrics
  const [correctFirstTries, setCorrectFirstTries] = useState<number>(0);
  const [isLevelFinished, setIsLevelFinished] = useState<boolean>(false);

  const currentQuestion: Question = level.questions[currentIndex];

  // Initialize question state whenever currentIndex changes
  useEffect(() => {
    setSelectedOption('');
    setFillBlankInput('');
    setHasSubmitted(false);
    setIsCorrect(false);
    setAttemptCount(0);
    setActiveHintIndex(-1);
    setShowExplanation(false);
    setTranslationError(null);
    setDialogueChosenChoice(null);

    // Check if translation was previously bought for this question
    const alreadyPurchased = progress.purchasedTranslations.includes(currentQuestion.id);
    setTranslationUnlocked(alreadyPurchased);

    // Word order setup
    if (currentQuestion.type === 'word-order' && currentQuestion.sentencePieces) {
      setConstructedWords([]);
      setAvailableWords([...currentQuestion.sentencePieces]);
    }

    // Automatically speak the prompt in Spanish if available
    if (currentQuestion.audioText) {
      soundService.speakSpanish(currentQuestion.audioText);
    }
  }, [currentIndex, currentQuestion.id]);

  // Handle word order chips
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

  // Spanish accent insertions
  const insertAccent = (char: string) => {
    setFillBlankInput(prev => prev + char);
  };

  // Submit Answer validation
  const handleCheckAnswer = () => {
    if (hasSubmitted) return; // Prevent accidental repeated submissions

    let userVal = '';
    if (currentQuestion.type === 'multiple-choice') {
      userVal = selectedOption;
    } else if (currentQuestion.type === 'fill-blank') {
      userVal = fillBlankInput.trim();
    } else if (currentQuestion.type === 'word-order') {
      userVal = constructedWords.join(' ').trim();
    } else if (currentQuestion.type === 'dialogue') {
      userVal = dialogueChosenChoice?.text || '';
    }

    if (!userVal && currentQuestion.type !== 'dialogue') return;

    const isFirstAttempt = attemptCount === 0;
    setAttemptCount(prev => prev + 1);

    // Validate against correctAnswer (string or array)
    let correct = false;
    if (Array.isArray(currentQuestion.correctAnswer)) {
      correct = currentQuestion.correctAnswer.some(
        ans => ans.toLowerCase().trim() === userVal.toLowerCase().trim()
      );
    } else {
      correct = currentQuestion.correctAnswer.toLowerCase().trim() === userVal.toLowerCase().trim();
    }

    setIsCorrect(correct);
    setHasSubmitted(true);
    setShowExplanation(true);

    if (correct) {
      soundService.playCorrect();
      if (isFirstAttempt) {
        setCorrectFirstTries(prev => prev + 1);
      }
      // Record in context for coins, XP, and mistake notebook
      recordQuestionResult(currentQuestion, cityId, level.id, true, isFirstAttempt);

      // If dialogue, grant dialogue completed bonus
      if (currentQuestion.type === 'dialogue') {
        recordDialogueCompleted(currentQuestion.id);
      }
    } else {
      soundService.playIncorrect();
      recordQuestionResult(currentQuestion, cityId, level.id, false, isFirstAttempt);
    }
  };

  // Handle Retry
  const handleRetry = () => {
    setHasSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
    setDialogueChosenChoice(null);
    if (currentQuestion.type === 'word-order' && currentQuestion.sentencePieces) {
      setConstructedWords([]);
      setAvailableWords([...currentQuestion.sentencePieces]);
    }
  };

  // Handle Next Question or Finish
  const handleNext = () => {
    if (currentIndex + 1 < level.questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Level Finished! Calculate score and save progress
      const totalQuestions = level.questions.length;
      const scorePercent = Math.round((correctFirstTries / totalQuestions) * 100);
      const perfect = correctFirstTries === totalQuestions;
      recordLevelCompleted(cityId, level.id, scorePercent, perfect);
      setIsLevelFinished(true);
      soundService.playCorrect();
    }
  };

  // Purchase English translation
  const handleBuyTranslation = () => {
    const res = purchaseTranslation(currentQuestion.id);
    if (res.success) {
      setTranslationUnlocked(true);
      setTranslationError(null);
      soundService.playCoinReward();
    } else {
      setTranslationError(res.reason || 'No tienes suficientes monedas.');
    }
  };

  // Show Next Hint
  const handleShowHint = () => {
    if (currentQuestion.hints && currentQuestion.hints.length > 0) {
      setActiveHintIndex(prev => Math.min(prev + 1, currentQuestion.hints.length - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#141724] border border-fiesta-border rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-fiesta-border/80 flex items-center justify-between bg-[#1A1D2E]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Nivel {level.levelNumber} • {level.tier.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">
                (Pregunta {currentIndex + 1} de {level.questions.length})
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
              {level.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Cerrar nivel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / level.questions.length) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        {!isLevelFinished ? (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Question prompt header with audio speaker */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                  {currentQuestion.prompt}
                </p>
                {currentQuestion.audioText && (
                  <button
                    onClick={() => soundService.speakSpanish(currentQuestion.audioText!)}
                    className="p-2.5 rounded-full bg-fiesta-card hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/30 transition-all shrink-0"
                    title="Escuchar pronunciación nativa"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* English translation drawer (if unlocked or purchased) */}
              {translationUnlocked ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <span className="font-bold block mb-0.5">Traducción al inglés:</span>
                  <p>{currentQuestion.englishPrompt || 'Translation available upon request.'}</p>
                </div>
              ) : attemptCount >= 2 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-2">
                  <div className="text-xs text-rose-200">
                    <span className="font-bold">¿Necesitas ayuda?</span> Puedes desbloquear la traducción al inglés por 1.000 monedas.
                  </div>
                  <button
                    onClick={handleBuyTranslation}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors flex items-center space-x-1"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Desbloquear (1.000)</span>
                  </button>
                </div>
              )}

              {translationError && (
                <p className="text-xs text-rose-400 font-medium">{translationError}</p>
              )}
            </div>

            {/* Question Modalities */}
            {/* 1. Multiple-choice */}
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={hasSubmitted}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full p-3.5 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                      selectedOption === option
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                        : 'bg-fiesta-card hover:bg-slate-700/60 border-fiesta-border text-slate-200'
                    } ${
                      hasSubmitted && option === currentQuestion.correctAnswer
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : hasSubmitted && selectedOption === option && !isCorrect
                        ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-400">
                        {idx + 1}
                      </span>
                      <span>{option}</span>
                    </div>
                    {hasSubmitted && option === currentQuestion.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 2. Fill-in-the-blank */}
            {currentQuestion.type === 'fill-blank' && (
              <div className="space-y-3">
                <input
                  type="text"
                  disabled={hasSubmitted}
                  value={fillBlankInput}
                  onChange={e => setFillBlankInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCheckAnswer()}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-fiesta-border text-white text-base focus:outline-none focus:border-amber-400 transition-colors"
                />

                {/* Quick Spanish Accents Bar */}
                {!hasSubmitted && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">Tildes y signos:</span>
                    {['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'].map(char => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => insertAccent(char)}
                        className="w-8 h-8 rounded-lg bg-fiesta-card hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-sm border border-fiesta-border transition-colors flex items-center justify-center"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Word-ordering sentence constructor */}
            {currentQuestion.type === 'word-order' && (
              <div className="space-y-4">
                {/* Assembled sentence drop zone */}
                <div className="min-h-[64px] p-3 rounded-xl bg-slate-900/90 border-2 border-dashed border-fiesta-border flex flex-wrap items-center gap-2">
                  {constructedWords.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      Pulsa sobre las palabras abajo para construir la frase en orden...
                    </span>
                  ) : (
                    constructedWords.map((word, idx) => (
                      <button
                        key={`c-${idx}`}
                        disabled={hasSubmitted}
                        onClick={() => removeWordFromConstructed(word, idx)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm shadow hover:bg-amber-400 transition-colors"
                      >
                        {word} ✕
                      </button>
                    ))
                  )}
                </div>

                {/* Available word chips pool */}
                <div className="flex flex-wrap items-center gap-2">
                  {availableWords.map((word, idx) => (
                    <button
                      key={`a-${idx}`}
                      disabled={hasSubmitted}
                      onClick={() => addWordToConstructed(word, idx)}
                      className="px-3.5 py-2 rounded-lg bg-fiesta-card hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-fiesta-border shadow-sm transition-all active:scale-95"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Branching Multi-turn NPC Dialogue */}
            {currentQuestion.type === 'dialogue' && currentQuestion.dialogue && (
              <div className="space-y-4">
                {/* NPC Speech bubble */}
                <div className="flex items-start space-x-3 p-4 rounded-2xl bg-[#1C2033] border border-fiesta-border/80">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      {currentQuestion.dialogue.npcName} ({currentQuestion.dialogue.npcRole})
                    </span>
                    <p className="text-sm sm:text-base text-slate-100 mt-1 font-medium">
                      "{currentQuestion.dialogue.prompt}"
                    </p>
                    {currentQuestion.dialogue.englishPrompt && (
                      <p className="text-xs text-slate-400 mt-0.5 italic">
                        {currentQuestion.dialogue.englishPrompt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dialogue Choices */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tu respuesta:</p>
                  {currentQuestion.dialogue.choices.map(choice => (
                    <button
                      key={choice.id}
                      disabled={hasSubmitted}
                      onClick={() => {
                        setDialogueChosenChoice(choice);
                        setSelectedOption(choice.text);
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all ${
                        dialogueChosenChoice?.id === choice.id
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-fiesta-card hover:bg-slate-700/60 border-fiesta-border text-slate-200'
                      }`}
                    >
                      <p className="font-semibold">{choice.text}</p>
                      {choice.englishHint && (
                        <p className="text-xs text-slate-400 italic mt-0.5">{choice.englishHint}</p>
                      )}
                    </button>
                  ))}
                </div>

                {/* NPC response feedback once submitted */}
                {hasSubmitted && dialogueChosenChoice && (
                  <div className={`p-4 rounded-xl border ${
                    isCorrect ? 'bg-emerald-950/40 border-emerald-500/50' : 'bg-rose-950/40 border-rose-500/50'
                  }`}>
                    <span className="text-xs font-bold text-amber-300 block">
                      Respuesta de {currentQuestion.dialogue.npcName}:
                    </span>
                    <p className="text-sm text-slate-200 mt-1 italic">
                      "{dialogueChosenChoice.npcResponse}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Hint Drawer */}
            {activeHintIndex >= 0 && currentQuestion.hints && (
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start space-x-2 text-xs text-sky-200 animate-fadeIn">
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Pista pedagógica:</span>
                  <p className="mt-0.5">{currentQuestion.hints[activeHintIndex]}</p>
                </div>
              </div>
            )}

            {/* Explanation Drawer after submission */}
            {showExplanation && (
              <div className={`p-4 rounded-xl border animate-fadeIn ${
                isCorrect 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-sm mb-1">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>¡Respuesta Correcta! {attemptCount === 1 ? '(+100 monedas)' : ''}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                      <span>Respuesta Incorrecta</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {currentQuestion.explanation}
                </p>
                {!isCorrect && (
                  <p className="text-xs text-amber-300 font-semibold mt-2">
                    Respuesta correcta: {Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer.join(' / ') : currentQuestion.correctAnswer}
                  </p>
                )}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-fiesta-border/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {!hasSubmitted && currentQuestion.hints && currentQuestion.hints.length > 0 && (
                  <button
                    onClick={handleShowHint}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-fiesta-border transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-sky-400" />
                    <span>Pista</span>
                  </button>
                )}
                {!translationUnlocked && (
                  <button
                    onClick={handleBuyTranslation}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-fiesta-border transition-colors"
                  >
                    <Languages className="w-4 h-4 text-amber-400" />
                    <span>Traducir al inglés (1.000)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {hasSubmitted && !isCorrect && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reintentar</span>
                  </button>
                )}

                {!hasSubmitted ? (
                  <button
                    onClick={handleCheckAnswer}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all"
                  >
                    Comprobar Respuesta
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all"
                  >
                    <span>{currentIndex + 1 < level.questions.length ? 'Siguiente' : 'Finalizar Nivel'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Level Completed Celebration Summary */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-serif">
                ¡Nivel Completado con Éxito!
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                Has superado los objetivos del {level.title}.
              </p>
            </div>

            {/* Stars awarded */}
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3].map(s => {
                const earned = correctFirstTries === level.questions.length 
                  ? true 
                  : s <= (correctFirstTries >= Math.ceil(level.questions.length * 0.7) ? 2 : 1);
                return (
                  <Star
                    key={s}
                    className={`w-8 h-8 ${earned ? 'fill-amber-400 text-amber-400 animate-bounce' : 'text-slate-700'}`}
                  />
                );
              })}
            </div>

            {/* Rewards tally */}
            <div className="flex items-center justify-center space-x-6 bg-[#1A1D2E] p-4 rounded-xl border border-fiesta-border/70 max-w-sm mx-auto">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>+{level.coinReward} Monedas</span>
              </div>
              <div className="flex items-center space-x-2 text-sky-300 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <span>+{level.xpReward} XP</span>
              </div>
            </div>

            <button
              onClick={() => {
                onCompleteLevel();
                onClose();
              }}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-sm shadow-xl transition-all"
            >
              Continuar la Aventura
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
