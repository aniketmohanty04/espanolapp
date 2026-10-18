import React, { useState } from 'react';
import { X, Sparkles, Coins, Heart, RotateCcw, PartyPopper } from 'lucide-react';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';

interface FestivalFortuneWheelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WheelPrize {
  id: string;
  label: string;
  shortText: string;
  icon: string;
  color: string;
  textColor: string;
  type: 'coins' | 'life' | 'xp' | 'special';
  coinAmount?: number;
  xpAmount?: number;
  description: string;
}

const PRIZES: WheelPrize[] = [
  {
    id: 'jackpot-500',
    label: '¡El Gordo! 500 Monedas',
    shortText: '500 🪙',
    icon: '🏆',
    color: '#F59E0B', // Amber gold
    textColor: '#78350F',
    type: 'coins',
    coinAmount: 500,
    description: '¡Premio gordo de la fiesta! +500 monedas de oro para tu aventura.'
  },
  {
    id: 'life-bonus',
    label: '+1 Vida de Fiesta',
    shortText: '+1 ❤️',
    icon: '💖',
    color: '#E11D48', // Rose
    textColor: '#FFFFFF',
    type: 'life',
    description: '¡Recuperas 1 corazón de vida gratis para afrontar cualquier misión!'
  },
  {
    id: 'coins-100',
    label: '100 Monedas de Feria',
    shortText: '100 🪙',
    icon: '🪙',
    color: '#F97316', // Orange
    textColor: '#FFFFFF',
    type: 'coins',
    coinAmount: 100,
    description: 'Una generosa bolsa de 100 monedas para gastar en el mercado o en vidas.'
  },
  {
    id: 'tapa-xp',
    label: 'Churros & Jamón Ibérico',
    shortText: 'Tapa 🥖',
    icon: '🥖',
    color: '#10B981', // Emerald
    textColor: '#FFFFFF',
    type: 'xp',
    coinAmount: 75,
    xpAmount: 80,
    description: 'Deliciosa degustación gastronómica: +75 monedas y +80 XP.'
  },
  {
    id: 'coins-250',
    label: '250 Monedas de Oro',
    shortText: '250 🪙',
    icon: '💰',
    color: '#8B5CF6', // Purple
    textColor: '#FFFFFF',
    type: 'coins',
    coinAmount: 250,
    description: '¡Gran premio intermedio! 250 monedas añadidas a tu faltriquera.'
  },
  {
    id: 'fireworks-prize',
    label: 'Castillo Pirotécnico',
    shortText: 'Traca 🎆',
    icon: '🎆',
    color: '#0284C7', // Sky
    textColor: '#FFFFFF',
    type: 'special',
    coinAmount: 150,
    description: '¡Espectacular traca valenciana con +150 monedas y fuegos artificiales!'
  },
  {
    id: 'coins-150',
    label: '150 Monedas Festivas',
    shortText: '150 🪙',
    icon: '🪙',
    color: '#D97706', // Ochre
    textColor: '#FFFFFF',
    type: 'coins',
    coinAmount: 150,
    description: '¡Monedas frescas de la feria: +150 monedas de oro!'
  },
  {
    id: 'abanico-lucky',
    label: 'Abanico de la Suerte',
    shortText: 'Abanico 🪭',
    icon: '🪭',
    color: '#E05615', // Terracotta
    textColor: '#FFFFFF',
    type: 'xp',
    coinAmount: 75,
    xpAmount: 60,
    description: 'El abanico tradicional de Triana te da buen augurio: +75 monedas y +60 XP.'
  }
];

const SPIN_COST = 30;

export const FestivalFortuneWheel: React.FC<FestivalFortuneWheelProps> = ({ isOpen, onClose }) => {
  const { progress, awardCoins, awardLife } = useGame();
  
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [hasFreeSpin, setHasFreeSpin] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentCoins = progress.stats.coins;
  const canAffordSpin = hasFreeSpin || currentCoins >= SPIN_COST;

  const handleSpin = () => {
    if (isSpinning || !canAffordSpin) return;

    if (!hasFreeSpin) {
      awardCoins(-SPIN_COST);
    } else {
      setHasFreeSpin(false);
    }

    setWonPrize(null);
    setIsSpinning(true);

    // Pick a random prize
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIndex];

    // Total wedges = 8 (45 deg per slice)
    // Slice 0 center is at 22.5 deg, etc.
    const sliceAngle = 360 / PRIZES.length; // 45 deg
    const targetOffset = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);

    // At least 5 full rotations (1800 deg)
    const extraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
    const currentBase = Math.floor(rotationDegrees / 360) * 360;
    const finalAngle = currentBase + extraRotations + targetOffset;

    setRotationDegrees(finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize);

      // Award prize
      if (prize.coinAmount) {
        awardCoins(prize.coinAmount);
      }
      if (prize.type === 'life') {
        awardLife();
      }

      // Confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback
      }
    }, 4200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] border-4 border-[#F3B33D] rounded-3xl shadow-2xl p-6 sm:p-7 text-[#24140E] my-auto animate-scaleUp">
        
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F2ECE1] hover:bg-[#E8DFD5] text-[#524136] transition-colors cursor-pointer disabled:opacity-50"
          title="Cerrar ruleta"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-[#B45309] border border-amber-300 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#E05615]" />
            <span>Feria Tradicional Española</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#24140E] tracking-tight">
            🎡 La Gran Ruleta de la Fortuna
          </h2>
          <p className="text-xs text-[#7A6B60] mt-1">
            Gira la ruleta festiva y gana monedas de oro, vidas extra y delicias gastronómicas.
          </p>
        </div>

        {/* Wheel Container with Pointer Needle */}
        <div className="relative flex flex-col items-center justify-center my-4">
          
          {/* Wheel Pointer Needle (Top) */}
          <div className="absolute -top-3 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-rose-600 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] animate-pulse" />
            <div className="w-3.5 h-3.5 -mt-6 rounded-full bg-amber-300 border-2 border-white shadow" />
          </div>

          {/* Golden Wheel Outer Ring */}
          <div className="relative p-3 rounded-full bg-gradient-to-tr from-[#B45309] via-[#F59E0B] to-[#FDE68A] shadow-2xl border-4 border-amber-600">
            
            {/* Embedded Circular Wheel with SVG slices */}
            <div
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-inner relative"
              style={{
                transform: `rotate(${rotationDegrees}deg)`,
                transition: isSpinning ? 'transform 4.2s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {PRIZES.map((prize, idx) => {
                  const angle = 360 / PRIZES.length; // 45 deg
                  const startAngle = (idx * angle) * (Math.PI / 180);
                  const endAngle = ((idx + 1) * angle) * (Math.PI / 180);

                  const x1 = 50 + 50 * Math.cos(startAngle);
                  const y1 = 50 + 50 * Math.sin(startAngle);
                  const x2 = 50 + 50 * Math.cos(endAngle);
                  const y2 = 50 + 50 * Math.sin(endAngle);

                  const midAngle = (idx * angle + angle / 2) * (Math.PI / 180);
                  const tx = 50 + 32 * Math.cos(midAngle);
                  const ty = 50 + 32 * Math.sin(midAngle);

                  return (
                    <g key={prize.id}>
                      <path
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                        fill={prize.color}
                        stroke="#FFF8EE"
                        strokeWidth="1.2"
                      />
                      <g transform={`translate(${tx}, ${ty}) rotate(${idx * angle + angle / 2 + 90})`}>
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={prize.textColor}
                          fontSize="5.2"
                          fontWeight="900"
                        >
                          {prize.shortText}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Wheel Center Hub */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-white shadow-xl flex items-center justify-center text-xl">
                <span>🇪🇸</span>
              </div>
            </div>

          </div>
        </div>

        {/* Won Prize Celebration Card */}
        {wonPrize && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400 text-center animate-scaleUp mb-3">
            <span className="text-xs font-black uppercase text-[#B45309] tracking-wider block mb-1">
              🎉 ¡Felicidades! Has ganado:
            </span>
            <div className="flex items-center justify-center space-x-2 text-xl font-black text-[#24140E]">
              <span>{wonPrize.icon}</span>
              <span>{wonPrize.label}</span>
            </div>
            <p className="text-xs text-[#7A6B60] mt-1 font-medium">
              {wonPrize.description}
            </p>
          </div>
        )}

        {/* Spin Cost & Balance Bar */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white border border-[#E8DFD5] mb-4">
          <div className="flex items-center space-x-1.5 font-bold text-[#6B584D]">
            <span>Tus monedas:</span>
            <span className="text-[#24140E] font-black text-sm">{currentCoins.toLocaleString()} 🪙</span>
          </div>
          <div className="flex items-center space-x-1.5 font-bold">
            <span className="text-[#6B584D]">Coste por tirada:</span>
            {hasFreeSpin ? (
              <span className="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                ¡GRATIS!
              </span>
            ) : (
              <span className="text-[#B45309] font-black">{SPIN_COST} 🪙</span>
            )}
          </div>
        </div>

        {/* Action Button: Spin */}
        <div className="space-y-2">
          <button
            onClick={handleSpin}
            disabled={isSpinning || !canAffordSpin}
            className={`w-full py-4 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center space-x-2.5 cursor-pointer ${
              isSpinning
                ? 'bg-amber-400/80 text-white cursor-wait'
                : canAffordSpin
                ? 'bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white hover:scale-[1.02] active:scale-98 shadow-orange-500/20'
                : 'bg-stone-200 text-stone-500 cursor-not-allowed'
            }`}
          >
            {isSpinning ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                <span>Girando la Ruleta...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {hasFreeSpin
                    ? '¡Tirar Gratis Ahora!'
                    : canAffordSpin
                    ? `Girar por ${SPIN_COST} Monedas 🪙`
                    : `Monedas insuficientes (Faltan ${SPIN_COST - currentCoins} 🪙)`}
                </span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isSpinning}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] font-bold text-xs border border-[#E0D5C7] transition-colors"
          >
            Volver a la Fiesta
          </button>
        </div>

      </div>
    </div>
  );
};
export default FestivalFortuneWheel;
