import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Coins, 
  Sparkles, 
  Flame, 
  Map as MapIcon, 
  BookOpen, 
  Calendar, 
  Award, 
  Trophy, 
  PartyPopper, 
  Volume2, 
  VolumeX, 
  Settings, 
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  onOpenMap: () => void;
  onOpenNotebook: () => void;
  onOpenStudyPlan: () => void;
  onOpenSyllabus: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
  onOpenFestival: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMap,
  onOpenNotebook,
  onOpenStudyPlan,
  onOpenSyllabus,
  onOpenAchievements,
  onOpenSettings,
  onOpenFestival
}) => {
  const { progress, soundMuted, toggleSound } = useGame();
  const mistakeCount = Object.values(progress.incorrectQuestions).filter(q => !q.mastered).length;
  const allCitiesCompleted = progress.unlockedCityIds.length >= 15 && Object.keys(progress.completedBosses).length >= 15;

  return (
    <header className="sticky top-0 z-40 bg-[#121420]/95 backdrop-blur-md border-b border-fiesta-border shadow-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand logo & title */}
        <button
          onClick={onOpenMap}
          className="flex items-center space-x-2 text-left group focus:outline-none"
        >
          <span className="text-3xl filter drop-shadow">🇪🇸</span>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-fiesta-yellow transition-colors font-serif">
                ¡Aventura Española!
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-fiesta-red/30 text-amber-300 border border-fiesta-red/50 font-semibold">
                Nivel I (A1)
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Aprende español viajando por España</p>
          </div>
        </button>

        {/* Player stats indicators */}
        <div className="flex items-center space-x-2 sm:space-x-4 bg-[#1C1F30] px-3.5 py-1.5 rounded-full border border-fiesta-border/70 text-sm">
          {/* Coins */}
          <div className="flex items-center space-x-1.5 text-amber-300 font-bold" title="Monedas de oro">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>{progress.stats.coins.toLocaleString()}</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* XP & Level */}
          <div className="flex items-center space-x-1.5 text-sky-300 font-semibold" title={`Nivel ${progress.stats.level} (${progress.stats.xp} XP)`}>
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Nv. {progress.stats.level}</span>
            <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden hidden md:block">
              <div 
                className="h-full bg-sky-400 transition-all duration-500 rounded-full"
                style={{ width: `${(progress.stats.xp % 300) / 3}%` }}
              />
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Daily streak */}
          <div className="flex items-center space-x-1 text-orange-400 font-bold" title="Racha de días de estudio">
            <Flame className="w-4 h-4 fill-orange-400 text-orange-400 animate-pulse" />
            <span>{progress.stats.streak}d</span>
          </div>
        </div>

        {/* Action navigation buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* World map */}
          <button
            onClick={onOpenMap}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700/80 text-slate-200 text-xs sm:text-sm font-medium border border-fiesta-border transition-all"
            title="Mapa de España"
          >
            <MapIcon className="w-4 h-4 text-fiesta-yellow" />
            <span className="hidden md:inline">Mapa</span>
          </button>

          {/* Review Notebook (Cuaderno de Repaso) */}
          <button
            onClick={onOpenNotebook}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700/80 text-slate-200 text-xs sm:text-sm font-medium border border-fiesta-border transition-all"
            title="Cuaderno de Repaso de Errores"
          >
            <BookOpen className="w-4 h-4 text-rose-400" />
            <span className="hidden md:inline">Repaso</span>
            {mistakeCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full animate-bounce shadow">
                {mistakeCount}
              </span>
            )}
          </button>

          {/* 35-day study plan */}
          <button
            onClick={onOpenStudyPlan}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700/80 text-slate-200 text-xs sm:text-sm font-medium border border-fiesta-border transition-all"
            title="Plan de Estudio 35 Días"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Plan</span>
          </button>

          {/* Syllabus BAESP101 matrix */}
          <button
            onClick={onOpenSyllabus}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700/80 text-slate-200 text-xs sm:text-sm font-medium border border-fiesta-border transition-all"
            title="Matriz de Cobertura del Sílabo BAESP101"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Sílabo</span>
          </button>

          {/* Achievements */}
          <button
            onClick={onOpenAchievements}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-fiesta-card hover:bg-slate-700/80 text-slate-200 text-xs sm:text-sm font-medium border border-fiesta-border transition-all"
            title="Logros y Trofeos"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="hidden lg:inline">Logros</span>
          </button>

          {/* La Gran Fiesta button */}
          <button
            onClick={onOpenFestival}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-amber-500/20 transition-all border border-amber-300/40 glow-gold"
            title="La Gran Fiesta y Examen Oficial"
          >
            <PartyPopper className="w-4 h-4 text-amber-200" />
            <span>La Fiesta</span>
          </button>

          {/* Sound mute toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-fiesta-card hover:bg-slate-700 text-slate-300 border border-fiesta-border transition-colors"
            title={soundMuted ? 'Activar sonido' : 'Silenciar sonido'}
            aria-label="Toggle sound"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-fiesta-card hover:bg-slate-700 text-slate-300 border border-fiesta-border transition-colors"
            title="Ajustes y copia de seguridad"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
