import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { CUMULATIVE_FINAL_ASSESSMENT } from '../data/festivalData';
import { Question } from '../types';
import { shuffleArray } from '../utils/shuffle';
import { 
  X, 
  GraduationCap, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  Award, 
  Download, 
  Printer,
  Sparkles
} from 'lucide-react';

interface FinalAssessmentModalProps {
  onClose: () => void;
}

export const FinalAssessmentModal: React.FC<FinalAssessmentModalProps> = ({ onClose }) => {
  const { recordFinalAssessment, progress } = useGame();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [constructedWords, setConstructedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<{
    correctCount: number;
    scorePercent: number;
    passed: boolean;
    certificateId: string;
    moduleBreakdown: Record<number, { correct: number; total: number }>;
  } | null>(null);

  const [studentName, setStudentName] = useState<string>('Alex el Viajero');

  const totalQuestions = CUMULATIVE_FINAL_ASSESSMENT.length;
  const currentQ: Question = CUMULATIVE_FINAL_ASSESSMENT[currentIndex];

  const shuffledOptions = useMemo(() => {
    return currentQ.options ? shuffleArray(currentQ.options) : [];
  }, [currentQ.id, currentQ.options]);

  // Set up word order words if current question is word-order
  React.useEffect(() => {
    if (currentQ.type === 'word-order' && currentQ.sentencePieces) {
      if (!answers[currentQ.id]) {
        setConstructedWords([]);
        setAvailableWords([...currentQ.sentencePieces]);
      } else {
        const parts = answers[currentQ.id].split(' ');
        setConstructedWords(parts);
        setAvailableWords(currentQ.sentencePieces.filter(w => !parts.includes(w)));
      }
    }
  }, [currentIndex, currentQ.id]);

  const handleSelectOption = (opt: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: opt
    }));
  };

  const addWord = (word: string, index: number) => {
    const updated = [...constructedWords, word];
    setConstructedWords(updated);
    setAvailableWords(prev => prev.filter((_, i) => i !== index));
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: updated.join(' ')
    }));
  };

  const removeWord = (word: string, index: number) => {
    const updated = constructedWords.filter((_, i) => i !== index);
    setConstructedWords(updated);
    setAvailableWords(prev => [...prev, word]);
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: updated.join(' ')
    }));
  };

  const handleFinishExam = () => {
    let correctCount = 0;
    const moduleBreakdown: Record<number, { correct: number; total: number }> = {
      1: { correct: 0, total: 6 },
      2: { correct: 0, total: 6 },
      3: { correct: 0, total: 6 },
      4: { correct: 0, total: 6 },
      5: { correct: 0, total: 6 }
    };

    CUMULATIVE_FINAL_ASSESSMENT.forEach((q, idx) => {
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const modNum = Math.floor(idx / 6) + 1;

      let isCorrect = false;
      if (Array.isArray(q.correctAnswer)) {
        isCorrect = q.correctAnswer.some(a => a.toLowerCase().trim() === userAns);
      } else {
        isCorrect = q.correctAnswer.toLowerCase().trim() === userAns;
      }

      if (isCorrect) {
        correctCount++;
        moduleBreakdown[modNum].correct++;
      }
    });

    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const res = recordFinalAssessment(scorePercent);

    setFinalScore({
      correctCount,
      scorePercent,
      passed: res.passed,
      certificateId: res.certificateId,
      moduleBreakdown
    });
    setIsSubmitted(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-[#24140E]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-[#B45309] flex items-center justify-center border border-amber-300 text-xl">
              🎓
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-[#24140E] font-serif">Examen Oficial Acumulativo BAESP101</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-[#B45309] font-black border border-amber-300">
                  30 Preguntas • Módulos 1 a 5
                </span>
              </div>
              <p className="text-xs text-[#7A6B60] font-medium">
                Certificación oficial de competencia lingüística en español A1.
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

        {!isSubmitted ? (
          <>
            {/* Question Quick Grid Navigator */}
            <div className="px-6 py-2.5 bg-[#F5EDE2] border-b border-[#EADFCF] flex items-center gap-1.5 overflow-x-auto shrink-0">
              {CUMULATIVE_FINAL_ASSESSMENT.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-black shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-[#E05615] text-white ring-2 ring-amber-400 scale-110 shadow'
                        : isAnswered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-[#7A6B60] border border-[#E0D5C7] hover:border-amber-400 hover:text-[#24140E]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Exam Content Body */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-5 grow text-left">
              <div className="flex items-center justify-between text-xs font-black text-[#B45309]">
                <span>PREGUNTA {currentIndex + 1} DE {totalQuestions}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#EADFCF] text-[#7A6B60] font-mono text-[11px]">
                  Módulo {Math.floor(currentIndex / 6) + 1}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <p className="text-base sm:text-lg font-black text-[#24140E] font-serif leading-relaxed">
                  {currentQ.prompt}
                </p>
              </div>

              {/* Multiple Choice */}
              {currentQ.type === 'multiple-choice' && currentQ.options && (
                <div className="space-y-2.5">
                  {shuffledOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all ${
                        answers[currentQ.id] === opt
                          ? 'bg-amber-50/80 border-[#E05615] text-[#24140E] shadow-sm font-bold'
                          : 'bg-white hover:bg-[#FFFDF9] border-[#E8DFD5] hover:border-amber-400 text-[#24140E]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                          answers[currentQ.id] === opt
                            ? 'bg-[#E05615] text-white'
                            : 'bg-[#FAF7F2] text-[#B45309] border border-[#E0D5C7]'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Fill in the blank */}
              {currentQ.type === 'fill-blank' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleSelectOption(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="w-full p-4 rounded-2xl bg-white border-2 border-[#E8DFD5] text-[#24140E] text-base focus:outline-none focus:border-[#E05615] font-semibold"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'].map(char => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleSelectOption((answers[currentQ.id] || '') + char)}
                        className="w-8 h-8 rounded-xl bg-white hover:bg-amber-100 text-[#24140E] font-black text-sm border border-[#E0D5C7] transition-colors"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Word Order */}
              {currentQ.type === 'word-order' && (
                <div className="space-y-4">
                  <div className="min-h-[64px] p-3 rounded-2xl bg-white border-2 border-dashed border-[#E0D5C7] flex flex-wrap items-center gap-2">
                    {constructedWords.length === 0 ? (
                      <span className="text-xs text-[#8C7A6B] italic font-medium">
                        Pulsa las palabras para ordenar la frase...
                      </span>
                    ) : (
                      constructedWords.map((word, idx) => (
                        <button
                          key={`fc-${idx}`}
                          onClick={() => removeWord(word, idx)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E05615] to-[#F3B33D] text-white font-black text-sm shadow hover:opacity-95"
                        >
                          {word} ✕
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {availableWords.map((word, idx) => (
                      <button
                        key={`fa-${idx}`}
                        onClick={() => addWord(word, idx)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-[#24140E] font-bold text-sm border-2 border-[#E8DFD5] shadow-xs"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigator Footer */}
            <div className="px-6 py-4 bg-white border-t border-[#EADFCF] flex items-center justify-between shrink-0">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EADFCF] disabled:opacity-40 text-[#6B584D] font-black text-xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <div className="text-xs text-[#7A6B60] font-bold">
                Respondidas: <strong className="text-[#E05615]">{Object.keys(answers).length}</strong> de {totalQuestions}
              </div>

              {currentIndex + 1 < totalQuestions ? (
                <button
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="flex items-center space-x-1.5 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs shadow-md transition-all"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinishExam}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg transition-all"
                >
                  Entregar Examen Oficial
                </button>
              )}
            </div>
          </>
        ) : (
          /* Official Exam Result & Certificate Generator */
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-center grow">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl border-2 border-amber-300 bg-amber-100 text-[#B45309]">
              {finalScore?.passed ? '🏆' : '📚'}
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#24140E] font-serif">
                {finalScore?.passed ? '¡ENHORABUENA! EXAMEN OFICIAL SUPERADO' : 'EXAMEN NO SUPERADO'}
              </h3>
              <p className="text-[#6B584D] text-sm mt-1 max-w-lg mx-auto font-medium">
                {finalScore?.passed
                  ? `Has obtenido un ${finalScore.scorePercent}% (${finalScore.correctCount}/${totalQuestions} aciertos). Has acreditado oficialmente el dominio del curso Spanish Level I (BAESP101).`
                  : `Has obtenido un ${finalScore?.scorePercent}% (${finalScore?.correctCount}/${totalQuestions}). Se requiere un 70% para aprobar. Puedes repasar y volver a intentarlo.`}
              </p>
            </div>

            {/* Module Breakdown Grid */}
            {finalScore && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-w-2xl mx-auto text-left">
                {[1, 2, 3, 4, 5].map(m => (
                  <div key={m} className="p-3.5 rounded-2xl bg-white border-2 border-[#E8DFD5] shadow-xs">
                    <span className="text-[10px] text-[#B45309] font-black uppercase tracking-wider block">Módulo {m}</span>
                    <span className="text-base font-black text-[#24140E]">
                      {finalScore.moduleBreakdown[m].correct} / {finalScore.moduleBreakdown[m].total}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Official Diploma Certificate Preview (Printable) */}
            {finalScore?.passed && (
              <div id="diploma-certificate" className="p-8 rounded-3xl bg-gradient-to-b from-[#FDFBF7] to-[#F5EEDC] text-slate-900 border-8 border-double border-[#966827] shadow-2xl max-w-2xl mx-auto my-6 text-center font-serif relative overflow-hidden">
                <div className="absolute top-2 left-2 text-2xl opacity-40">👑</div>
                <div className="absolute top-2 right-2 text-2xl opacity-40">🇪🇸</div>

                <div className="space-y-3">
                  <span className="text-xs font-black tracking-widest uppercase text-amber-900 block">
                    REINO DE ESPAÑA • ACADEMIA DE LA LENGUA ESPAÑOLA
                  </span>
                  <h4 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                    Diploma de Nivel I (A1)
                  </h4>
                  <p className="text-xs text-slate-700 italic">
                    Conforme al Plan Curricular Oficial BAESP101 y Marco Común Europeo (MCER)
                  </p>

                  <div className="my-4 pt-2">
                    <p className="text-xs text-slate-600">Se certifica con honores que el viajero:</p>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      className="text-2xl font-black text-center text-[#8B2635] bg-transparent border-b-2 border-[#8B2635]/40 focus:outline-none w-full max-w-md my-1 font-serif"
                    />
                  </div>

                  <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                    Ha completado con éxito la expedición lingüística de 15 ciudades en <strong>¡Aventura Española!</strong> y superado el Examen Acumulativo con una calificación sobresaliente del <strong>{finalScore.scorePercent}%</strong>.
                  </p>

                  <div className="pt-6 border-t border-amber-900/20 flex items-center justify-between text-xs text-slate-800">
                    <div>
                      <p className="font-bold">Fecha de expedición:</p>
                      <p className="font-mono">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#8B2635] flex items-center justify-center text-xs font-bold text-[#8B2635]">
                      SELLO OFICIAL
                    </div>
                    <div>
                      <p className="font-bold">Código de Certificado:</p>
                      <p className="font-mono text-[11px]">{finalScore.certificateId}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Certificate Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {finalScore?.passed && (
                <button
                  onClick={handlePrint}
                  className="px-6 py-2.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#24140E] font-black text-xs flex items-center space-x-2 border-2 border-[#EADFCF] shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Diploma</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs shadow-lg transition-all"
              >
                Volver a La Fiesta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
