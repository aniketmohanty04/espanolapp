import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { FESTIVAL_STALLS, FESTIVAL_CHARACTERS } from '../data/festivalData';
import { FestivalStall, FestivalCharacter } from '../types';
import { soundService } from '../services/soundService';
import { 
  ArrowLeft, 
  PartyPopper, 
  Sparkles, 
  Award, 
  Coins, 
  CheckCircle2, 
  Volume2, 
  MessageCircle, 
  Trophy, 
  GraduationCap,
  Store,
  Users
} from 'lucide-react';

interface FestivalWorldProps {
  onBackToMap: () => void;
  onStartFinalAssessment: () => void;
}

export const FestivalWorld: React.FC<FestivalWorldProps> = ({
  onBackToMap,
  onStartFinalAssessment
}) => {
  const { progress, visitFestivalStall } = useGame();

  const [selectedCharacter, setSelectedCharacter] = useState<FestivalCharacter>(FESTIVAL_CHARACTERS[0]);
  const [activeStallQuiz, setActiveStallQuiz] = useState<FestivalStall | null>(null);
  const [stallAnswer, setStallAnswer] = useState<string>('');
  const [stallFeedback, setStallFeedback] = useState<{ isCorrect: boolean; show: boolean }>({
    isCorrect: false,
    show: false
  });

  const leftStalls = FESTIVAL_STALLS.filter(s => s.side === 'left');
  const rightStalls = FESTIVAL_STALLS.filter(s => s.side === 'right');

  const handleOpenStall = (stall: FestivalStall) => {
    setActiveStallQuiz(stall);
    setStallAnswer('');
    setStallFeedback({ isCorrect: false, show: false });
    if (stall.miniQuiz.audioText) {
      soundService.speakSpanish(stall.miniQuiz.audioText);
    }
  };

  const handleCheckStallQuiz = () => {
    if (!activeStallQuiz || !stallAnswer) return;
    const q = activeStallQuiz.miniQuiz;

    let correct = false;
    if (Array.isArray(q.correctAnswer)) {
      correct = q.correctAnswer.some(a => a.toLowerCase().trim() === stallAnswer.toLowerCase().trim());
    } else {
      correct = q.correctAnswer.toLowerCase().trim() === stallAnswer.toLowerCase().trim();
    }

    setStallFeedback({ isCorrect: correct, show: true });
    if (correct) {
      visitFestivalStall(activeStallQuiz.id, activeStallQuiz.rewardCoins);
    } else {
      soundService.playIncorrect();
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Breadcrumb & Return to Map */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMap}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700 text-slate-200 text-sm font-medium border border-fiesta-border transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Mapa de España</span>
        </button>

        <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 font-bold border border-amber-400/40">
          El Gran Mundo Final: La Gran Fiesta
        </span>
      </div>

      {/* Hero Festive Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2F1522] via-[#2A1E38] to-[#1B2640] border-2 border-amber-400/60 p-6 sm:p-10 shadow-2xl text-center">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs sm:text-sm font-black tracking-wider uppercase glow-gold">
            <PartyPopper className="w-4 h-4" />
            <span>¡Bienvenidos a La Gran Fiesta Española!</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
            La Plaza Mayor de la Celebración
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            Has cruzado los valles, castillos y mares de las 15 ciudades. Visita los puestos tradicionales a ambos lados de la plaza, conversa con los amigos que conociste en el viaje y culmina tu aventura presentándote al <strong>Examen Oficial Acumulativo BAESP101</strong>.
          </p>

          <div className="pt-2">
            <button
              onClick={onStartFinalAssessment}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-black text-base sm:text-lg shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 mx-auto glow-gold"
            >
              <GraduationCap className="w-6 h-6" />
              <span>Realizar Examen Oficial Acumulativo BAESP101</span>
            </button>
            <p className="text-xs text-amber-200/80 mt-2 font-medium">
              30 preguntas que cubren los 5 módulos • Genera Diploma Oficial de A1
            </p>
          </div>
        </div>
      </div>

      {/* Main Plaza Arena: Left Stalls, Center Character Stage, Right Stalls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Stalls 1 to 3 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Store className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white">Pabellones Izquierdos</h2>
          </div>

          {leftStalls.map(stall => {
            const visited = progress.festivalVisitedStalls.includes(stall.id);
            return (
              <div
                key={stall.id}
                onClick={() => handleOpenStall(stall)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                  visited
                    ? 'bg-[#1A2234] border-emerald-500/50'
                    : 'bg-[#181B2B] hover:bg-[#22273D] border-amber-500/30 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    {stall.vendorName}
                  </span>
                  {visited && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completado</span>
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{stall.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{stall.description}</p>
                <div className="mt-2.5 flex items-center justify-between text-xs text-amber-300 font-semibold pt-2 border-t border-slate-800">
                  <span>+{stall.rewardCoins} monedas</span>
                  <span className="text-[11px] text-slate-400">Probar reto →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Arena: Selectable Characters Stage */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-extrabold text-white">Personajes de las 15 Ciudades</h2>
            </div>
            <span className="text-xs text-slate-400">Selecciona un amigo para charlar</span>
          </div>

          {/* Character Selector Pills Grid */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {FESTIVAL_CHARACTERS.map(char => (
              <button
                key={char.id}
                onClick={() => {
                  setSelectedCharacter(char);
                  soundService.speakSpanish(char.dialogue);
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  selectedCharacter.id === char.id
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-white shadow-md scale-105'
                    : 'bg-fiesta-card hover:bg-slate-700 text-slate-300 border-fiesta-border'
                }`}
              >
                <span className="text-base">{char.avatar}</span>
                <span>{char.name}</span>
              </button>
            ))}
          </div>

          {/* Active Selected Character Stage Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1C2033] to-[#151726] border border-fiesta-border shadow-xl space-y-4 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-3xl shadow-lg border border-amber-300">
                  {selectedCharacter.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {selectedCharacter.name}
                  </h3>
                  <p className="text-xs font-semibold text-amber-300">
                    {selectedCharacter.role} • {selectedCharacter.originCity}
                  </p>
                </div>
              </div>

              <button
                onClick={() => soundService.speakSpanish(selectedCharacter.dialogue)}
                className="p-2.5 rounded-full bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                title="Escuchar saludo"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Speech bubble */}
            <div className="p-4 rounded-xl bg-[#0E101A] border border-slate-700/80 text-sm text-slate-100 font-medium leading-relaxed">
              "{selectedCharacter.dialogue}"
            </div>

            {/* English translation */}
            <div className="p-3 rounded-xl bg-slate-900/50 text-xs text-slate-400 italic">
              <strong>English translation:</strong> "{selectedCharacter.englishDialogue}"
            </div>

            {/* Cultural trivia pill */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <span className="font-bold text-amber-300 block mb-0.5">💡 Sabiduría de {selectedCharacter.originCity}:</span>
              <p>{selectedCharacter.trivia}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Stalls 4 to 6 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Store className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-extrabold text-white">Pabellones Derechos</h2>
          </div>

          {rightStalls.map(stall => {
            const visited = progress.festivalVisitedStalls.includes(stall.id);
            return (
              <div
                key={stall.id}
                onClick={() => handleOpenStall(stall)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                  visited
                    ? 'bg-[#1A2234] border-emerald-500/50'
                    : 'bg-[#181B2B] hover:bg-[#22273D] border-purple-500/30 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    {stall.vendorName}
                  </span>
                  {visited && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completado</span>
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{stall.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{stall.description}</p>
                <div className="mt-2.5 flex items-center justify-between text-xs text-amber-300 font-semibold pt-2 border-t border-slate-800">
                  <span>+{stall.rewardCoins} monedas</span>
                  <span className="text-[11px] text-slate-400">Probar reto →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini Stall Quiz Modal */}
      {activeStallQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#141724] border-2 border-amber-400 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {activeStallQuiz.spanishTitle}
                </span>
                <h3 className="text-lg font-bold text-white">{activeStallQuiz.title}</h3>
              </div>
              <button
                onClick={() => setActiveStallQuiz(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm sm:text-base font-semibold text-white">
                {activeStallQuiz.miniQuiz.prompt}
              </p>

              {activeStallQuiz.miniQuiz.options ? (
                <div className="space-y-2">
                  {activeStallQuiz.miniQuiz.options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={stallFeedback.show && stallFeedback.isCorrect}
                      onClick={() => setStallAnswer(opt)}
                      className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all ${
                        stallAnswer === opt
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  disabled={stallFeedback.show && stallFeedback.isCorrect}
                  value={stallAnswer}
                  onChange={e => setStallAnswer(e.target.value)}
                  placeholder="Tu respuesta..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              )}

              {stallFeedback.show && (
                <div className={`p-3 rounded-xl border text-xs ${
                  stallFeedback.isCorrect
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500 text-rose-200'
                }`}>
                  <p className="font-bold">
                    {stallFeedback.isCorrect 
                      ? `¡Correcto! Has ganado +${activeStallQuiz.rewardCoins} monedas y la insignia: ${activeStallQuiz.rewardBadge}.` 
                      : 'Incorrecto. Vuelve a intentarlo.'}
                  </p>
                  <p className="mt-1 text-slate-300">{activeStallQuiz.miniQuiz.explanation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleCheckStallQuiz}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
              >
                Comprobar
              </button>
              {stallFeedback.isCorrect && (
                <button
                  onClick={() => setActiveStallQuiz(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Continuar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
