import React, { useState } from 'react';
import { useGame, useLifeCountdown } from '../context/GameContext';
import { PlayerAvatar } from './PlayerAvatar';
import { 
  Coins, 
  Flame, 
  Star, 
  Sparkles,
  Map as MapIcon, 
  BookOpen, 
  Calendar, 
  Award, 
  Trophy, 
  PartyPopper, 
  Settings, 
  User,
  Menu,
  X,
  ChevronRight,
  UserCog,
  Compass,
  Home,
  LogOut,
  Cloud,
  Heart
} from 'lucide-react';
import { supabaseService } from '../services/supabaseClient';
import { formatLifeTimer } from './OutOfLivesModal';

interface NavbarProps {
  onOpenHub?: () => void;
  onOpenMap: () => void;
  onOpenNotebook: () => void;
  onOpenStudyPlan: () => void;
  onOpenSyllabus: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
  onOpenFestival: () => void;
  onOpenLivesModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHub,
  onOpenMap,
  onOpenNotebook,
  onOpenStudyPlan,
  onOpenSyllabus,
  onOpenAchievements,
  onOpenSettings,
  onOpenFestival,
  onOpenLivesModal
}) => {
  const { progress, logoutUser, currentUserEmail } = useGame();
  const secondsUntilNextLife = useLifeCountdown();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mistakeCount = Object.values(progress.incorrectQuestions).filter(q => !q.mastered).length;
  const totalStars = Object.values(progress.completedLevels).reduce((acc, lvl) => acc + (lvl.stars || 0), 0);
  const playerName = (progress.profile?.displayName && progress.profile.displayName !== 'Viajero' && progress.profile.displayName !== 'years')
    ? progress.profile.displayName
    : (progress.profile?.character?.name && progress.profile.character.name !== 'Alex' && progress.profile.character.name !== 'Viajero' && progress.profile.character.name !== 'years')
    ? progress.profile.character.name
    : currentUserEmail
    ? currentUserEmail.split('@')[0]
    : progress.profile?.displayName || 'Aventurero';
  const xpInCurrentLevel = progress.stats.xp % 300;

  const handleNavClick = (callback: () => void) => {
    callback();
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Top Game HUD in Warm Editorial Cream Palette */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EADFCF] shadow-xs px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Logo & Compass */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenHub || onOpenMap}
              className="flex items-center space-x-2.5 text-left group focus:outline-none"
              title="Ir a Inicio"
            >
              {/* Compass Icon Badge */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#E05615] to-[#EA580C] flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-base sm:text-lg tracking-tight text-[#24140E] group-hover:text-[#E05615] transition-colors font-serif leading-none">
                    ¡Aventura Española!
                  </span>
                </div>
                <span className="text-[9px] tracking-[0.2em] font-extrabold text-[#8C7A6B] uppercase block mt-0.5">
                  LEARN BY GOING
                </span>
              </div>
            </button>

            {/* Quick Navigation Buttons */}
            <div className="hidden md:flex items-center space-x-1.5 pl-2">
              {onOpenHub && (
                <>
                  <button
                    onClick={onOpenHub}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white hover:bg-[#F2ECE1] text-[#24140E] text-xs font-bold border border-[#E0D5C7] transition-all shadow-xs"
                    title="Página Principal / Journey Hub"
                  >
                    <Home className="w-3.5 h-3.5 text-[#E05615]" />
                    <span>Inicio</span>
                  </button>

                  <button
                    onClick={onOpenHub}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all shadow-xs"
                    title="Preguntar a Camino AI (Tu Profesor de Español)"
                  >
                    <span className="text-xs">🤖</span>
                    <span>Camino AI</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </button>
                </>
              )}

              <button
                onClick={onOpenMap}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white hover:bg-[#F2ECE1] text-[#24140E] text-xs font-bold border border-[#E0D5C7] transition-all shadow-xs"
                title="Mapa de España"
              >
                <MapIcon className="w-3.5 h-3.5 text-[#E05615]" />
                <span>Mapa</span>
              </button>

              <button
                onClick={onOpenFestival}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E05615] to-[#EA580C] text-white text-xs font-black shadow-xs hover:scale-105 transition-transform"
                title="La Gran Fiesta y Examen Oficial"
              >
                <PartyPopper className="w-3.5 h-3.5 text-amber-200" />
                <span>La Fiesta</span>
              </button>
            </div>
          </div>

          {/* Right: Stats and User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm font-black">
            
            {/* Coins Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8DFD5] shadow-xs text-[#24140E]" title="Monedas de oro">
              <span className="text-base">🪙</span>
              <span>{progress.stats.coins.toLocaleString()}</span>
            </div>

            {/* XP Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8DFD5] shadow-xs text-[#2563EB]" title="Puntos de experiencia">
              <Sparkles className="w-4 h-4 text-[#38BDF8] fill-[#38BDF8]" />
              <span>{progress.stats.xp.toLocaleString()} XP</span>
            </div>

            {/* Lives / Hearts Badge */}
            <button
              onClick={onOpenLivesModal}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border shadow-xs text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                (progress.stats.lives ?? 3) === 0 
                  ? 'border-rose-400 bg-rose-50 text-rose-700 animate-pulse' 
                  : 'bg-white hover:bg-rose-50/50 border-[#E8DFD5] text-rose-600'
              }`} 
              title={(progress.stats.lives ?? 3) < 3 && secondsUntilNextLife ? `Vidas: ${progress.stats.lives}/3 (Próxima vida gratis en ${formatLifeTimer(secondsUntilNextLife)}). Haz clic para recargar.` : `Vidas: ${progress.stats.lives}/3. Haz clic para recargar.`}
            >
              <Heart className={`w-4 h-4 fill-rose-500 text-rose-500 ${(progress.stats.lives ?? 3) > 0 ? 'animate-pulse' : 'opacity-40'}`} />
              <span>{progress.stats.lives ?? 3}/3</span>
              {(progress.stats.lives ?? 3) < 3 && secondsUntilNextLife && (
                <span className="text-[10px] text-slate-500 font-mono hidden md:inline ml-0.5">
                  ⏱️ {formatLifeTimer(secondsUntilNextLife)}
                </span>
              )}
            </button>

            {/* Traveler Avatar Badge */}
            <div
              className="flex items-center space-x-1.5 focus:outline-none"
              title={`Aventurero: ${playerName}`}
            >
              <PlayerAvatar character={progress.profile?.character} size={28} />
              <span className="font-bold text-[#24140E] text-xs hidden lg:inline max-w-[90px] truncate">
                {playerName}
              </span>
            </div>

            {/* Menu / Drawer Toggle */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative flex items-center space-x-1.5 px-3 py-2 rounded-full bg-[#24140E] hover:bg-[#3D251A] text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
              title="Abrir menú de herramientas y opciones"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Menú</span>
              {mistakeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#E05615] text-white text-[10px] font-black rounded-full animate-bounce shadow">
                  {mistakeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Game Drawer / Pause Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop */}
          <div 
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-84 max-w-[88vw] bg-[#FAF7F2] border-l-2 border-[#EADFCF] shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideInRight text-[#24140E]">
            
            {/* Drawer Header & Profile Card */}
            <div className="p-5 border-b border-[#EADFCF] space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase text-[#E05615] flex items-center space-x-1.5 font-serif">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cuaderno de Viaje</span>
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-[#FAF7F2] text-[#6B584D] hover:text-[#24140E] hover:bg-[#F2ECE1] border border-[#EADFCF] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Traveler Card */}
              <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-[#FFF8EE] border-2 border-amber-300 shadow-xs">
                <PlayerAvatar character={progress.profile?.character} size={46} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-black text-[#24140E] truncate font-serif">{playerName}</h3>
                    {currentUserEmail ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black border border-emerald-300 shrink-0">
                        Cuenta Activa
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 shrink-0">
                        Invitado
                      </span>
                    )}
                  </div>
                  {currentUserEmail && (
                    <p className="text-[10px] text-[#7A6B60] truncate font-mono mt-0.5">{currentUserEmail}</p>
                  )}
                  <div className="flex items-center space-x-2 text-[11px] text-[#B45309] font-bold mt-0.5">
                    <span>Nivel {progress.stats.level}</span>
                    <span>•</span>
                    <span className="text-[#8C7A6B]">{progress.stats.xp} XP total</span>
                  </div>
                  {/* Small XP bar */}
                  <div className="w-full bg-[#EADFCF] rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#E05615] to-[#F3B33D] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (xpInCurrentLevel / 300) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Options List */}
            <div className="p-4 space-y-2 flex-1">
              
              {/* Lives / Corazones Card */}
              {onOpenLivesModal && (
                <button
                  onClick={() => handleNavClick(onOpenLivesModal)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all group text-left shadow-xs cursor-pointer ${
                    (progress.stats.lives ?? 3) === 0
                      ? 'bg-rose-50 border-rose-300 hover:bg-rose-100'
                      : 'bg-white hover:bg-rose-50/40 border-[#E8DFD5]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#24140E] group-hover:text-rose-700 transition-colors block font-serif">
                        Vidas: {progress.stats.lives ?? 3} / 3 ❤️
                      </span>
                      <span className="text-[11px] text-[#7A6B60]">
                        {(progress.stats.lives ?? 3) < 3 && secondsUntilNextLife
                          ? `Regenera en ${formatLifeTimer(secondsUntilNextLife)} o recarga 500 🪙`
                          : 'Vidas al máximo (3/3)'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-rose-500 transition-colors" />
                </button>
              )}

              {/* Camino AI Chatbot */}
              {onOpenHub && (
                <button
                  onClick={() => handleNavClick(onOpenHub)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 border-2 border-emerald-300 hover:border-emerald-400 transition-all group text-left shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold text-base shadow-xs">
                      🤖
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-[#24140E] group-hover:text-emerald-950 transition-colors font-serif">
                          Camino AI Guide
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-[#E05615] text-white text-[9px] font-black uppercase tracking-wider">
                          Profesor IA
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-medium">Pregunta dudas de español en vivo</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </button>
              )}

              {/* Mapa de España */}
              <button
                onClick={() => handleNavClick(onOpenMap)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-[#FFFDF9] border-2 border-[#E8DFD5] hover:border-amber-400 transition-all group text-left shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                    <MapIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-[#24140E] group-hover:text-[#E05615] transition-colors block font-serif">
                      Mapa de España
                    </span>
                    <span className="text-[11px] text-[#7A6B60]">15 ciudades y 150 niveles</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-amber-500 transition-colors" />
              </button>

              {/* La Gran Fiesta */}
              <button
                onClick={() => handleNavClick(onOpenFestival)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#FFF8EE] to-[#FFF1EB] hover:from-[#FFF3E2] hover:to-[#FFE9DE] border-2 border-amber-300 transition-all group text-left shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                    <PartyPopper className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-[#24140E] group-hover:text-[#E05615] transition-colors block font-serif">
                      La Gran Fiesta
                    </span>
                    <span className="text-[11px] text-[#B45309] font-medium">Plaza, personajes y Examen A1</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#E05615]" />
              </button>

              {/* Cuaderno de Repaso */}
              <button
                onClick={() => handleNavClick(onOpenNotebook)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-[#FFFDF9] border-2 border-[#E8DFD5] hover:border-rose-400 transition-all group text-left shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-[#24140E] group-hover:text-rose-700 transition-colors font-serif">
                        Cuaderno de Repaso
                      </span>
                      {mistakeCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-black rounded-full">
                          {mistakeCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7A6B60]">Repaso espaciado de errores</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-rose-500 transition-colors" />
              </button>

              {/* Plan de Estudio (35 Días) */}
              <button
                onClick={() => handleNavClick(onOpenStudyPlan)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-[#FFFDF9] border-2 border-[#E8DFD5] hover:border-emerald-400 transition-all group text-left shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-[#24140E] group-hover:text-emerald-700 transition-colors block font-serif">
                      Plan de Estudio 35 Días
                    </span>
                    <span className="text-[11px] text-[#7A6B60]">Ruta guiada por el sílabo</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-emerald-500 transition-colors" />
              </button>

              {/* Matriz del Sílabo BAESP101 */}
              <button
                onClick={() => handleNavClick(onOpenSyllabus)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-[#FFFDF9] border-2 border-[#E8DFD5] hover:border-amber-400 transition-all group text-left shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-[#24140E] group-hover:text-[#E05615] transition-colors block font-serif">
                      Matriz del Sílabo
                    </span>
                    <span className="text-[11px] text-[#7A6B60]">Cobertura de 5 módulos A1</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-amber-500 transition-colors" />
              </button>

              {/* Logros */}
              <button
                onClick={() => handleNavClick(onOpenAchievements)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-[#FFFDF9] border-2 border-[#E8DFD5] hover:border-yellow-500 transition-all group text-left shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center justify-center font-bold">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-[#24140E] group-hover:text-yellow-800 transition-colors block font-serif">
                      Logros y Trofeos
                    </span>
                    <span className="text-[11px] text-[#7A6B60]">Desafíos y medallas de España</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-yellow-600 transition-colors" />
              </button>


              {/* Ajustes */}
              <button
                onClick={() => handleNavClick(onOpenSettings)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-[#FFFDF9] border-2 border-[#E8DFD5] hover:border-amber-400 transition-all group text-left shadow-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#6B584D] border border-[#E0D5C7] flex items-center justify-center font-bold">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-[#24140E] group-hover:text-[#E05615] transition-colors block font-serif">
                      Ajustes y Datos
                    </span>
                    <span className="text-[11px] text-[#7A6B60]">Guardado y tutorial</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8C7A6B] group-hover:text-[#24140E] transition-colors" />
              </button>

              {/* Cerrar Sesión / Cambiar Cuenta */}
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  logoutUser();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 hover:bg-rose-100/60 border-2 border-rose-200/80 hover:border-rose-300 transition-all group text-left shadow-xs cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-rose-900 group-hover:text-rose-950 transition-colors block font-serif">
                      {currentUserEmail ? 'Cerrar Sesión' : 'Salir al Menú Principal'}
                    </span>
                    <span className="text-[11px] text-rose-700 font-medium">
                      {currentUserEmail ? 'Guarda tu progreso y cambia de cuenta' : 'Volver a la pantalla de bienvenida'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors" />
              </button>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EADFCF] bg-white space-y-2 text-center">
              <p className="text-[10px] text-[#7A6B60] leading-tight font-medium">
                ¡Aventura Española! • Basado en el sílabo oficial <strong>BAESP101 Spanish Level I</strong> y <strong>Nuevo Español sin Fronteras</strong>.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
