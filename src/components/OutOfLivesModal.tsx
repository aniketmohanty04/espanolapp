import React from 'react';
import { Heart, Coins, Clock, X, Sparkles, AlertCircle } from 'lucide-react';
import { useGame, useLifeCountdown } from '../context/GameContext';

interface OutOfLivesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const formatLifeTimer = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const OutOfLivesModal: React.FC<OutOfLivesModalProps> = ({ isOpen, onClose }) => {
  const { progress, refillLivesWithCoins } = useGame();
  const secondsUntilNextLife = useLifeCountdown();

  if (!isOpen) return null;

  const currentCoins = progress.stats.coins;
  const currentLives = typeof progress.stats.lives === 'number' ? Math.min(3, Math.max(0, progress.stats.lives)) : 3;
  const canAffordRefill = currentCoins >= 500 && currentLives < 3;

  const handleRefill = () => {
    const res = refillLivesWithCoins();
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#FAF7F2] border-4 border-[#EADFCF] rounded-3xl shadow-2xl p-6 sm:p-7 text-[#24140E] my-auto animate-scaleUp">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F2ECE1] hover:bg-[#E8DFD5] text-[#524136] transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-3xl shadow-inner">
            {currentLives === 0 ? '💔' : currentLives < 3 ? '❤️' : '💖'}
          </div>
          <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
            currentLives === 0 
              ? 'text-rose-600 bg-rose-50 border-rose-200' 
              : currentLives < 3
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            {currentLives} / 3 Vidas Disponibles
          </span>
          <h2 className="text-2xl font-black font-serif text-[#24140E] mt-2 tracking-tight">
            {currentLives === 0 
              ? '¡Te has quedado sin vidas!' 
              : currentLives < 3 
              ? 'Estado de Vidas y Corazones' 
              : '¡Tus vidas están al máximo!'}
          </h2>
          <p className="text-xs text-[#7D6B5E] mt-1 leading-relaxed">
            {currentLives === 0
              ? 'Has agotado tus 3 vidas en los desafíos. Elige cómo quieres continuar tu aventura:'
              : currentLives < 3
              ? `Tienes ${currentLives} de 3 vidas. Puedes recargar las 3 vidas completas de inmediato por 500 monedas o esperar a que se regeneren gratis.`
              : 'Tienes tus 3 vidas completas listas para cualquier desafío en el camino.'}
          </p>
        </div>

        {/* Option 1: Instant Refill for 500 Coins */}
        <div className={`p-4 rounded-2xl border-2 mb-3.5 transition-all ${
          canAffordRefill 
            ? 'bg-amber-500/10 border-amber-400/60 shadow-xs' 
            : 'bg-stone-100 border-stone-200 opacity-90'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🪙</span>
              <div>
                <h4 className="font-black text-sm text-[#24140E]">Recargar 3 Vidas Ahora</h4>
                <p className="text-[11px] text-[#6B584D]">Restaura tus 3 corazones de inmediato</p>
              </div>
            </div>
            <span className="font-black text-sm text-[#B45309]">500 🪙</span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-amber-300/30 mb-3">
            <span className="text-[#6B584D]">Tus monedas actuales:</span>
            <span className="font-extrabold text-[#24140E]">{currentCoins.toLocaleString()} 🪙</span>
          </div>

          <button
            onClick={handleRefill}
            disabled={!canAffordRefill}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
              currentLives >= 3
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : canAffordRefill
                ? 'bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white active:scale-98 cursor-pointer'
                : 'bg-stone-200 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {currentLives >= 3
                ? 'Vidas ya completas (3/3 ❤️)'
                : canAffordRefill 
                ? 'Gastar 500 Monedas y Recargar 3 Vidas' 
                : `Monedas insuficientes (Faltan ${500 - currentCoins} 🪙)`}
            </span>
          </button>
        </div>

        {/* Option 2: 15-Minute Passive Regeneration */}
        <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-200 mb-4 text-[#0C4A6E]">
          <div className="flex items-start space-x-3 mb-2">
            <Clock className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-sm text-sky-950">Regeneración Gratuita de Vida</h4>
              <p className="text-[11px] text-sky-800 leading-relaxed mt-0.5">
                Si no tienes 500 monedas, descansa un momento: <strong>recibes 1 vida gratis cada 15 minutos</strong> hasta completar 3.
              </p>
            </div>
          </div>

          {/* Countdown timer pill */}
          <div className="mt-3 p-3 rounded-xl bg-white border border-sky-300 flex items-center justify-between shadow-xs">
            <span className="text-xs font-bold text-sky-900">
              {currentLives >= 3 ? 'Estado actual:' : 'Próxima vida gratis en:'}
            </span>
            <span className="font-mono font-black text-base text-rose-600 tracking-wider">
              {currentLives >= 3 ? '✅ 3/3 Vidas Llenas' : `⏱️ ${formatLifeTimer(secondsUntilNextLife)}`}
            </span>
          </div>
        </div>

        {/* Back / Close button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#524136] font-bold text-xs border border-[#E0D5C7] transition-colors cursor-pointer"
        >
          Volver a Explorar la Ciudad
        </button>

      </div>
    </div>
  );
};

export default OutOfLivesModal;
