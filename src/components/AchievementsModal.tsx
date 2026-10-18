import React from 'react';
import { useGame } from '../context/GameContext';
import { INITIAL_ACHIEVEMENTS } from '../data/achievementsData';
import { X, Trophy, Award, CheckCircle2, Lock } from 'lucide-react';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { progress } = useGame();

  const total = INITIAL_ACHIEVEMENTS.length;
  const unlockedCount = INITIAL_ACHIEVEMENTS.filter(a => Boolean(progress.achievements[a.id])).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#24140E]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-[#B45309] flex items-center justify-center border border-amber-300">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-[#24140E] font-serif">Logros y Trofeos de España</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-[#B45309] font-black border border-amber-300">
                  {unlockedCount} / {total} Desbloqueados
                </span>
              </div>
              <p className="text-xs text-[#7A6B60] font-medium">
                Insignias conseguidas superando niveles, derrotando jefes y manteniendo la racha.
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

        {/* Progress Bar */}
        <div className="w-full bg-[#EADFCF] h-2.5">
          <div 
            className="h-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] transition-all duration-500"
            style={{ width: `${(unlockedCount / total) * 100}%` }}
          />
        </div>

        {/* Achievements Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto grow grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {INITIAL_ACHIEVEMENTS.map(ach => {
            const unlockedDate = progress.achievements[ach.id];
            const isUnlocked = Boolean(unlockedDate);

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border-2 transition-all flex items-start space-x-3.5 text-left ${
                  isUnlocked
                    ? 'bg-white border-amber-300 shadow-sm'
                    : 'bg-[#F5EDE2]/60 border-dashed border-[#E0D5C7] opacity-75'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                    isUnlocked
                      ? 'bg-[#FFF8EE] border-amber-300 shadow-xs'
                      : 'bg-white border-[#E0D5C7]'
                  }`}
                >
                  {isUnlocked ? ach.icon : <Lock className="w-5 h-5 text-[#8C7A6B]" />}
                </div>

                <div className="space-y-1 grow">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-black ${isUnlocked ? 'text-[#24140E]' : 'text-[#7A6B60]'}`}>
                      {ach.title}
                    </h3>
                    {isUnlocked && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 font-extrabold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Conseguido</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B584D] leading-relaxed">
                    {ach.description}
                  </p>
                  {isUnlocked && (
                    <p className="text-[10px] text-[#8C7A6B] font-mono">
                      {new Date(unlockedDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
