import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { getQuestionById, getCityById } from '../data/citiesData';
import { Question } from '../types';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface ReviewNotebookModalProps {
  onClose: () => void;
}

export const ReviewNotebookModal: React.FC<ReviewNotebookModalProps> = ({ onClose }) => {
  const { progress, markMistakeMastered } = useGame();
  const [filter, setFilter] = useState<'pending' | 'mastered' | 'all'>('pending');
  const [activePracticeQuestion, setActivePracticeQuestion] = useState<Question | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState<string>('');
  const [practiceFeedback, setPracticeFeedback] = useState<{ isCorrect: boolean; show: boolean }>({
    isCorrect: false,
    show: false
  });

  const mistakesList = Object.values(progress.incorrectQuestions);
  const pendingMistakes = mistakesList.filter(m => !m.mastered);
  const masteredMistakes = mistakesList.filter(m => m.mastered);

  const displayedList = filter === 'pending'
    ? pendingMistakes
    : filter === 'mastered'
    ? masteredMistakes
    : mistakesList;

  const handleStartPractice = (questionId: string) => {
    const q = getQuestionById(questionId);
    if (q) {
      setActivePracticeQuestion(q);
      setPracticeAnswer('');
      setPracticeFeedback({ isCorrect: false, show: false });
    }
  };

  const handleCheckPractice = () => {
    if (!activePracticeQuestion || !practiceAnswer) return;

    let correct = false;
    if (Array.isArray(activePracticeQuestion.correctAnswer)) {
      correct = activePracticeQuestion.correctAnswer.some(
        ans => ans.toLowerCase().trim() === practiceAnswer.toLowerCase().trim()
      );
    } else {
      correct = activePracticeQuestion.correctAnswer.toLowerCase().trim() === practiceAnswer.toLowerCase().trim();
    }

    setPracticeFeedback({ isCorrect: correct, show: true });

    if (correct) {
      markMistakeMastered(activePracticeQuestion.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#24140E]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#24140E] font-serif flex items-center space-x-2">
                <span>Cuaderno de Repaso y Errores</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-black">
                  {pendingMistakes.length} pendientes
                </span>
              </h2>
              <p className="text-xs text-[#7A6B60] font-medium">
                Sistema de repaso espaciado: practica tus fallos hasta dominarlos (+25 XP por corrección).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF7F2] text-[#6B584D] hover:text-[#24140E] hover:bg-[#F2ECE1] border border-[#EADFCF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-6 py-2.5 bg-[#F5EDE2] border-b border-[#EADFCF] flex items-center space-x-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              filter === 'pending'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : 'bg-white text-[#7A6B60] border border-[#E0D5C7] hover:border-rose-400 hover:text-rose-700'
            }`}
          >
            Pendientes ({pendingMistakes.length})
          </button>
          <button
            onClick={() => setFilter('mastered')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              filter === 'mastered'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-white text-[#7A6B60] border border-[#E0D5C7] hover:border-emerald-400 hover:text-emerald-700'
            }`}
          >
            Dominadas ({masteredMistakes.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-[#24140E] text-white font-black shadow-xs'
                : 'bg-white text-[#7A6B60] border border-[#E0D5C7] hover:border-amber-400 hover:text-[#24140E]'
            }`}
          >
            Todas ({mistakesList.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 grow">
          {/* Active Practice Interactive Card */}
          {activePracticeQuestion && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-amber-400 shadow-md space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#B45309] uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#E05615]" />
                  <span>Modo Práctica de Repaso</span>
                </span>
                <button
                  onClick={() => setActivePracticeQuestion(null)}
                  className="text-xs text-[#8C7A6B] hover:text-[#24140E] font-bold"
                >
                  Cerrar Práctica ✕
                </button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-black text-[#24140E] font-serif leading-relaxed">
                  {activePracticeQuestion.prompt}
                </p>
              </div>

              {/* Multiple Choice Options or Text Input */}
              {activePracticeQuestion.options ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activePracticeQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={practiceFeedback.show && practiceFeedback.isCorrect}
                      onClick={() => setPracticeAnswer(opt)}
                      className={`p-3.5 rounded-2xl border-2 text-left text-xs sm:text-sm font-semibold transition-all ${
                        practiceAnswer === opt
                          ? 'bg-amber-50/80 border-[#E05615] text-[#24140E] font-bold shadow-xs'
                          : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] border-[#E0D5C7] text-[#24140E]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  disabled={practiceFeedback.show && practiceFeedback.isCorrect}
                  value={practiceAnswer}
                  onChange={e => setPracticeAnswer(e.target.value)}
                  placeholder="Escribe la corrección..."
                  className="w-full p-4 rounded-2xl bg-white border-2 border-[#E8DFD5] text-[#24140E] text-sm focus:outline-none focus:border-[#E05615] font-semibold"
                />
              )}

              {/* Feedback box */}
              {practiceFeedback.show && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                  practiceFeedback.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="font-black flex items-center space-x-1.5 mb-1">
                    {practiceFeedback.isCorrect ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>¡Excelente! Pregunta dominada (+25 XP ganados).</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Aún no es correcto. Vuelve a intentarlo.</span>
                      </>
                    )}
                  </div>
                  <p className="text-[#4A3B32] text-xs font-medium">{activePracticeQuestion.explanation}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={handleCheckPractice}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs sm:text-sm shadow-md transition-all"
                >
                  Comprobar Repaso
                </button>
              </div>
            </div>
          )}

          {/* List of mistakes */}
          {displayedList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-2xl shadow-xs">
                ✨
              </div>
              <h3 className="text-lg font-black text-[#24140E] font-serif">
                {filter === 'pending' ? '¡Sin errores pendientes!' : 'No hay preguntas en este filtro'}
              </h3>
              <p className="text-xs text-[#7A6B60] max-w-sm mx-auto font-medium">
                {filter === 'pending'
                  ? '¡Excelente trabajo! Has dominado todas las preguntas o aún no has fallado ninguna.'
                  : 'Continúa jugando para registrar tu historial de aprendizaje.'}
              </p>
            </div>
          ) : (
            displayedList.map(item => {
              const city = getCityById(item.cityId);
              return (
                <div
                  key={item.questionId}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    item.mastered
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : 'bg-white border-[#E8DFD5] hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-[#B45309]">
                        {city ? city.name : 'España'}
                      </span>
                      <span className="text-xs text-[#8C7A6B]">•</span>
                      <span className="text-xs text-[#7A6B60] font-medium">
                        Fallada {item.failCount} {item.failCount === 1 ? 'vez' : 'veces'}
                      </span>
                      {item.mastered && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Dominada</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black text-[#24140E] font-serif leading-relaxed">
                      {item.prompt}
                    </p>
                    <p className="text-xs text-[#6B584D] line-clamp-2 font-medium">
                      {item.explanation}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartPractice(item.questionId)}
                    className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs shrink-0 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-1.5 self-start sm:self-center shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{item.mastered ? 'Repasar de nuevo' : 'Practicar y dominar'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
