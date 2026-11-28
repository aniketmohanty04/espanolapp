import React, { useState, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { City, Level, DifficultyTier, PlayerCharacter } from '../types';
import { LevelDetailsModal } from './LevelDetailsModal';
import { Adventure3DScene, AdventureStation3D } from './Adventure3DScene';
import { getNextCity } from '../data/citiesData';
import confetti from 'canvas-confetti';
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
  Flame,
  Route,
  LayoutGrid,
  Gamepad2,
  Heart,
  Gift,
  Utensils,
  X,
  Award
} from 'lucide-react';

interface TapasSpecialty {
  title: string;
  foodName: string;
  description: string;
  quote: string;
  icon: string;
}

const CITY_TAPAS_SPECIALTIES: Record<string, TapasSpecialty> = {
  madrid: {
    title: 'Chiringuito Madrileño',
    foodName: 'Bocadillo de Calamares y Churros con Chocolate',
    description: 'En la Plaza Mayor es tradición pedir un bocadillo crujiente de calamares con alioli casero, seguido de una taza de espeso chocolate con churros recién hechos.',
    quote: '¡Camarero, una ración de calamares crujientes!',
    icon: '🥖'
  },
  toledo: {
    title: 'Mesón Toledano',
    foodName: 'Mazapán Artesano y Carcamusas Toledanas',
    description: 'Plato tradicional de carne de cerdo guisada con tomate, guisantes y salsa picante, acompañado del legendario mazapán de los conventos toledanos.',
    quote: '¡Las carcamusas toledanas quitan el frío!',
    icon: '🥮'
  },
  salamanca: {
    title: 'Taberna Salmantina',
    foodName: 'Hornazo Charro y Jamón de Bellota de Guijuelo',
    description: 'Exquisito pastel de masa dorada relleno de lomo ibérico, chorizo y jamón curado bajo el aire puro de la dehesa de Guijuelo.',
    quote: '¡Un hornazo caliente para recargar fuerzas!',
    icon: '🥓'
  },
  segovia: {
    title: 'Asador del Acueducto',
    foodName: 'Cochinillo Asado al Horno de Leña y Ponche',
    description: 'Asado tradicional en horno de leña con piel ultra crujiente cortada al plato, coronado con el bizcocho y mazapán del ponche segoviano.',
    quote: '¡Cochinillo crujiente como manda la tradición!',
    icon: '🍖'
  },
  sevilla: {
    title: 'Rincón de Triana',
    foodName: 'Gazpacho Andaluz Fresco y Pescaíto Frito',
    description: 'Sopa fría refrescante de tomates maduros, pepino, pimiento y aceite de oliva virgen extra, con un cucurucho de choco frito al estilo sevillano.',
    quote: '¡Qué frescura de gazpacho a la orilla del río!',
    icon: '🥣'
  },
  granada: {
    title: 'Tapería del Albaicín',
    foodName: 'Habas con Jamón Ibérico y Piononos Dulces',
    description: 'Pequeñas habas tiernas salteadas con dados de jamón ibérico, y de postre el dulce pionono empapado en almíbar y crema tostada de Santa Fe.',
    quote: '¡En Granada la tapa siempre es un regalo generoso!',
    icon: '🍮'
  },
  cordoba: {
    title: 'Taberna de los Patios',
    foodName: 'Salmorejo Cordobés y Flamenquín Crujiente',
    description: 'Emulsión espesa y sedosa de tomate y pan coronada con huevo duro y jamón ibérico picado, servida junto a un gran flamenquín dorado.',
    quote: '¡El salmorejo cordobés es el rey de la mesa!',
    icon: '🍅'
  },
  malaga: {
    title: 'Chiringuito de la Malagueta',
    foodName: 'Espetos de Sardinas al Fuego de Leña',
    description: 'Sardinas plateadas recién pescadas, ensartadas en cañas y asadas con madera de olivo en una barca de arena frente a las olas del mar.',
    quote: '¡Sardinas asadas al punto con el aroma del mar!',
    icon: '🐟'
  },
  cadiz: {
    title: 'Freiduría Gaditana',
    foodName: 'Tortillitas de Camarones y Atún de Almadraba',
    description: 'Finas y crujientes como encaje con camarones vivos y cebolleta fresca, junto a un filete de atún rojo salvaje de las costas gaditanas.',
    quote: '¡La alegría y sabor del Atlántico en cada bocado!',
    icon: '🦐'
  },
  valencia: {
    title: 'Barraca Valenciana',
    foodName: 'Auténtica Paella Valenciana con Socarrat',
    description: 'Arroz bomba con pollo de corral, conejo, judía ferradura y garrofó, cocinado a fuego de sarmiento con su capa crujiente de socarrat.',
    quote: '¡Un buen valenciano siempre busca el socarrat!',
    icon: '🥘'
  },
  barcelona: {
    title: 'Bodega Mediterránea',
    foodName: 'Pa amb Tomàquet y Crema Catalana Quemada',
    description: 'Pan rústico de payés untado con tomate maduro, ajo, flor de sal y aceite arbequina, seguido de crema con canela y azúcar tostado.',
    quote: '¡Bon profit! ¡La esencia de la cocina mediterránea!',
    icon: '🍞'
  },
  zaragoza: {
    title: 'Mesón del Tubo',
    foodName: 'Ternasco de Aragón Asado con Patatas Panaderas',
    description: 'Paletilla tierna de cordero aragonés asada lentamente con romero, acompañada de dulces frutas de Aragón confitadas con chocolate.',
    quote: '¡Noble y suculento sabor de las tierras de Aragón!',
    icon: '🥩'
  },
  bilbao: {
    title: 'Taberna del Casco Viejo',
    foodName: 'Pintxos de Bacalao al Pil-Pil y Gildas',
    description: 'Lomos de bacalao emulsionados en su propia gelatina con aceite de oliva y ajo, precedidos por la reina del pintxo: la gilda.',
    quote: '¡Un txakoli bien fresco y unos pintxos de bacalao!',
    icon: '🍢'
  },
  'san-sebastian': {
    title: 'Bar de la Parte Vieja Donostiarra',
    foodName: 'Pintxo de Txangurro y Tarta de Queso Quemada',
    description: 'Alta gastronomía en miniatura: centollo del Cantábrico gratinado y la famosa tarta de queso quemada donostiarra con corazón cremoso.',
    quote: '¡La capital mundial del pintxo y el buen comer!',
    icon: '🧀'
  },
  santiago: {
    title: 'Rúa del Peregrino',
    foodName: 'Pulpo á Feira y Tarta de Almendra de Santiago',
    description: 'Pulpo tierno cocido en caldera de cobre, aderezado con sal gruesa, pimentón de la Vera y aceite de oliva sobre plato de madera de pino.',
    quote: '¡El mejor premio para el peregrino al llegar a la plaza!',
    icon: '🐙'
  }
};

/* Mini Player Avatar Pin Component */
const PlayerAvatarPin: React.FC<{ character?: PlayerCharacter }> = ({ character }) => {
  const skin = {
    light: '#FDDCB5',
    'medium-light': '#E8B98A',
    medium: '#C8956C',
    'medium-dark': '#9A6B4A',
    dark: '#6B4226'
  }[character?.skinTone || 'medium'] || '#E8B98A';

  const hair = {
    black: '#1A1A2E',
    brown: '#5D4037',
    blonde: '#F59E0B',
    red: '#B91C1C',
    gray: '#64748B'
  }[character?.hairColor || 'brown'] || '#5D4037';

  const outfit = {
    casual: '#2563EB',
    traveler: '#DC2626',
    flamenco: '#E11D48',
    sporty: '#16A34A',
    elegant: '#7C3AED'
  }[character?.outfit || 'traveler'] || '#DC2626';

  return (
    <div className="relative flex flex-col items-center animate-bounce select-none pointer-events-none z-30">
      {/* Speech bubble indicator */}
      <div className="mb-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] sm:text-xs font-black shadow-lg border-2 border-white whitespace-nowrap">
        ¡Aquí estás!
      </div>
      {/* SVG Character Pin */}
      <svg width="42" height="50" viewBox="0 0 44 52" className="filter drop-shadow-[0_6px_6px_rgba(0,0,0,0.6)]">
        <ellipse cx="22" cy="49" rx="14" ry="3.5" fill="rgba(0,0,0,0.3)" />
        <rect x="15" y="38" width="5" height="9" rx="2" fill="#1E293B" />
        <rect x="24" y="38" width="5" height="9" rx="2" fill="#1E293B" />
        <rect x="13" y="24" width="18" height="16" rx="4" fill={outfit} stroke="#991B1B" strokeWidth="1" />
        <line x1="16" y1="24" x2="16" y2="38" stroke="#1D4ED8" strokeWidth="2.5" />
        <line x1="28" y1="24" x2="28" y2="38" stroke="#1D4ED8" strokeWidth="2.5" />
        <path d="M 13 26 Q 6 20 6 12" stroke={outfit} strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="6" cy="11" r="3" fill={skin} />
        <path d="M 31 26 Q 36 30 35 36" stroke={outfit} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="35" cy="37" r="2.5" fill={skin} />
        <circle cx="22" cy="15" r="9" fill={skin} />
        <circle cx="19" cy="14" r="1.5" fill="#1E293B" />
        <circle cx="25" cy="14" r="1.5" fill="#1E293B" />
        <path d="M 20 18 Q 22 20 24 18" stroke="#991B1B" strokeWidth="1" strokeLinecap="round" fill="none" />
        <ellipse cx="22" cy="10" rx="9" ry="5" fill={hair} />
        <path d="M 13 14 C 13 8 31 8 31 14" fill={hair} />
      </svg>
    </div>
  );
};

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
  const { progress, visitFestivalStall } = useGame();
  const [selectedLevelForPreview, setSelectedLevelForPreview] = useState<Level | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'path' | 'grid'>('grid');
  const [showTapasModal, setShowTapasModal] = useState<boolean>(false);
  const [chestAlert, setChestAlert] = useState<{ title: string; message: string; coins: number } | null>(null);

  const isCityUnlocked = progress.unlockedCityIds.includes(city.id);

  if (!isCityUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-600 mb-4 shadow-sm">
          <Lock className="w-8 h-8 text-slate-700" />
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider mb-2">
          Módulo {city.moduleIndex} • Ciudad Bloqueada
        </span>
        <h2 className="text-3xl font-black text-[#24140E] font-serif mb-2">
          {city.name} aún no está desbloqueada
        </h2>
        <p className="text-sm text-[#7A6B60] max-w-md mb-6 leading-relaxed">
          Para explorar {city.name} y acceder a sus 10 misiones, primero debes completar las misiones anteriores y derrotar al jefe de la ciudad previa.
        </p>
        <button
          onClick={onBackToMap}
          className="px-6 py-3 rounded-full bg-[#E05615] hover:bg-[#C9470C] text-white font-black text-sm shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

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

  // Check if a level is unlocked (sequential progression: level 1 is always unlocked; level N is unlocked if level N-1 is completed)
  const isLevelUnlocked = useCallback((levelIndex: number): boolean => {
    if (levelIndex === 0) return true;
    const prevLevel = city.levels[levelIndex - 1];
    return Boolean(progress.completedLevels[prevLevel.id]);
  }, [city.levels, progress.completedLevels]);

  // 3D Adventure Stalls Layout (positions matching the square)
  const STALL_POSITIONS = useMemo(() => [
    { x: -8, z: 8 },
    { x: 8, z: 8 },
    { x: -14, z: 2 },
    { x: -14, z: -6 },
    { x: -8, z: -14 },
    { x: 8, z: -14 },
    { x: 14, z: -6 },
    { x: 14, z: 2 },
    { x: -4, z: 12 },
    { x: 4, z: 12 },
  ], []);

  const TIER_COLORS: Record<DifficultyTier, number> = useMemo(() => ({
    easy: 0x10b981,
    medium: 0x38bdf8,
    tough: 0xf59e0b,
    hard: 0xf97316,
    hot: 0xf43f5e
  }), []);

  const stations3D: AdventureStation3D[] = useMemo(() => {
    return city.levels.map((lvl, idx) => {
      const isCompleted = Boolean(progress.completedLevels[lvl.id]);
      const isUnlocked = isLevelUnlocked(idx);
      const pos = STALL_POSITIONS[idx] || { x: 0, z: 0 };

      return {
        id: lvl.id,
        x: pos.x,
        z: pos.z,
        label: `Nivel ${lvl.levelNumber}: ${lvl.title}`,
        subLabel: lvl.subtitle,
        status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
        color: TIER_COLORS[lvl.tier] || 0xf59e0b,
        goodsColor: 0xffc94a,
        onInteract: () => {
          if (isUnlocked) {
            setSelectedLevelForPreview(lvl);
          }
        }
      };
    });
  }, [city.levels, progress.completedLevels, isLevelUnlocked, STALL_POSITIONS, TIER_COLORS]);

  const nextCity = getNextCity(city.id);
  const exitGateData = useMemo(() => ({
    targetCityName: nextCity?.name || 'La Gran Fiesta',
    isUnlocked: isBossPassed || allLevelsDone,
    onWalkThrough: () => {
      onBackToMap();
    }
  }), [nextCity?.name, isBossPassed, allLevelsDone, onBackToMap]);

  const bossStationData = useMemo(() => city.bossMission ? {
    label: city.bossMission.title,
    bossName: city.bossMission.characterName,
    isPassed: isBossPassed,
    allLevelsDone,
    completedCount: completedLevels.length,
    onInteract: () => {
      if (allLevelsDone || isBossPassed) {
        onOpenBoss();
      }
    }
  } : undefined, [city.bossMission, isBossPassed, allLevelsDone, completedLevels.length, onOpenBoss]);

  return (
    <div className="min-h-[calc(100vh-68px)] p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMap}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] text-[#24140E] text-sm font-bold border border-[#E0D5C7] shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#E05615]" />
          <span>Back to Spain Map</span>
        </button>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white border border-[#E8DFD5] text-[#524136] shadow-xs">
            <span>{city.region}</span>
            <span>•</span>
            <span className="text-[#B45309] font-bold">{city.moduleName}</span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#EFE7DC] rounded-full p-1 border border-[#E0D5C7]">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                viewMode === '3d'
                  ? 'bg-white text-[#24140E] font-black shadow-xs'
                  : 'text-[#7A6B60] hover:text-[#24140E]'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>3D Adventure</span>
            </button>
            <button
              onClick={() => setViewMode('path')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                viewMode === 'path'
                  ? 'bg-white text-[#24140E] font-black shadow-xs'
                  : 'text-[#7A6B60] hover:text-[#24140E]'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Path</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#24140E] font-black shadow-xs'
                  : 'text-[#7A6B60] hover:text-[#24140E]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Levels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Atmospheric City Header Card */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 shadow-md p-6 sm:p-8" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,248,238,0.96), rgba(254,243,199,0.92) 60%, rgba(255,248,238,0.85)), url(/game-art/madrid-plaza.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Decorative architectural silhouettes */}
        <div 
          className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: city.accentColor }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl text-left">
            {/* City Tag Ribbon */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-300 text-[#B45309] text-xs font-black mb-3">
              <span>City {city.number} of 15</span>
              <span>•</span>
              <span>{city.landmark}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#24140E] font-serif tracking-tight">
              {city.name}
            </h1>
            <p className="text-[#B45309] font-bold text-sm mt-1">
              {city.number === 1 ? 'City of Beginnings (Ciudad de los Comienzos)' : `Region: ${city.region}`}
            </p>
            <p className="text-[#6B584D] text-sm sm:text-base leading-relaxed mt-2 font-medium">
              {city.description}
            </p>
          </div>

          {/* Quick city progress summary badge */}
          <div className="bg-white/95 border-2 border-[#EADFCF] rounded-2xl p-4 flex flex-col items-center justify-center min-w-[210px] text-center shrink-0 shadow-sm text-[#24140E]">
            <span className="text-xs text-[#7A6B60] uppercase tracking-wider font-bold mb-1">
              Progress in {city.name}
            </span>
            <div className="text-3xl font-black text-[#B45309]">
              {completedLevels.length} / 10
            </div>
            <span className="text-xs text-[#7A6B60]">Levels Completed</span>

            <div className="w-full bg-[#EADFCF] h-2.5 rounded-full mt-3 overflow-hidden border border-[#E0D5C7]">
              <div 
                className="h-full bg-gradient-to-r from-[#E05615] to-[#F3B33D] transition-all duration-500 rounded-full"
                style={{ width: `${(completedLevels.length / 10) * 100}%` }}
              />
            </div>

            <div className="mt-3 text-xs font-bold flex items-center space-x-1">
              {isBossPassed ? (
                <span className="text-emerald-700 flex items-center space-x-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Boss Passed ({bossRecord?.scorePercent}%)</span>
                </span>
              ) : (
                <span className="text-[#B45309] flex items-center space-x-1 font-bold">
                  <ShieldAlert className="w-4 h-4 text-[#C2410C]" />
                  <span>Boss Pending (80% req.)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 0: Playable 3D Town Adventure (Real-time Third-Person Exploration) */}
      {viewMode === '3d' && (
        <Adventure3DScene
          cityName={city.name}
          cityNumber={city.number}
          totalCities={15}
          regionName={city.region}
          accentColor={city.accentColor}
          moduleName={city.moduleName}
          landmarkName={city.landmark}
          stations={stations3D}
          bossStation={bossStationData}
          exitGate={exitGateData}
          onBackToMap={onBackToMap}
        />
      )}

      {/* VIEW MODE 1: Warm Editorial Adventure Path */}
      {viewMode === 'path' && (
        <div className="bg-white border-2 border-[#EADFCF] rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2ECE1]">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#24140E] font-serif">
                Adventure Path: {city.name}
              </h2>
              <p className="text-xs text-[#7A6B60] font-medium">
                Complete each level in order to unlock the {city.name} Boss Mission.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E0D5C7] text-xs font-black text-[#B45309]">
              {completedLevels.length} / {city.levels.length} Completed
            </span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-3 before:content-[''] before:absolute before:left-[15px] sm:before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-[#EADFCF]">
            {city.levels.map((level) => {
              const record = progress.completedLevels[level.id];
              const isCompleted = Boolean(record);
              const isUnlocked = isLevelUnlocked(level.levelNumber - 1);
              return (
                <div
                  key={level.id}
                  className={`relative flex items-center justify-between gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isUnlocked
                      ? 'bg-[#FFFDF9] border-[#E05615]/50 shadow-xs'
                      : 'bg-[#FAF7F2] border-[#E8DFD5] opacity-70'
                  }`}
                >
                  <div
                    className={`absolute -left-[25px] sm:-left-[29px] w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-200'
                        : isUnlocked
                        ? 'bg-[#E05615] text-white border-amber-200'
                        : 'bg-[#EFE6D9] text-[#8C7A6B] border-[#E0D5C7]'
                    }`}
                  >
                    {isCompleted ? '✓' : level.levelNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#B45309]">
                        Level {level.levelNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E0D5C7] text-[#7A6B60] font-bold">
                        {level.syllabusTopic}
                      </span>
                    </div>
                    <h3 className="font-serif font-black text-sm sm:text-base text-[#24140E] truncate">
                      {level.title}
                    </h3>
                    <p className="text-xs text-[#6B584D] truncate">{level.subtitle}</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    {isCompleted && (
                      <div className="hidden sm:flex items-center space-x-0.5 text-amber-500 text-xs">
                        {[1, 2, 3].map(s => (
                          <span key={s}>{s <= (record?.stars || 0) ? '★' : '☆'}</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => isUnlocked && onOpenLevel(level.id)}
                      disabled={!isUnlocked}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        isCompleted
                          ? 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer'
                          : isUnlocked
                          ? 'bg-[#E05615] hover:bg-[#C2410C] text-white shadow-xs cursor-pointer'
                          : 'bg-[#EFE6D9] text-[#8C7A6B] cursor-not-allowed'
                      }`}
                    >
                      {isCompleted ? 'Review' : isUnlocked ? 'Start' : 'Locked'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Curriculum Grid (5 Tiers Breakdown) */}
      {viewMode === 'grid' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#24140E] font-serif flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#E05615]" />
              <span>Curriculum Levels by Difficulty (BAESP101)</span>
            </h2>
            <span className="text-xs text-[#7A6B60] font-bold">
              5 Tiers • 2 Levels per Tier
            </span>
          </div>

          {tiersOrder.map(tier => {
            const tierLevels = city.levels.filter(l => l.tier === tier);
            const badge = getTierBadge(tier);

            return (
              <div 
                key={tier}
                className="p-5 rounded-3xl bg-white border-2 border-[#EADFCF] shadow-sm space-y-3 text-left"
              >
                <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-xs text-[#7A6B60] font-medium">
                    {tierLevels.filter(l => Boolean(progress.completedLevels[l.id])).length} / 2 completed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tierLevels.map(level => {
                    const record = progress.completedLevels[level.id];
                    const isCompleted = Boolean(record);
                    const isUnlocked = isLevelUnlocked(level.levelNumber - 1);

                    return (
                      <div
                        key={level.id}
                        onClick={() => {
                          if (isUnlocked) {
                            setSelectedLevelForPreview(level);
                          }
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                          !isUnlocked
                            ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed select-none'
                            : isCompleted
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-300 shadow-xs cursor-pointer group hover:scale-[1.01]'
                            : 'bg-white hover:bg-[#FFFDF9] border-[#E8DFD5] hover:border-amber-400 shadow-xs cursor-pointer group hover:scale-[1.01]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-[#7A6B60] flex items-center space-x-1">
                              {!isUnlocked && <Lock className="w-3 h-3 text-stone-500 mr-1 inline" />}
                              <span>Nivel {level.levelNumber}</span>
                            </span>
                            <div className="flex items-center space-x-1 text-amber-500">
                              {[1, 2, 3].map(starIndex => (
                                <Star
                                  key={starIndex}
                                  className={`w-3.5 h-3.5 ${
                                    record && record.stars >= starIndex
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-stone-300 fill-stone-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <h3 className={`text-base font-black font-serif transition-colors ${
                            !isUnlocked ? 'text-stone-500' : 'text-[#24140E] group-hover:text-[#E05615]'
                          }`}>
                            {level.title}
                          </h3>
                          <p className="text-xs text-[#B45309] font-bold mt-0.5">
                            {level.subtitle}
                          </p>
                          <p className="text-xs text-[#6B584D] mt-2 line-clamp-2 leading-relaxed font-medium">
                            {level.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-[#F2ECE1] flex items-center justify-between text-xs">
                          <span className="text-sky-800 font-bold">
                            +{level.xpReward} XP • +{level.coinReward} monedas
                          </span>
                          <div className={`flex items-center space-x-1 font-bold ${
                            !isUnlocked 
                              ? 'text-stone-400' 
                              : 'text-[#E05615] group-hover:translate-x-1 transition-transform'
                          }`}>
                            <span>{isCompleted ? 'Review' : isUnlocked ? 'Start' : 'Locked'}</span>
                            {isUnlocked ? <ChevronRight className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
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
      )}

      {/* Boss Mission Encounter Banner Gate (Warm Editorial Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF8EE] via-[#FFF4E6] to-[#FFF1EB] border-2 border-amber-300 p-6 sm:p-8 shadow-sm text-[#24140E]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E05615]/10 border border-[#E05615]/30 text-[#C2410C] text-xs font-black mb-3">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>City Boss Mission • 80% Mastery Required</span>
            </div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{city.bossMission.badgeIcon}</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#24140E] font-serif">
                {city.bossMission.title}
              </h3>
            </div>
            <p className="text-sm font-bold text-[#B45309] mb-2">
              Character: {city.bossMission.characterName} ({city.bossMission.characterRole})
            </p>
            <p className="text-[#6B584D] text-sm leading-relaxed mb-4 font-medium">
              {city.bossMission.scenario}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white border border-amber-300 text-[#B45309] font-bold">
                🪙 +{city.bossMission.coinReward} bonus coins
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-sky-300 text-sky-700 font-bold">
                ✨ +{city.bossMission.xpReward} XP
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-amber-300 text-[#24140E] font-bold">
                🏆 Trophy: {city.bossMission.badgeName}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="flex flex-col items-center justify-center shrink-0 min-w-[220px]">
            <button
              onClick={() => {
                if (allLevelsDone || isBossPassed) {
                  onOpenBoss();
                }
              }}
              disabled={!allLevelsDone && !isBossPassed}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base shadow-md transition-all flex items-center justify-center space-x-2 border-2 ${
                !allLevelsDone && !isBossPassed
                  ? 'bg-[#EFE6D9] text-[#8C7A6B] border-[#E0D5C7] cursor-not-allowed'
                  : isBossPassed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 cursor-pointer'
                  : 'bg-[#E05615] hover:bg-[#C2410C] text-white border-[#C2410C] cursor-pointer'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{isBossPassed ? 'Retry Boss Challenge' : 'Start Boss Challenge'}</span>
            </button>
            <p className="text-[11px] text-[#7A6B60] mt-2 text-center font-medium">
              {isBossPassed 
                ? `Passed (${bossRecord?.scorePercent}%). Next city unlocked.` 
                : !allLevelsDone
                ? `Complete all 10 levels in ${city.name} to unlock.`
                : 'Minimum 80% score required to unlock the next city.'}
            </p>
          </div>
        </div>
      </div>

      {/* Level Details Modal (Screen 7 Preview) */}
      {selectedLevelForPreview && (
        <LevelDetailsModal
          level={selectedLevelForPreview}
          cityName={city.name}
          onClose={() => setSelectedLevelForPreview(null)}
          onStartLevel={() => {
            const lvlId = selectedLevelForPreview.id;
            setSelectedLevelForPreview(null);
            onOpenLevel(lvlId);
          }}
        />
      )}

      {/* Tapas Cultural Experience Modal */}
      {showTapasModal && (() => {
        const cityTapas = CITY_TAPAS_SPECIALTIES[city.id] || {
          title: 'Chiringuito Tradicional',
          foodName: 'Tapas Variadas y Refresco Típico',
          description: 'Deliciosas tapas locales preparadas con los mejores ingredientes de la región.',
          quote: '¡Buen provecho en tu viaje por España!',
          icon: '🥘'
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF7F2] border-2 border-[#EADFCF] p-6 sm:p-8 shadow-2xl animate-scaleUp text-[#24140E]">
              <button
                onClick={() => setShowTapasModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] border border-[#E0D5C7] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <span className="text-4xl">{cityTapas.icon}</span>
                <div className="text-left">
                  <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">
                    Parada Gastronómica en {city.name}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black font-serif text-[#24140E]">
                    {cityTapas.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF8EE] border border-amber-300 mb-4 text-left">
                <h4 className="text-sm font-black text-[#B45309] mb-1">
                  Especialidad: {cityTapas.foodName}
                </h4>
                <p className="text-xs sm:text-sm text-[#6B584D] leading-relaxed font-medium">
                  {cityTapas.description}
                </p>
              </div>

              {/* Spanish Cultural Quote */}
              <div className="p-4 rounded-2xl bg-white border border-[#EADFCF] mb-6">
                <div className="text-xs sm:text-sm italic font-semibold text-[#524136] text-center">
                  "{cityTapas.quote}"
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#B45309] font-black mb-4">
                <span>🪙 +100 monedas añadidas</span>
                <span className="text-sky-800">⭐ +50 XP cultural</span>
              </div>

              <button
                onClick={() => setShowTapasModal(false)}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-sm shadow-md transition-all hover:scale-102"
              >
                Thank You! Continue Adventure
              </button>
            </div>
          </div>
        );
      })()}

      {/* Chest Celebration Alert Modal */}
      {chestAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#2a1d0f] via-[#201509] to-[#120c05] border-4 border-amber-400 p-6 sm:p-8 shadow-2xl text-center text-white animate-scaleUp">
            <button
              onClick={() => setChestAlert(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-6xl mb-3 animate-bounce">
              🎁
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-amber-300 font-serif mb-2">
              {chestAlert.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 mb-5 leading-relaxed">
              {chestAlert.message}
            </p>

            {chestAlert.coins > 0 && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-black text-lg sm:text-xl shadow-lg mb-6">
                <span>🪙</span>
                <span>+{chestAlert.coins} Monedas de Oro</span>
              </div>
            )}

            <button
              onClick={() => setChestAlert(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl transition-transform hover:scale-102"
            >
              ¡Fantástico!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
