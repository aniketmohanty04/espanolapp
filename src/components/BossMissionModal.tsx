import React, { useState, useEffect, useMemo } from 'react';
import { useGame, REWARD_CONFIG } from '../context/GameContext';
import { BossMission, Question } from '../types';
import { shuffleArray } from '../utils/shuffle';
import { getQuestionVocabHints } from '../utils/vocabHintHelper';
import { 
  X, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Coins, 
  Sparkles,
  Lock,
  Play,
  Lightbulb,
  Bot,
  Languages,
  Mic
} from 'lucide-react';
import { PronunciationTrainerModal } from './PronunciationTrainerModal';
import { normalizeSpanishForComparison, calculateWordSimilarity } from '../services/spanishVoiceRecognitionService';

interface BossMissionModalProps {
  bossMission: BossMission;
  cityName: string;
  onClose: () => void;
  onSuccess: (unlockedNextCityId?: string) => void;
}

export const BossMissionModal: React.FC<BossMissionModalProps> = ({
  bossMission,
  cityName,
  onClose,
  onSuccess
}) => {
  const { recordBossCompleted, progress, purchaseVocabHint, setActiveQuizState, isChatbotOpen, setIsChatbotOpen } = useGame();

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [fillBlankInput, setFillBlankInput] = useState<string>('');
  const [constructedWords, setConstructedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [resultSummary, setResultSummary] = useState<{
    passed: boolean;
    unlockedNextCityId?: string;
    scorePercent: number;
    bonusCoins: number;
  } | null>(null);

  // Vocabulary Hint State for Boss Mission
  const [vocabHintUnlocked, setVocabHintUnlocked] = useState<boolean>(false);
  const [showVocabHintModal, setShowVocabHintModal] = useState<boolean>(false);
  const [vocabHintError, setVocabHintError] = useState<string | null>(null);
  const [isPurchasingHint, setIsPurchasingHint] = useState<boolean>(false);

  // Post-answer Full Question Translation state (0 coins)
  const [showFullTranslation, setShowFullTranslation] = useState<boolean>(false);

  // Pronunciation & Voice Recognition modal state
  const [showPronunciationTrainer, setShowPronunciationTrainer] = useState<boolean>(false);

  const currentQuestion: Question = bossMission.questions[currentIndex];
  const currentVocabHints = useMemo(() => currentQuestion ? getQuestionVocabHints(currentQuestion) : [], [currentQuestion]);

  // Safeguard: Boss is only unlocked after completion of all 10 levels of that city
  const isBossPassed = Boolean(progress.completedBosses[bossMission.cityId]?.passed);
  const cityCompletedLevelsCount = Object.keys(progress.completedLevels).filter(
    id => id.startsWith(`${bossMission.cityId}-`)
  ).length;
  const isBossUnlocked = cityCompletedLevelsCount >= 10 || isBossPassed;

  const shuffledOptions = useMemo(() => {
    return currentQuestion?.options ? shuffleArray(currentQuestion.options) : [];
  }, [currentQuestion?.id, currentQuestion?.options]);

  useEffect(() => {
    setSelectedOption('');
    setFillBlankInput('');
    setHasSubmitted(false);
    setIsCorrect(false);
    setShowVocabHintModal(false);
    setVocabHintError(null);
    setIsPurchasingHint(false);
    setShowFullTranslation(false);
    setShowPronunciationTrainer(false);

    if (currentQuestion?.id) {
      const already = (progress.purchasedVocabHints || []).includes(currentQuestion.id);
      setVocabHintUnlocked(already);
    }

    if (currentQuestion?.type === 'word-order' && currentQuestion?.sentencePieces) {
      setConstructedWords([]);
      setAvailableWords([...currentQuestion.sentencePieces]);
    }

    if (hasStarted && currentQuestion) {
      setActiveQuizState({
        isActive: true,
        isAnswered: false,
        cityId: bossMission.cityId,
        cityName,
        levelTitle: `Misión del Jefe de ${cityName}`,
        syllabusTopic: 'Misión del Jefe de Ciudad'
      });
    }
  }, [currentIndex, currentQuestion?.id, hasStarted, bossMission.cityId, cityName, setActiveQuizState]);

  // Clear quiz state and close tutor on unmount
  useEffect(() => {
    return () => {
      setActiveQuizState(null);
      setIsChatbotOpen(false);
    };
  }, [setActiveQuizState, setIsChatbotOpen]);

  // Purchase Vocabulary Hint ("Pista de vocabulario") for Boss question
  const handlePurchaseVocabHint = () => {
    if (isPurchasingHint || !currentQuestion) return;
    setIsPurchasingHint(true);
    setVocabHintError(null);

    const res = purchaseVocabHint(currentQuestion.id);
    if (res.success) {
      setVocabHintUnlocked(true);
      setVocabHintError(null);
    } else {
      setVocabHintError(res.reason || '¡No tienes suficientes monedas!');
    }

    setTimeout(() => setIsPurchasingHint(false), 600);
  };

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

  const insertAccent = (char: string) => {
    setFillBlankInput(prev => prev + char);
  };

  // Extract English translation of the current boss question prompt
  const questionEnglishText = useMemo(() => {
    if (!currentQuestion) return '';
    if (currentQuestion.type === 'dialogue' && currentQuestion.dialogue?.englishPrompt) {
      return currentQuestion.dialogue.englishPrompt;
    }
    if (currentQuestion.englishPrompt) {
      return currentQuestion.englishPrompt;
    }
    return currentQuestion.dialogue?.englishPrompt || currentQuestion.prompt;
  }, [currentQuestion]);

  // Toggle full question translation (0 coins, strictly unavailable before submission)
  const handleToggleFullTranslation = () => {
    if (!hasSubmitted) return;
    setShowFullTranslation(prev => !prev);
  };

  // Apply Spoken Answer from Voice Recognition
  const handleApplySpokenAnswer = (spokenAnswer: string) => {
    if (hasSubmitted || !currentQuestion) {
      setShowPronunciationTrainer(false);
      return;
    }

    const normSpoken = normalizeSpanishForComparison(spokenAnswer);

    // Letter and ordinal alias mapping
    const letterMap: Record<number, string[]> = {
      0: ['a', 'la a', 'opcion a', 'letra a', 'primera', 'uno', 'primero'],
      1: ['b', 'la b', 'opcion b', 'letra b', 'segunda', 'dos', 'segundo'],
      2: ['c', 'la c', 'opcion c', 'letra c', 'tercera', 'tres', 'tercero'],
      3: ['d', 'la d', 'opcion d', 'letra d', 'cuarta', 'cuatro', 'cuarto']
    };

    // Match MCQ
    if (currentQuestion.type === 'multiple-choice' && currentQuestion.options) {
      // 1. Check letter/ordinal alias
      for (const [idxStr, aliases] of Object.entries(letterMap)) {
        const idx = Number(idxStr);
        if (aliases.includes(normSpoken) && currentQuestion.options[idx]) {
          setSelectedOption(currentQuestion.options[idx]);
          setShowPronunciationTrainer(false);
          return;
        }
      }

      // 2. Check text similarity or containment
      const matched = currentQuestion.options.find(opt => {
        const normOpt = normalizeSpanishForComparison(opt);
        return normOpt === normSpoken ||
               calculateWordSimilarity(opt, spokenAnswer) >= 0.68 ||
               (normSpoken.length >= 3 && normOpt.includes(normSpoken)) ||
               (normOpt.length >= 3 && normSpoken.includes(normOpt));
      });
      if (matched) {
        setSelectedOption(matched);
        setShowPronunciationTrainer(false);
        return;
      }
    }

    // Match Dialogue
    if (currentQuestion.type === 'dialogue' && currentQuestion.dialogue?.choices) {
      // 1. Check letter/ordinal alias
      for (const [idxStr, aliases] of Object.entries(letterMap)) {
        const idx = Number(idxStr);
        if (aliases.includes(normSpoken) && currentQuestion.dialogue.choices[idx]) {
          setSelectedOption(currentQuestion.dialogue.choices[idx].text);
          setShowPronunciationTrainer(false);
          return;
        }
      }

      const matched = currentQuestion.dialogue.choices.find(c => {
        const normChoice = normalizeSpanishForComparison(c.text);
        return normChoice === normSpoken ||
               calculateWordSimilarity(c.text, spokenAnswer) >= 0.68 ||
               (normSpoken.length >= 3 && normChoice.includes(normSpoken)) ||
               (normChoice.length >= 3 && normSpoken.includes(normChoice));
      });
      if (matched) {
        setSelectedOption(matched.text);
        setShowPronunciationTrainer(false);
        return;
      }
    }

    // Match Fill in the blank
    if (currentQuestion.type === 'fill-blank') {
      setFillBlankInput(spokenAnswer.trim());
      setShowPronunciationTrainer(false);
      return;
    }

    setShowPronunciationTrainer(false);
  };

  const handleCheck = () => {
    if (hasSubmitted) return;

    let userVal = '';
    if (currentQuestion.type === 'multiple-choice') {
      userVal = selectedOption;
    } else if (currentQuestion.type === 'fill-blank') {
      userVal = fillBlankInput.trim();
    } else if (currentQuestion.type === 'word-order') {
      userVal = constructedWords.join(' ').trim();
    }

    if (!userVal) return;

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

    // Tutor enters review mode for this submitted boss question
    setActiveQuizState({
      isActive: true,
      isAnswered: true,
      cityId: bossMission.cityId,
      cityName,
      levelTitle: `Misión del Jefe de ${cityName}`,
      syllabusTopic: 'Misión del Jefe de Ciudad',
      questionPrompt: currentQuestion.prompt,
      submittedAnswer: userVal,
      isCorrect: correct,
      explanation: currentQuestion.explanation
    });

    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setIsChatbotOpen(false);
    setShowFullTranslation(false);
    if (currentIndex + 1 < bossMission.questions.length) {
      // Tutor immediately locks again for the next unanswered boss question
      setActiveQuizState({
        isActive: true,
        isAnswered: false,
        cityId: bossMission.cityId,
        cityName,
        levelTitle: `Misión del Jefe de ${cityName}`,
        syllabusTopic: 'Misión del Jefe de Ciudad'
      });
      setCurrentIndex(prev => prev + 1);
    } else {
      setActiveQuizState(null);
      // Evaluate Boss Mastery
      const total = bossMission.questions.length;
      const finalCorrect = correctCount + (isCorrect ? 1 : 0);
      const scorePercent = Math.round((finalCorrect / total) * 100);
      const res = recordBossCompleted(bossMission.cityId, scorePercent);
      setResultSummary({
        passed: res.passed,
        unlockedNextCityId: res.unlockedNextCityId,
        scorePercent,
        bonusCoins: res.bonusCoins
      });
      setIsFinished(true);
    }
  };

  const handleRetryBoss = () => {
    setActiveQuizState(null);
    setIsChatbotOpen(false);
    setShowFullTranslation(false);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIsFinished(false);
    setResultSummary(null);
    setHasStarted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FAF7F2] border-2 border-[#EADFCF] text-[#24140E] rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Boss Header Banner */}
        <div className="px-6 py-4 border-b-2 border-[#EADFCF] flex items-center justify-between bg-gradient-to-r from-[#FFF4EC] via-[#FFF9F2] to-[#FAF7F2]">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{bossMission.badgeIcon}</span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-[#C2410C] uppercase tracking-wider">
                  Misión de Jefe • {cityName}
                </span>
                {hasStarted && (
                  <span className="text-xs text-[#7A6B60] font-medium">
                    (Fase {currentIndex + 1} de {bossMission.questions.length})
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#24140E] font-serif">
                {bossMission.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] hover:text-[#24140E] border border-[#E0D5C7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locked Screen: If 10 levels of this city are not yet completed */}
        {!isBossUnlocked ? (
          <div className="p-8 sm:p-10 space-y-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 mx-auto flex items-center justify-center">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#B45309]">
                Acceso Bloqueado (Misión de Jefe)
              </span>
              <h3 className="text-2xl font-black text-[#24140E] font-serif mt-1">
                Completa los 10 niveles de {cityName}
              </h3>
              <p className="text-sm text-[#6B584D] max-w-md mx-auto mt-2 leading-relaxed font-medium">
                {bossMission.characterName} ({bossMission.characterRole}) solo acepta desafiar a viajeros que hayan completado los 10 niveles de preparación de {cityName}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#EADFCF] max-w-sm mx-auto flex items-center justify-between font-bold text-sm shadow-xs">
              <span className="text-[#6B584D]">Niveles completados:</span>
              <span className="text-amber-600 font-black">{cityCompletedLevelsCount} / 10 Niveles</span>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E05615] to-[#F3B33D] text-white font-black text-sm shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Volver a la Ciudad
            </button>
          </div>
        ) : !hasStarted ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            {/* Illustrated Boss Portrait */}
            <div className="relative w-28 h-28 mx-auto">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#E05615] via-[#F3B33D] to-[#E05615] p-1 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-[#FFF9F2] rounded-full overflow-hidden flex items-center justify-center text-5xl">
                  {/* Boss Matador / Hidalgo SVG Portrait */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="48" fill="#FFF9F2" />
                    {/* Cape */}
                    <path d="M 15 100 Q 50 65 85 100 Z" fill="#C60B1E" />
                    {/* Neck & Face */}
                    <ellipse cx="50" cy="52" rx="20" ry="22" fill="#DEB887" />
                    {/* Eyes */}
                    <circle cx="43" cy="50" r="2.5" fill="#1A1A1A" />
                    <circle cx="57" cy="50" r="2.5" fill="#1A1A1A" />
                    {/* Curled Mustache */}
                    <path d="M 36 60 Q 50 56 64 60 Q 58 64 50 62 Q 42 64 36 60 Z" fill="#2C1810" />
                    {/* Spanish Hat / Cordobés */}
                    <ellipse cx="50" cy="38" rx="34" ry="7" fill="#1A1A1A" />
                    <rect x="30" y="20" width="40" height="18" rx="3" fill="#1A1A1A" />
                    <rect x="30" y="32" width="40" height="5" fill="#C60B1E" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#B45309]">
                Reto Cumbre de {cityName}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#24140E] font-serif mt-1">
                ¡Bienvenido al Desafío de {bossMission.characterName}!
              </h3>
              <p className="text-xs font-bold text-[#C2410C] mt-0.5">
                {bossMission.characterRole}
              </p>
              <p className="text-sm text-[#6B584D] max-w-md mx-auto mt-3 leading-relaxed font-medium">
                "{bossMission.scenario}"
              </p>
            </div>

            {/* Boss requirements pill */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#EADFCF] text-left max-w-md mx-auto space-y-2 shadow-xs">
              <div className="flex items-center space-x-2 text-xs font-black text-[#B45309] uppercase">
                <ShieldAlert className="w-4 h-4 text-[#C2410C]" />
                <span>Condiciones de Victoria:</span>
              </div>
              <ul className="text-xs text-[#6B584D] space-y-1 pl-2 font-medium">
                <li>• Responder {bossMission.questions.length} situaciones comunicativas en español.</li>
                <li>• Obtener al menos un <strong>80% de aciertos</strong> para desbloquear la siguiente ciudad.</li>
                <li>• Recompensa: <strong>+{bossMission.coinReward} monedas</strong> y el trofeo <strong>{bossMission.badgeName}</strong>.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setHasStarted(true);
              }}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-base shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Comenzar Desafío del Jefe (Start Boss Challenge)
            </button>
          </div>
        ) : !isFinished ? (
          <div>
            {/* Boss Live Gauge */}
            <div className="px-6 py-2.5 bg-[#FFF8EE] border-b border-[#EADFCF] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-[#6B584D] font-medium">
                <ShieldAlert className="w-4 h-4 text-[#C2410C]" />
                <span>Umbral de Victoria: <strong className="text-[#24140E]">80% de aciertos</strong></span>
              </div>
              <div className="font-black text-[#B45309]">
                Aciertos: {correctCount} / {bossMission.questions.length}
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* NPC Boss Prompt Header with speech bubble */}
              <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white border-2 border-[#EADFCF] shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#FFF3E8] border-2 border-[#FAD9C0] text-2xl flex items-center justify-center shrink-0">
                  {bossMission.badgeIcon}
                </div>
                <div className="grow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#B45309] block">
                      {bossMission.characterName} ({bossMission.characterRole})
                    </span>
                    <div className="flex items-center space-x-2">
                      {/* Pista de vocabulario button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowVocabHintModal(true);
                          setVocabHintError(null);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs border border-amber-300 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                        title="Pista de vocabulario (500 monedas)"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-slate-950 fill-amber-300" />
                        <span>Pista de vocabulario (500 🪙)</span>
                      </button>

                      {/* Voice Pronunciation Button */}
                      <button
                        type="button"
                        data-testid="boss-pronunciation-btn"
                        onClick={() => setShowPronunciationTrainer(true)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black border transition-all shadow-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-300 hover:scale-105 active:scale-95 cursor-pointer shadow-purple-500/20"
                        title="Practicar pronunciación o responder con la voz"
                      >
                        <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
                        <span>🎤 Voz</span>
                      </button>

                      {/* Tutor IA Button in Boss Modal */}
                      <button
                        type="button"
                        onClick={() => {
                          if (hasSubmitted) {
                            setIsChatbotOpen(prev => !prev);
                          }
                        }}
                        disabled={!hasSubmitted}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black border transition-all shadow-sm ${
                          !hasSubmitted
                            ? 'bg-amber-100/80 text-amber-900 border-amber-300 opacity-75 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-300 hover:scale-105 active:scale-95 cursor-pointer animate-pulse'
                        }`}
                        title={!hasSubmitted ? '🔒 Tutor bloqueado durante la pregunta' : 'Preguntar a Camino sobre este enigma'}
                      >
                        {!hasSubmitted ? <Lock className="w-3 h-3 text-amber-700" /> : <Bot className="w-3 h-3 text-white" />}
                        <span>{hasSubmitted ? 'Tutor IA' : 'Tutor (🔒)'}</span>
                      </button>

                      {/* Full Question Translation Button in Boss Modal */}
                      <button
                        type="button"
                        data-testid="full-translation-btn"
                        onClick={handleToggleFullTranslation}
                        disabled={!hasSubmitted}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black border transition-all shadow-sm ${
                          !hasSubmitted
                            ? 'bg-slate-100 text-slate-500 border-slate-300 opacity-70 cursor-not-allowed'
                            : showFullTranslation
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-amber-400 hover:scale-105 active:scale-95 cursor-pointer shadow-amber-500/20'
                            : 'bg-gradient-to-r from-sky-600 to-blue-700 text-white border-sky-300 hover:scale-105 active:scale-95 cursor-pointer shadow-blue-500/20'
                        }`}
                        title={
                          !hasSubmitted
                            ? '🔒 Traducción bloqueada durante el enigma activo. Responde para desbloquear (0 monedas).'
                            : showFullTranslation
                            ? 'Ocultar traducción al inglés'
                            : 'Traducir pregunta al inglés (0 monedas)'
                        }
                      >
                        {!hasSubmitted ? <Lock className="w-3 h-3 text-slate-500" /> : <Languages className="w-3 h-3 text-white" />}
                        <span>
                          {!hasSubmitted
                            ? 'Traducir pregunta al inglés'
                            : showFullTranslation
                            ? 'Ocultar traducción'
                            : 'Traducir pregunta al inglés'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-[#24140E] mt-1.5 font-bold leading-relaxed font-serif">
                    {currentQuestion.prompt}
                  </p>
                </div>
              </div>

              {/* Question Interaction */}
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {shuffledOptions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = selectedOption === opt;
                    const isAnswer = hasSubmitted && opt === currentQuestion.correctAnswer;
                    const isWrongSelection = hasSubmitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={idx}
                        disabled={hasSubmitted}
                        onClick={() => setSelectedOption(opt)}
                        className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between shadow-xs active:scale-98 ${
                          isAnswer
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black'
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
                          <span>{opt}</span>
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
              )}

              {currentQuestion.type === 'fill-blank' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    disabled={hasSubmitted}
                    value={fillBlankInput}
                    onChange={e => setFillBlankInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheck()}
                    placeholder="Escribe la respuesta exacta..."
                    className="w-full p-3.5 rounded-2xl bg-white border-2 border-[#EADFCF] text-[#24140E] text-base placeholder:text-[#A89A8F] focus:outline-none focus:border-[#E05615] font-medium"
                  />
                  {!hasSubmitted && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'].map(char => (
                        <button
                          key={char}
                          type="button"
                          onClick={() => insertAccent(char)}
                          className="w-8 h-8 rounded-lg bg-white hover:bg-[#F2ECE1] text-[#24140E] font-bold text-sm border border-[#E0D5C7] transition-colors flex items-center justify-center shadow-xs"
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'word-order' && (
                <div className="space-y-4">
                  <div className="min-h-[64px] p-3 rounded-2xl bg-white border-2 border-dashed border-[#EADFCF] flex flex-wrap items-center gap-2">
                    {constructedWords.length === 0 ? (
                      <span className="text-xs text-[#7A6B60] italic">
                        Construye la frase del jefe pulsando las palabras en orden...
                      </span>
                    ) : (
                      constructedWords.map((word, idx) => (
                        <button
                          key={`bc-${idx}`}
                          disabled={hasSubmitted}
                          onClick={() => removeWordFromConstructed(word, idx)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#F3B33D] text-[#24140E] font-black text-sm shadow hover:bg-[#F5BA31]"
                        >
                          {word} ✕
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {availableWords.map((word, idx) => (
                      <button
                        key={`ba-${idx}`}
                        disabled={hasSubmitted}
                        onClick={() => addWordToConstructed(word, idx)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#24140E] font-bold text-sm border border-[#E0D5C7] shadow-xs active:scale-95 transition-all"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation drawer */}
              {hasSubmitted && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm animate-fadeIn ${
                  isCorrect 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-center space-x-2 font-black text-sm mb-1">
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span>¡Fase del jefe superada!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                        <span>Fallo en la respuesta</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A3B32] mt-1 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-[#B45309] font-bold mt-1">
                      Respuesta correcta: {Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer.join(' / ') : currentQuestion.correctAnswer}
                    </p>
                  )}

                  {/* Quick Translation Toggle in Feedback */}
                  <div className="mt-3 pt-2.5 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      data-testid="quiz-feedback-translate-btn"
                      onClick={handleToggleFullTranslation}
                      className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 hover:bg-amber-200 px-3.5 py-1.5 rounded-full border border-amber-300 transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      <Languages className="w-3.5 h-3.5 text-[#E05615]" />
                      <span>{showFullTranslation ? 'Ocultar traducción' : 'Traducir pregunta al inglés'}</span>
                    </button>
                    <span className="text-[11px] font-semibold text-[#7A6B60]">0 🪙 (Gratuito tras responder)</span>
                  </div>
                </div>
              )}

              {/* Full English Translation Card (Panel) */}
              {hasSubmitted && showFullTranslation && (
                <div 
                  data-testid="full-translation-panel"
                  className="p-4 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-[#24140E] shadow-sm animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/80">
                    <div className="flex items-center space-x-2 text-amber-950 font-black text-xs sm:text-sm">
                      <Languages className="w-4 h-4 text-[#E05615]" />
                      <span>Traducción al inglés de la pregunta:</span>
                    </div>
                    <button
                      type="button"
                      data-testid="hide-translation-btn"
                      onClick={() => setShowFullTranslation(false)}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-0.5 rounded-lg hover:bg-amber-200/60 transition cursor-pointer"
                    >
                      Ocultar traducción
                    </button>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-[#24140E] leading-relaxed">
                    "{questionEnglishText}"
                  </p>

                  <div className="mt-2.5 text-[11px] text-[#7A6B60] font-medium flex items-center justify-between">
                    <span>💡 Comprensión de la consigna en inglés. No revela la clave de respuestas.</span>
                    <span className="text-emerald-700 font-bold">✓ Costo: 0 monedas</span>
                  </div>
                </div>
              )}

              {/* Submit / Next Buttons */}
              <div className="pt-3 border-t border-[#EADFCF] flex justify-end items-center space-x-2.5">
                {!hasSubmitted ? (
                  <button
                    onClick={handleCheck}
                    className="px-7 py-2.5 rounded-full bg-[#E05615] hover:bg-[#C2410C] text-white font-black text-sm shadow-md transition-all"
                  >
                    Confirmar al Jefe
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsChatbotOpen(prev => !prev)}
                      className="flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-[#E05615] hover:from-amber-400 hover:to-[#C2410C] text-white font-black text-sm shadow-md transition-all cursor-pointer animate-pulse"
                      title="Preguntar a Camino (Tutor IA) sobre esta respuesta"
                    >
                      <Bot className="w-4 h-4 text-white" />
                      <span>Preguntar al Tutor</span>
                    </button>
                    <button
                      onClick={handleNext}
                      className="flex items-center space-x-1.5 px-7 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-all"
                    >
                      <span>{currentIndex + 1 < bossMission.questions.length ? 'Siguiente Fase' : 'Veredicto Final'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Boss Mission Final Verdict */
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-md border-2 border-amber-300 bg-[#FFF3E8]">
              {resultSummary?.passed ? bossMission.badgeIcon : '❌'}
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#24140E] font-serif">
                {resultSummary?.passed ? '¡VICTORIA Y MAESTRÍA DEMOSTRADA!' : 'UMBRAL DE MAESTRÍA NO ALCANZADO'}
              </h3>
              <p className="text-[#6B584D] text-sm mt-1 max-w-md mx-auto font-medium leading-relaxed">
                {resultSummary?.passed
                  ? `Has obtenido un ${resultSummary.scorePercent}% de aciertos (mínimo 80% superado). ${bossMission.characterName} te otorga su máxima bendición y el salvoconducto.`
                  : `Has obtenido un ${resultSummary?.scorePercent}%. Se requiere un 80% o más para abrir la siguiente ciudad. Repasa los niveles y vuelve a intentarlo.`}
              </p>
            </div>

            {resultSummary?.passed && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white p-4 rounded-2xl border-2 border-[#EADFCF] max-w-lg mx-auto shadow-xs">
                <div className="flex items-center space-x-2 text-[#B45309] font-black text-sm">
                  <Coins className="w-5 h-5 text-[#E05615]" />
                  <span>+{bossMission.coinReward} Monedas de Bonificación</span>
                </div>
                <div className="flex items-center space-x-2 text-sky-800 font-bold text-sm">
                  <Sparkles className="w-5 h-5 text-sky-600" />
                  <span>+{bossMission.xpReward} XP</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-800 font-bold text-sm">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  <span>{bossMission.badgeName}</span>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-3">
              {resultSummary?.passed ? (
                <button
                  onClick={() => {
                    onSuccess(resultSummary.unlockedNextCityId);
                    onClose();
                  }}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-sm shadow-md transition-all"
                >
                  Continuar hacia la Próxima Ciudad
                </button>
              ) : (
                <button
                  onClick={handleRetryBoss}
                  className="flex items-center space-x-2 px-7 py-3 rounded-full bg-[#F3B33D] hover:bg-[#F5BA31] text-[#24140E] font-black text-sm shadow-md transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reintentar Misión de Jefe</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vocabulary Hint Modal for Boss Mission */}
      {showVocabHintModal && currentQuestion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#FFFBEB] border-4 border-amber-400 rounded-3xl shadow-2xl p-6 sm:p-7 text-center space-y-4 text-slate-900 animate-slideUp">
            <button
              onClick={() => {
                setShowVocabHintModal(false);
                setVocabHintError(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-200/60 hover:bg-amber-300 text-amber-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-full bg-amber-400/30 border-2 border-amber-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
              💡
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 font-serif">
                Pista de vocabulario
              </h3>
              <p className="text-xs text-slate-700 mt-1 font-medium">
                Palabras clave esenciales para descifrar el enigma del jefe sin revelar la respuesta.
              </p>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-100/80 border border-amber-300 text-xs font-bold text-slate-800">
              <span>Tu saldo actual:</span>
              <span className="flex items-center space-x-1 font-mono font-black text-[#B45309]">
                <Coins className="w-4 h-4 text-[#E05615] fill-amber-400" />
                <span>{progress.stats.coins.toLocaleString()} 🪙</span>
              </span>
            </div>

            {!vocabHintUnlocked ? (
              <div className="space-y-3 pt-1">
                <button
                  disabled={isPurchasingHint}
                  onClick={handlePurchaseVocabHint}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-base shadow-lg border-2 border-amber-500 flex items-center justify-center space-x-2 transition-transform hover:scale-102 active:scale-98 cursor-pointer"
                >
                  <Coins className="w-5 h-5 text-amber-950 fill-amber-400" />
                  <span>Desbloquear Pista (500 🪙)</span>
                </button>

                {vocabHintError && (
                  <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold animate-fadeIn">
                    ⚠️ {vocabHintError}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <div className="p-3 rounded-2xl bg-emerald-100/90 border border-emerald-400 text-emerald-950 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span>✓</span>
                    <span>¡Pista de vocabulario activa!</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-900 bg-emerald-200/60 px-2 py-0.5 rounded-lg">
                    Saldo: {progress.stats.coins.toLocaleString()} 🪙
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border-2 border-amber-300/80 shadow-xs space-y-2">
                  <span className="text-[11px] font-black text-[#B45309] uppercase tracking-wider block">
                    Palabras clave (Keywords):
                  </span>
                  <ul className="divide-y divide-amber-100 text-sm">
                    {currentVocabHints.map((hint, idx) => {
                      const cleanTranslation = hint.translation?.includes('/')
                        ? (hint.word.toLowerCase().includes('mañana') && currentQuestion.prompt.toLowerCase().includes('por la')
                            ? 'morning'
                            : hint.translation.split('/')[0].trim())
                        : hint.translation;

                      return (
                        <li key={idx} className="py-2 flex items-center justify-between">
                          <span className="font-bold text-slate-950 font-mono text-base">{hint.word}</span>
                          <span className="text-slate-600 font-medium italic text-sm">= {cleanTranslation}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  setShowVocabHintModal(false);
                  setVocabHintError(null);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Cerrar y volver al desafío
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PRONUNCIATION TRAINER MODAL FOR BOSS CHALLENGE
          ======================================================== */}
      {showPronunciationTrainer && currentQuestion && (
        <PronunciationTrainerModal
          targetText={
            hasSubmitted
              ? (Array.isArray(currentQuestion.correctAnswer)
                  ? currentQuestion.correctAnswer.join(' ')
                  : (currentQuestion.correctAnswer || currentQuestion.prompt))
              : (selectedOption || currentQuestion.prompt)
          }
          englishMeaning={
            hasSubmitted
              ? (questionEnglishText || currentQuestion.explanation)
              : (questionEnglishText ? questionEnglishText : undefined)
          }
          title={
            hasSubmitted
              ? 'Práctica de Pronunciación (Desafío del Jefe)'
              : 'Desafío Oral en Español'
          }
          onClose={() => setShowPronunciationTrainer(false)}
          onApplySpokenAnswer={handleApplySpokenAnswer}
        />
      )}
    </div>
  );
};
