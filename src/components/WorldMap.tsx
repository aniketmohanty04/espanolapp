import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_CITIES } from '../data/citiesData';
import { City } from '../types';
import { 
  Lock, 
  CheckCircle2, 
  Star, 
  MapPin, 
  Trophy, 
  ChevronRight, 
  Sparkles, 
  PartyPopper,
  Compass,
  ArrowRight
} from 'lucide-react';

interface WorldMapProps {
  onSelectCity: (cityId: string) => void;
  onOpenFestival: () => void;
}

const CITY_LABEL_CONFIG: Record<string, { xOffset: string; yOffset: string }> = {
  madrid: { xOffset: '0px', yOffset: '24px' },
  toledo: { xOffset: '0px', yOffset: '24px' },
  salamanca: { xOffset: '-64px', yOffset: '0px' },
  segovia: { xOffset: '0px', yOffset: '-28px' },
  sevilla: { xOffset: '-54px', yOffset: '4px' },
  granada: { xOffset: '56px', yOffset: '4px' },
  cordoba: { xOffset: '0px', yOffset: '-28px' },
  malaga: { xOffset: '0px', yOffset: '24px' },
  cadiz: { xOffset: '-52px', yOffset: '14px' },
  valencia: { xOffset: '56px', yOffset: '0px' },
  barcelona: { xOffset: '60px', yOffset: '0px' },
  zaragoza: { xOffset: '-58px', yOffset: '0px' },
  bilbao: { xOffset: '-50px', yOffset: '-16px' },
  'san-sebastian': { xOffset: '62px', yOffset: '-14px' },
  santiago: { xOffset: '-74px', yOffset: '0px' }
};

export const WorldMap: React.FC<WorldMapProps> = ({ onSelectCity, onOpenFestival }) => {
  const { progress } = useGame();
  
  // Default to the first unlocked, unfinished city or Madrid
  const defaultCity = ALL_CITIES.find(c => progress.unlockedCityIds.includes(c.id) && !progress.completedBosses[c.id]?.passed) || ALL_CITIES[0];
  const [selectedCityInfo, setSelectedCityInfo] = useState<City>(defaultCity);

  const getCityStatus = (cityId: string) => {
    const isUnlocked = progress.unlockedCityIds.includes(cityId);
    const bossCompleted = Boolean(progress.completedBosses[cityId]?.passed);
    const city = ALL_CITIES.find(c => c.id === cityId);
    let completedLevelsCount = 0;
    if (city) {
      completedLevelsCount = city.levels.filter(l => Boolean(progress.completedLevels[l.id])).length;
    }
    return { isUnlocked, bossCompleted, completedLevelsCount };
  };

  const all15BossesCompleted = ALL_CITIES.every(c => Boolean(progress.completedBosses[c.id]?.passed));

  // Module badge colors
  const getModuleBadgeColor = (moduleIndex: number) => {
    switch (moduleIndex) {
      case 1: return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 2: return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 3: return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 4: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 5: return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const activeStatus = getCityStatus(selectedCityInfo.id);

  return (
    <div className="min-h-[calc(100vh-68px)] p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 text-[#24140E]">
      {/* Intro banner with high-contrast readable text */}
      <div className="world-intro relative overflow-hidden rounded-3xl border-2 border-amber-400/80 p-6 sm:p-9 shadow-xl relative text-white">
        {/* Deep contrast gradient overlay on left side ensuring text is 100% crystal-clear and readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/78 to-slate-900/25 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-3.5 shadow-md border border-amber-300">
            <Compass className="w-3.5 h-3.5 text-[#E05615]" />
            <span>Itinerario Pedagógico BAESP101 • 15 Ciudades + La Gran Fiesta</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-serif tracking-tight leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Mapa del Viajero por España
          </h1>
          <p className="mt-3 text-slate-100 text-sm sm:text-base leading-relaxed font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Explora la geografía real de la Península Ibérica en estilo anime. Inicia tu ruta en <strong className="text-amber-300 font-black">Madrid</strong>, supera los 10 niveles y la misión de jefe de cada región, y desbloquea el viaje hasta <strong className="text-amber-300 font-black">La Gran Fiesta</strong> en el Mediterráneo.
          </p>

          {/* Quick Stats Highlights */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-200 border border-white/20 text-xs font-bold flex items-center space-x-1.5 shadow-sm">
              <span>📍</span>
              <span>15 Ciudades Reales</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 border border-white/20 text-xs font-bold flex items-center space-x-1.5 shadow-sm">
              <span>⚔️</span>
              <span>15 Misiones de Jefe</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-sky-200 border border-white/20 text-xs font-bold flex items-center space-x-1.5 shadow-sm">
              <span>🎓</span>
              <span>5 Módulos Sílabo A1</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Map Presentation */}
      <div className="rounded-3xl bg-white border-2 border-[#EADFCF] p-4 sm:p-6 shadow-sm relative overflow-hidden flex flex-col gap-4">
        {/* Map Header & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EADFCF]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-300 shadow-xs">
              <MapPin className="w-4 h-4 text-[#E05615]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#24140E] font-serif">
                Ruta Real de la Península Ibérica
              </h2>
              <p className="text-xs text-[#7A6B60] font-medium">15 ciudades conectadas según el sílabo pedagógico</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs font-bold">
            <span className="flex items-center space-x-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span>Superada</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#B45309]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span>Activa</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#8C7A6B]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D5C7B7]" />
              <span>Bloqueada</span>
            </span>
          </div>
        </div>

        {/* 16:9 Realistic Anime RPG Map of Spain */}
        <div className="world-map-scene relative w-full aspect-[16/9] rounded-2xl border-4 border-amber-300/80 overflow-hidden shadow-2xl flex items-center justify-center select-none bg-sky-950">
          <img 
            src="/game-art/spain-anime-map.jpg" 
            alt="Anime adventure map of Spain - The Kingdom of Iberia" 
            className="absolute inset-0 h-full w-full object-cover" 
            draggable={false} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-sky-300/10 pointer-events-none" />

          {/* Connecting Travel Trails SVG */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          >
            <defs>
              <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.8" />
              </filter>
            </defs>
            {ALL_CITIES.map((city, idx) => {
              if (idx === ALL_CITIES.length - 1) return null;
              const nextCity = ALL_CITIES[idx + 1];
              const isUnlocked = progress.unlockedCityIds.includes(nextCity.id);
              return (
                <line
                  key={`line-${city.id}-${nextCity.id}`}
                  x1={city.coordinates.x}
                  y1={city.coordinates.y}
                  x2={nextCity.coordinates.x}
                  y2={nextCity.coordinates.y}
                  stroke={isUnlocked ? '#fef08a' : '#94a3b8'}
                  strokeWidth={isUnlocked ? '0.75' : '0.45'}
                  strokeDasharray={isUnlocked ? '1.2 0.8' : '0.8 1.2'}
                  strokeLinecap="round"
                  filter="url(#trailGlow)"
                  className={isUnlocked ? 'transition-all duration-700' : 'opacity-60'}
                />
              );
            })}

            {/* Sea Route from Barcelona / Valencia to La Gran Fiesta */}
            <path
              d="M 68 55 Q 76 56 85 53.5"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.75"
              strokeDasharray="1.2 0.8"
              strokeLinecap="round"
              filter="url(#trailGlow)"
              className="opacity-80"
            />
          </svg>

          {/* City Interactive Pins with Anti-Crowding Labels */}
          {ALL_CITIES.map(city => {
            const { isUnlocked, bossCompleted, completedLevelsCount } = getCityStatus(city.id);
            const isSelected = selectedCityInfo?.id === city.id;
            const offset = CITY_LABEL_CONFIG[city.id] || { xOffset: '0px', yOffset: '24px' };

            return (
              <div
                key={city.id}
                style={{
                  position: 'absolute',
                  left: `${city.coordinates.x}%`,
                  top: `${city.coordinates.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="z-20"
              >
                <div className="relative flex items-center justify-center">
                  {/* Pin Node Button */}
                  <button
                    onClick={() => {
                      setSelectedCityInfo(city);
                      if (isUnlocked) {
                        onSelectCity(city.id);
                      }
                    }}
                    onMouseEnter={() => setSelectedCityInfo(city)}
                    className={`group relative flex items-center justify-center focus:outline-none transition-all duration-300 ${
                      !isUnlocked ? 'cursor-not-allowed opacity-60 grayscale-[30%]' : 'hover:scale-125'
                    }`}
                    title={`${city.name} (${completedLevelsCount}/10 niveles)`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shadow-xl border-2 transition-all ${
                        bossCompleted
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 border-white text-white shadow-emerald-500/50'
                          : isUnlocked
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border-white text-slate-950 font-black shadow-amber-500/60 ring-2 ring-amber-300/80'
                          : 'bg-slate-800/90 border-slate-500 text-slate-400 shadow-black/60'
                      } ${isSelected ? 'ring-4 ring-amber-300 scale-110' : ''}`}
                    >
                      {bossCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      ) : isUnlocked ? (
                        <span>{city.number}</span>
                      ) : (
                        <Lock className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Anti-Crowding Label Pill */}
                  <div
                    style={{
                      position: 'absolute',
                      transform: `translate(${offset.xOffset}, ${offset.yOffset})`
                    }}
                    className={`pointer-events-none px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-black border shadow-lg whitespace-nowrap backdrop-blur-md transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-white scale-110 z-30'
                        : isUnlocked
                        ? 'bg-slate-950/85 text-amber-200 border-amber-400/50'
                        : 'bg-slate-950/70 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    {city.name}
                  </div>
                </div>
              </div>
            );
          })}

          {/* La Gran Fiesta Landmark on Balearic Islands */}
          <div
            style={{
              position: 'absolute',
              left: '85.0%',
              top: '53.5%',
              transform: 'translate(-50%, -50%)'
            }}
            className="z-30"
          >
            <div className="relative flex flex-col items-center">
              <button
                onClick={onOpenFestival}
                className="group relative flex items-center justify-center hover:scale-115 transition-transform"
                title="La Gran Fiesta - Celebración y Examen Final"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-300 via-rose-500 to-yellow-300 p-0.5 shadow-2xl glow-gold flex items-center justify-center border-2 border-white animate-pulse">
                  <div className="w-full h-full bg-[#7a1f26] rounded-full flex items-center justify-center text-xl sm:text-2xl">
                    🎉
                  </div>
                </div>
              </button>
              
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] sm:text-[11px] shadow-lg border-2 border-white whitespace-nowrap pointer-events-none">
                La Gran Fiesta
              </div>
            </div>
          </div>
        </div>

        {/* Selected City Quick Inspector Card */}
        <div className="p-5 rounded-3xl bg-[#FFF8EE] border-2 border-amber-300 shadow-sm flex flex-wrap items-center justify-between gap-4 text-[#24140E]">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-xs border-2 ${
              activeStatus.bossCompleted
                ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                : activeStatus.isUnlocked
                ? 'bg-amber-100 border-amber-400 text-amber-900'
                : 'bg-[#EADFCF] border-[#D5C7B7] text-[#7A6B60]'
            }`}>
              {activeStatus.bossCompleted ? '✓' : selectedCityInfo.number}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-black text-[#24140E] font-serif">{selectedCityInfo.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black ${getModuleBadgeColor(selectedCityInfo.moduleIndex)}`}>
                  Módulo {selectedCityInfo.moduleIndex}
                </span>
                <span className="text-xs text-[#7A6B60] font-medium">• {selectedCityInfo.region}</span>
              </div>
              <p className="text-xs text-[#B45309] font-bold mt-0.5">
                🏛️ {selectedCityInfo.landmark}
              </p>
              <p className="text-xs text-[#6B584D] mt-0.5 font-medium">
                {activeStatus.completedLevelsCount} / 10 niveles completados • {activeStatus.bossCompleted ? '👑 Jefe superado' : '⚔️ Jefe pendiente'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeStatus.isUnlocked ? (
              <button
                onClick={() => onSelectCity(selectedCityInfo.id)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-sm shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <span>Explorar {selectedCityInfo.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-4 py-2 rounded-full bg-white border border-[#E0D5C7] text-[#7A6B60] text-xs font-bold flex items-center space-x-1.5 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-[#8C7A6B]" />
                <span>Supera la ciudad anterior para desbloquear</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Destination Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#FFF8EE] via-[#FFF3E8] to-[#FFE8D6] border-2 border-amber-300 flex flex-wrap items-center justify-between gap-3 shadow-sm text-[#24140E]">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎊</span>
            <div>
              <p className="text-sm sm:text-base font-black text-[#24140E] font-serif">Destino Final: La Gran Fiesta y Examen BAESP101</p>
              <p className="text-xs text-[#6B584D] font-medium">
                {all15BossesCompleted 
                  ? '¡Has completado las 15 ciudades! Las puertas de la fiesta están totalmente abiertas.' 
                  : `Progreso: ${Object.keys(progress.completedBosses).filter(k => progress.completedBosses[k]?.passed).length} de 15 jefes derrotados.`}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenFestival}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>Entrar a La Fiesta</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 15 Cities Chronological Itinerary Rail */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#EADFCF] shadow-sm space-y-4 text-[#24140E]">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-[#24140E] font-serif flex items-center space-x-2">
            <span>Ruta Completa del Viajero (15 Ciudades)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-[#B45309] border border-amber-300 font-black">
              {progress.unlockedCityIds.length} / 15 Desbloqueadas
            </span>
          </h3>
          <span className="text-xs text-[#7A6B60] font-medium">Haz clic en cualquier ciudad para seleccionarla</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ALL_CITIES.map(city => {
            const { isUnlocked, bossCompleted, completedLevelsCount } = getCityStatus(city.id);
            const isSelected = selectedCityInfo?.id === city.id;
            return (
              <button
                key={city.id}
                onClick={() => {
                  setSelectedCityInfo(city);
                  if (isUnlocked) onSelectCity(city.id);
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#FFF8EE] border-[#E05615] ring-2 ring-orange-300/40 shadow-sm scale-102'
                    : isUnlocked
                    ? 'bg-white hover:bg-[#FFFDF9] border-[#E8DFD5] hover:border-amber-400 text-[#24140E] shadow-xs'
                    : 'bg-[#FAF7F2]/90 border-[#E0D5C7] text-[#8C7A6B] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    bossCompleted
                      ? 'bg-emerald-600 text-white'
                      : isUnlocked
                      ? 'bg-amber-100 text-[#B45309] border border-amber-300'
                      : 'bg-[#EADFCF] text-[#7A6B60]'
                  }`}>
                    {bossCompleted ? '✓' : city.number}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-black ${getModuleBadgeColor(city.moduleIndex)}`}>
                    M{city.moduleIndex}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-black text-[#24140E] truncate font-serif">{city.name}</p>
                  <p className="text-[10px] text-[#7A6B60] truncate font-medium">{city.landmark.split('&')[0]}</p>
                </div>
                <div className="mt-2 pt-1.5 border-t border-[#F2ECE1] text-[10px] font-bold flex items-center justify-between text-[#B45309]">
                  <span>{completedLevelsCount}/10 niveles</span>
                  {!isUnlocked && <Lock className="w-3 h-3 text-[#8C7A6B]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
