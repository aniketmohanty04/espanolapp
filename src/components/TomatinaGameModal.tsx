import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Sparkles, Flame, Clock, Play, RotateCcw } from 'lucide-react';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';

interface TomatinaGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Target {
  id: number;
  icon: string;
  name: string;
  points: number;
  holeIndex: number;
  splatted: boolean;
}

const TARGET_TYPES = [
  { icon: '🐂', name: 'Torito Bravo', points: 20 },
  { icon: '🪅', name: 'Piñata de Fiesta', points: 40 },
  { icon: '🎭', name: 'Máscara Festiva', points: 30 },
  { icon: '👑', name: 'Rey del Tomate', points: 50 },
  { icon: '☀️', name: 'Sol Valenciano', points: 25 },
  { icon: '🥖', name: 'Bocadillo Volador', points: 35 }
];

const GAME_DURATION_SECONDS = 25;

export const TomatinaGameModal: React.FC<TomatinaGameModalProps> = ({ isOpen, onClose }) => {
  const { awardCoins } = useGame();

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [splatHits, setSplatHits] = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  const [activeTargets, setActiveTargets] = useState<Target[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timers on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(GAME_DURATION_SECONDS);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setSplatHits([]);
    setActiveTargets([]);

    // 1-second countdown interval
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawn targets interval
    spawnRef.current = setInterval(() => {
      const hole = Math.floor(Math.random() * 6);
      const type = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)];

      const newTarget: Target = {
        id: Date.now() + Math.random(),
        icon: type.icon,
        name: type.name,
        points: type.points,
        holeIndex: hole,
        splatted: false
      };

      setActiveTargets(prev => {
        // Keep at most 3 simultaneous active targets
        const filtered = prev.filter(t => !t.splatted).slice(-2);
        return [...filtered, newTarget];
      });
    }, 850);
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    setGameState('finished');

    // Calculate coin reward based on score (1 coin per 2 points, min 50, max 250)
    setScore(finalScore => {
      const earnedCoins = Math.min(250, Math.max(50, Math.floor(finalScore / 2)));
      awardCoins(earnedCoins);
      return finalScore;
    });

    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch {
      // Safe fallback
    }
  };

  const handleHitTarget = (target: Target, event: React.MouseEvent<HTMLButtonElement>) => {
    if (target.splatted || gameState !== 'playing') return;

    // Mark as splatted
    setActiveTargets(prev => prev.map(t => t.id === target.id ? { ...t, splatted: true } : t));

    // Increase combo
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);

    // Multiplier calculation
    const multiplier = newCombo >= 6 ? 3 : newCombo >= 3 ? 2 : 1;
    const pointsEarned = target.points * multiplier;
    setScore(prev => prev + pointsEarned);

    // Spawn floating splat hit
    const rect = event.currentTarget.getBoundingClientRect();
    const hitId = `${Date.now()}-${Math.random()}`;
    setSplatHits(prev => [
      ...prev,
      {
        id: hitId,
        x: rect.left + rect.width / 2,
        y: rect.top,
        text: `+${pointsEarned} ${multiplier > 1 ? `(x${multiplier}!)` : ''}`
      }
    ]);

    setTimeout(() => {
      setSplatHits(prev => prev.filter(h => h.id !== hitId));
    }, 900);
  };

  const coinsAwarded = Math.min(250, Math.max(50, Math.floor(score / 2)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#FAF7F2] border-4 border-red-500 rounded-3xl shadow-2xl p-5 sm:p-7 text-[#24140E] my-auto animate-scaleUp">
        
        {/* Close Button */}
        <button
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (spawnRef.current) clearInterval(spawnRef.current);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#F2ECE1] hover:bg-[#E8DFD5] text-[#524136] transition-colors cursor-pointer"
          title="Cerrar juego"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 text-xs font-black uppercase tracking-wider mb-1.5">
            <span>🍅</span>
            <span>Tradición Española • Buñol (Valencia)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#24140E]">
            ¡La Batalla de la Tomatina!
          </h2>
          <p className="text-xs text-[#7A6B60] mt-0.5">
            ¡Lanza tomates a los objetivos que asoman en la plaza antes de que se acabe el tiempo!
          </p>
        </div>

        {/* HUD Bar during gameplay */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#EADFCF] mb-4 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-black text-rose-600">
            <Clock className="w-4 h-4" />
            <span className="text-base sm:text-lg font-mono">{timeLeft}s</span>
          </div>

          <div className="flex items-center space-x-1 text-xs font-black text-[#B45309] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <span>Puntos:</span>
            <span className="text-base font-black text-[#E05615]">{score}</span>
          </div>

          <div className="flex items-center space-x-1 text-xs font-black">
            <Flame className={`w-4 h-4 ${combo >= 3 ? 'text-orange-500 animate-bounce' : 'text-slate-400'}`} />
            <span className={combo >= 3 ? 'text-orange-600 font-extrabold' : 'text-slate-500'}>
              Racha: x{combo >= 6 ? 3 : combo >= 3 ? 2 : 1} ({combo})
            </span>
          </div>
        </div>

        {/* Floating Splats Overlay */}
        {splatHits.map(hit => (
          <div
            key={hit.id}
            className="fixed pointer-events-none z-50 text-rose-600 font-black text-base sm:text-lg animate-bounce drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex items-center space-x-1"
            style={{ left: hit.x - 40, top: hit.y - 20 }}
          >
            <span>🍅💥</span>
            <span>{hit.text}</span>
          </div>
        ))}

        {/* Gameplay Arena (6 Wooden Festival Windows) */}
        {gameState === 'playing' ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 rounded-3xl bg-gradient-to-b from-[#EFE5D8] to-[#DFCBB5] border-4 border-[#8B5E3C] shadow-inner mb-4">
            {[0, 1, 2, 3, 4, 5].map((holeIdx) => {
              const currentTarget = activeTargets.find(t => t.holeIndex === holeIdx && !t.splatted);

              return (
                <div
                  key={holeIdx}
                  className="relative aspect-square rounded-2xl bg-[#523A28] border-4 border-[#3D2617] shadow-inner overflow-hidden flex flex-col items-center justify-center select-none"
                >
                  {/* Barrel / Window Silhouette */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[#70482C] border-t-2 border-[#8B5E3C] z-10 pointer-events-none" />

                  {currentTarget ? (
                    <button
                      onClick={(e) => handleHitTarget(currentTarget, e)}
                      className="relative z-20 w-full h-full flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer group"
                    >
                      <span className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] animate-bounce">
                        {currentTarget.icon}
                      </span>
                      <span className="text-[10px] font-black text-amber-200 bg-black/60 px-1.5 py-0.5 rounded-full mt-1 border border-white/20">
                        +{currentTarget.points}
                      </span>
                    </button>
                  ) : (
                    <span className="text-2xl text-stone-600 opacity-20">🕳️</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : gameState === 'finished' ? (
          /* Victory Result Screen */
          <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 text-center space-y-4 mb-4 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-3xl">
                🍅
              </div>
            </div>

            <div>
              <span className="text-xs font-black uppercase text-rose-600 tracking-wider">
                ¡Gran Tomatazo Final!
              </span>
              <h3 className="text-2xl font-black font-serif text-[#24140E] mt-1">
                {score >= 300 ? '¡Maestro Lanzador de Buñol!' : score >= 150 ? '¡Buen Lanzador Festivo!' : '¡Buen Intento Tomatero!'}
              </h3>
              <p className="text-xs text-[#7A6B60] mt-1">
                Has conseguido <strong>{score} puntos</strong> con una racha máxima de <strong>{maxCombo} seguidos</strong>.
              </p>
            </div>

            {/* Reward Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-amber-300 shadow-xs max-w-xs mx-auto flex items-center justify-center space-x-3 text-base font-black text-[#B45309]">
              <Trophy className="w-5 h-5 text-[#E05615]" />
              <span>+{coinsAwarded} Monedas de Oro 🪙</span>
            </div>
          </div>
        ) : (
          /* Start Screen */
          <div className="p-6 rounded-3xl bg-[#FFF8EE] border-2 border-amber-300 text-center space-y-4 mb-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-4xl shadow-inner animate-pulse">
              🍅
            </div>
            <div>
              <h3 className="text-xl font-black font-serif text-[#24140E]">
                ¿Listo para la Gran Tomatina?
              </h3>
              <p className="text-xs text-[#7A6B60] max-w-sm mx-auto mt-1 leading-relaxed">
                Tienes <strong>25 segundos</strong>. Toca con rapidez los toritos, piñatas y máscaras para encadenar combos y ganar hasta <strong>250 monedas</strong> para tu viaje.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="space-y-2">
          {gameState === 'idle' ? (
            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-base shadow-xl hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>¡Empezar la Batalla de Tomates!</span>
            </button>
          ) : gameState === 'finished' ? (
            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] text-white font-black text-base shadow-xl hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>¡Jugar Otra Ronda!</span>
            </button>
          ) : (
            <button
              onClick={endGame}
              className="w-full py-3 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs border border-rose-300 transition-colors cursor-pointer"
            >
              Terminar Ronda Anticipadamente
            </button>
          )}

          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              if (spawnRef.current) clearInterval(spawnRef.current);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] font-bold text-xs border border-[#E0D5C7] transition-colors"
          >
            Volver a la Plaza del Festival
          </button>
        </div>

      </div>
    </div>
  );
};
export default TomatinaGameModal;
