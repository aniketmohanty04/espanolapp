import React from 'react';
import { useGame } from '../context/GameContext';
import { City, Level, DifficultyTier } from '../types';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Star, 
  Lock, 
  Sparkles, 
  ShieldAlert, 
  Play, 
  Trophy, 
  BookOpen, 
  ChevronRight,
  Flame
} from 'lucide-react';

interface CityScreenProps {
  city: City;
  onBackToMap: () => void;
  onOpenLevel: (levelId: string) => void;
  onOpenBoss: () => void;
}

export const CityScreen: React.FC<CityScreenProps> = ({
  city,
  onBackToMap,
  onOpenLevel,
  onOpenBoss
}) => {
  const { progress } = useGame();

  const getTierBadge = (tier: DifficultyTier) => {
    switch (tier) {
      case 'easy':
        return { label: 'Fácil (Easy)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'medium':
        return { label: 'Medio (Medium)', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
      case 'tough':
        return { label: 'Exigente (Tough)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'hard':
        return { label: 'Difícil (Hard)', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
      case 'hot':
        return { label: 'Candente (Hot)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    }
  };

  const bossRecord = progress.completedBosses[city.id];
  const isBossPassed = Boolean(bossRecord?.passed);
  const completedLevels = city.levels.filter(l => Boolean(progress.completedLevels[l.id]));
  const allLevelsDone = completedLevels.length === 10;

  // Group levels into the 5 tiers (2 levels per tier)
  const tiersOrder: DifficultyTier[] = ['easy', 'medium', 'tough', 'hard', 'hot'];

  return (
    <div className="min-h-[calc(100vh-68px)] p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMap}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700 text-slate-200 text-sm font-medium border border-fiesta-border transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Mapa de España</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>{city.region}</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">{city.moduleName}</span>
        </div>
      </div>

      {/* Atmospheric City Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#171A2B] via-[#212640] to-[#1A182E] border border-fiesta-border/80 p-6 sm:p-8 shadow-2xl">
        <div 
          className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: city.accentColor }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-3 mb-2">
              <span className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                {city.number}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif tracking-tight">
                {city.name}
              </h1>
            </div>
            <p className="text-sm font-semibold text-amber-300/90 mb-2">
              Emblema: {city.landmark}
            </p>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {city.description}
            </p>
          </div>

          {/* Quick city progress summary badge */}
          <div className="bg-[#121422]/90 border border-fiesta-border/90 rounded-xl p-4 flex flex-col items-center justify-center min-w-[200px] text-center shrink-0">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Progreso de la Ciudad
            </span>
            <div className="text-2xl font-black text-amber-400">
              {completedLevels.length} / 10 Niveles
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500 rounded-full"
                style={{ width: `${(completedLevels.length / 10) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs font-semibold flex items-center space-x-1">
              {isBossPassed ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Jefe Superado ({bossRecord?.scorePercent}%)</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Jefe Pendiente</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Levels Grouped by 5 Tiers */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Niveles de Aprendizaje por Dificultad</span>
          </h2>
          <span className="text-xs text-slate-400">
            5 Dificultades • 2 Niveles por Nivel
          </span>
        </div>

        {tiersOrder.map(tier => {
          const tierLevels = city.levels.filter(l => l.tier === tier);
          const badge = getTierBadge(tier);

          return (
            <div 
              key={tier}
              className="p-5 rounded-2xl bg-[#141724] border border-fiesta-border/70 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {tierLevels.filter(l => Boolean(progress.completedLevels[l.id])).length} / 2 completados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tierLevels.map(level => {
                  const record = progress.completedLevels[level.id];
                  const isCompleted = Boolean(record);

                  return (
                    <div
                      key={level.id}
                      onClick={() => onOpenLevel(level.id)}
                      className={`p-4 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer group hover:scale-[1.01] ${
                        isCompleted
                          ? 'bg-[#1C2033] hover:bg-[#252A44] border-emerald-500/40 shadow-sm'
                          : 'bg-[#181B2B] hover:bg-[#22263C] border-slate-700 shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-400">
                            Nivel {level.levelNumber}
                          </span>
                          <div className="flex items-center space-x-1 text-amber-400">
                            {[1, 2, 3].map(starIndex => (
                              <Star
                                key={starIndex}
                                className={`w-3.5 h-3.5 ${
                                  record && record.stars >= starIndex
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-fiesta-yellow transition-colors">
                          {level.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {level.subtitle}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {level.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-sky-300/90 font-medium">
                          +{level.xpReward} XP • +{level.coinReward} monedas
                        </span>
                        <div className="flex items-center space-x-1 font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                          <span>{isCompleted ? 'Repasar' : 'Comenzar'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Boss Mission Encounter Gate */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2B1B1E] via-[#2A1E30] to-[#1B1F38] border-2 border-fiesta-red/60 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Misión de Jefe de la Ciudad • Umbral de Maestría: 80%</span>
            </div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{city.bossMission.badgeIcon}</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                {city.bossMission.title}
              </h3>
            </div>
            <p className="text-sm font-semibold text-amber-300 mb-2">
              Personaje: {city.bossMission.characterName} ({city.bossMission.characterRole})
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {city.bossMission.scenario}
            </p>

            {/* Boss learning objectives checklist */}
            <div className="space-y-1.5 mb-4">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Objetivos de la misión:</p>
              {city.bossMission.objectives.map(obj => (
                <div key={obj.id} className="flex items-center space-x-2 text-xs text-slate-300">
                  <span className="text-amber-400">✦</span>
                  <span>{obj.description}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-amber-200">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 font-bold">
                +{city.bossMission.coinReward} monedas de bonificación
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/30 font-bold">
                +{city.bossMission.xpReward} XP
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 font-bold">
                Desbloquea: {city.bossMission.badgeName}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="flex flex-col items-center justify-center shrink-0 min-w-[200px]">
            <button
              onClick={onOpenBoss}
              className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center space-x-2 ${
                isBossPassed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-fiesta-red to-amber-600 hover:from-red-600 hover:to-amber-500 text-white shadow-rose-600/30 glow-gold'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isBossPassed ? 'Reintentar Desafío' : 'Afrontar Desafío del Jefe'}</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              {isBossPassed 
                ? `Superado con éxito (${bossRecord?.scorePercent}%). Próxima ciudad desbloqueada.` 
                : 'Se requiere un mínimo de 80% para desbloquear la siguiente ciudad.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
