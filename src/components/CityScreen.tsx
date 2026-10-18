import React, { useState } from 'react';
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
  const [viewMode, setViewMode] = useState<'3d' | 'path' | 'grid'>('path');
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
          ← Volver a Inicio
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
  const isLevelUnlocked = (levelIndex: number): boolean => {
    if (levelIndex === 0) return true;
    const prevLevel = city.levels[levelIndex - 1];
    return Boolean(progress.completedLevels[prevLevel.id]);
  };

  // 3D Adventure Stalls Layout (positions matching the square)
  const STALL_POSITIONS = [
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
  ];

  const TIER_COLORS: Record<DifficultyTier, number> = {
    easy: 0x10b981,
    medium: 0x38bdf8,
    tough: 0xf59e0b,
    hard: 0xf97316,
    hot: 0xf43f5e
  };

  const stations3D: AdventureStation3D[] = city.levels.map((lvl, idx) => {
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

  const nextCity = getNextCity(city.id);
  const exitGateData = {
    targetCityName: nextCity?.name || 'La Gran Fiesta',
    isUnlocked: isBossPassed || allLevelsDone,
    onWalkThrough: () => {
      onBackToMap();
    }
  };

  const bossStationData = city.bossMission ? {
    label: city.bossMission.title,
    bossName: city.bossMission.characterName,
    isPassed: isBossPassed,
    allLevelsDone,
    onInteract: () => {
      onOpenBoss();
    }
  } : undefined;

  return (
    <div className="min-h-[calc(100vh-68px)] p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMap}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] text-[#24140E] text-sm font-bold border border-[#E0D5C7] shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#E05615]" />
          <span>Volver al Mapa de España</span>
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
              <span>Aventura 3D</span>
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
              <span>Ruta</span>
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
              <span>Sílabo</span>
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
              <span>Ciudad {city.number} de 15</span>
              <span>•</span>
              <span>{city.landmark}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#24140E] font-serif tracking-tight">
              {city.name}
            </h1>
            <p className="text-[#B45309] font-bold text-sm mt-1">
              {city.number === 1 ? 'Ciudad de los Comienzos (City of Beginnings)' : `Región: ${city.region}`}
            </p>
            <p className="text-[#6B584D] text-sm sm:text-base leading-relaxed mt-2 font-medium">
              {city.description}
            </p>
          </div>

          {/* Quick city progress summary badge */}
          <div className="bg-white/95 border-2 border-[#EADFCF] rounded-2xl p-4 flex flex-col items-center justify-center min-w-[210px] text-center shrink-0 shadow-sm text-[#24140E]">
            <span className="text-xs text-[#7A6B60] uppercase tracking-wider font-bold mb-1">
              Progreso en {city.name}
            </span>
            <div className="text-3xl font-black text-[#B45309]">
              {completedLevels.length} / 10
            </div>
            <span className="text-xs text-[#7A6B60]">Niveles Superados</span>

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
                  <span>Jefe Superado ({bossRecord?.scorePercent}%)</span>
                </span>
              ) : (
                <span className="text-[#B45309] flex items-center space-x-1 font-bold">
                  <ShieldAlert className="w-4 h-4 text-[#C2410C]" />
                  <span>Jefe Pendiente (80% req.)</span>
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

      {/* VIEW MODE 1: Illustrated Winding Casual Adventure Trail (Aesthetic Spanish RPG Trail) */}
      {viewMode === 'path' && (
        <div className="flex flex-col gap-4 select-none">
          {/* Top Wooden Trail HUD Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#2e1d11]/95 border-2 border-[#b45309] shadow-2xl text-white backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <span className="text-2xl filter drop-shadow">🧭</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-amber-300 font-serif tracking-wide flex items-center space-x-2">
                  <span>Sendero de Aventura: {city.name}</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {completedLevels.length} de 10 niveles superados • Sigue las aguas hasta la Fortaleza del Jefe
                </p>
              </div>
            </div>

            {/* In-game trail counters */}
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-black">
              {/* Hearts / Lives */}
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/50 text-rose-300 shadow">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
                <span>{progress.stats.lives || 3}/{progress.stats.maxLives || 3}</span>
              </div>

              {/* Stars in city */}
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 shadow">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{city.levels.reduce((acc, lvl) => acc + (progress.completedLevels[lvl.id]?.stars || 0), 0)}/30</span>
              </div>

              {/* Coins */}
              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-200 shadow">
                <span className="text-sm">🪙</span>
                <span>{progress.stats.coins}</span>
              </div>
            </div>
          </div>

          {/* Dedicated Self-Contained Illustrated Trail Canvas (Zero coordinate drift between SVG and HTML!) */}
          <div className="relative rounded-3xl overflow-hidden border-4 border-[#4a2e18] shadow-2xl bg-[#3f6212] w-full h-[2150px]">
            {/* SVG Canvas for Background Scenery, River, and Connectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 800 2150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="100%">
                  <stop offset="0%" stopColor="#bae6fd" />
                  <stop offset="50%" stopColor="#e0f2fe" />
                  <stop offset="100%" stopColor="#fef3c7" />
                </linearGradient>

                <linearGradient id="meadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#65a30d" />
                  <stop offset="25%" stopColor="#4d7c0f" />
                  <stop offset="55%" stopColor="#3f6212" />
                  <stop offset="85%" stopColor="#4d7c0f" />
                  <stop offset="100%" stopColor="#65a30d" />
                </linearGradient>

                <linearGradient id="riverBank" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="15%" stopColor="#fde68a" />
                  <stop offset="50%" stopColor="#fef3c7" />
                  <stop offset="85%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                <linearGradient id="riverWater" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="35%" stopColor="#0ea5e9" />
                  <stop offset="70%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>

                <filter id="trailGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* 1. Sky & Distant Mountain Horizon (y: 0 to 260) */}
              <rect x="0" y="0" width="800" height="260" fill="url(#skyGrad)" />
              {/* Spanish Sierra Mountain Silhouettes */}
              <path d="M 0 200 L 90 120 L 210 180 L 350 100 L 480 165 L 620 95 L 750 160 L 800 130 L 800 270 L 0 270 Z" fill="#94a3b8" opacity="0.65" />
              <path d="M 0 240 L 130 155 L 280 220 L 420 145 L 560 210 L 710 150 L 800 195 L 800 300 L 0 300 Z" fill="#64748b" opacity="0.80" />

              {/* 2. Rolling Green Meadows Landscape (y: 260 to 2150) */}
              <rect x="0" y="260" width="800" height="1890" fill="url(#meadowGrad)" />
              {/* Soft Hills Contours */}
              <path d="M 0 350 Q 200 300 400 340 T 800 320 L 800 2150 L 0 2150 Z" fill="#4d7c0f" opacity="0.35" />
              <path d="M 0 700 Q 300 650 550 710 T 800 680 L 800 2150 L 0 2150 Z" fill="#3f6212" opacity="0.25" />
              <path d="M 0 1200 Q 250 1150 500 1210 T 800 1180 L 800 2150 L 0 2150 Z" fill="#4d7c0f" opacity="0.25" />
              <path d="M 0 1700 Q 350 1650 600 1720 T 800 1690 L 800 2150 L 0 2150 Z" fill="#365314" opacity="0.20" />

              {/* 3. The Citadel Mountain Plateau (The Stone Hill where Boss Fortress rests) */}
              <path d="M 150 380 Q 400 220 650 380 L 680 440 Q 400 370 120 440 Z" fill="#57534e" stroke="#292524" strokeWidth="4" />
              <path d="M 180 365 Q 400 235 620 365 L 645 405 Q 400 345 155 405 Z" fill="#78716c" opacity="0.85" />

              {/* 4. Sandy River Bed Embankment (Width 126px) */}
              <path
                d="M 330 2150
                   L 330 2040
                   C 330 1960, 330 1940, 330 1890
                   C 330 1820, 460 1810, 460 1740
                   C 460 1670, 520 1660, 520 1590
                   C 520 1520, 340 1510, 340 1440
                   C 340 1370, 210 1360, 210 1290
                   C 210 1220, 320 1210, 320 1140
                   C 320 1070, 460 1060, 460 990
                   C 460 920, 590 910, 590 840
                   C 590 770, 530 760, 530 690
                   C 530 620, 400 600, 400 530
                   L 400 370"
                fill="none"
                stroke="url(#riverBank)"
                strokeWidth="126"
                strokeLinecap="round"
              />

              {/* 5. Crystal Turquoise River Flow (Width 92px) */}
              <path
                d="M 330 2150
                   L 330 2040
                   C 330 1960, 330 1940, 330 1890
                   C 330 1820, 460 1810, 460 1740
                   C 460 1670, 520 1660, 520 1590
                   C 520 1520, 340 1510, 340 1440
                   C 340 1370, 210 1360, 210 1290
                   C 210 1220, 320 1210, 320 1140
                   C 320 1070, 460 1060, 460 990
                   C 460 920, 590 910, 590 840
                   C 590 770, 530 760, 530 690
                   C 530 620, 400 600, 400 530
                   L 400 370"
                fill="none"
                stroke="url(#riverWater)"
                strokeWidth="92"
                strokeLinecap="round"
              />

              {/* 6. Water Ripple Waves */}
              <path
                d="M 330 2150
                   L 330 2040
                   C 330 1960, 330 1940, 330 1890
                   C 330 1820, 460 1810, 460 1740
                   C 460 1670, 520 1660, 520 1590
                   C 520 1520, 340 1510, 340 1440
                   C 340 1370, 210 1360, 210 1290
                   C 210 1220, 320 1210, 320 1140
                   C 320 1070, 460 1060, 460 990
                   C 460 920, 590 910, 590 840
                   C 590 770, 530 760, 530 690
                   C 530 620, 400 600, 400 530
                   L 400 370"
                fill="none"
                stroke="#f0f9ff"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="24 38"
                opacity="0.85"
              />

              {/* 7. Ancient Stone Bridge Leading from Citadel Gates to Level 10 */}
              <rect x="340" y="380" width="120" height="110" rx="10" fill="#78716c" stroke="#44403c" strokeWidth="4" />
              <line x1="340" y1="408" x2="460" y2="408" stroke="#57534e" strokeWidth="3" />
              <line x1="340" y1="435" x2="460" y2="435" stroke="#57534e" strokeWidth="3" />
              <line x1="340" y1="462" x2="460" y2="462" stroke="#57534e" strokeWidth="3" />
              <circle cx="352" cy="395" r="5" fill="#f59e0b" filter="url(#trailGlow)" />
              <circle cx="448" cy="395" r="5" fill="#f59e0b" filter="url(#trailGlow)" />
              <circle cx="352" cy="450" r="5" fill="#f59e0b" filter="url(#trailGlow)" />
              <circle cx="448" cy="450" r="5" fill="#f59e0b" filter="url(#trailGlow)" />

              {/* 8. Golden Dashed Stepping Stone Guide (Exact curve alignment with nodes!) */}
              <path
                d="M 330 2040
                   C 330 1960, 330 1940, 330 1890
                   C 330 1820, 460 1810, 460 1740
                   C 460 1670, 520 1660, 520 1590
                   C 520 1520, 340 1510, 340 1440
                   C 340 1370, 210 1360, 210 1290
                   C 210 1220, 320 1210, 320 1140
                   C 320 1070, 460 1060, 460 990
                   C 460 920, 590 910, 590 840
                   C 590 770, 530 760, 530 690
                   C 530 620, 400 600, 400 530
                   L 400 420"
                fill="none"
                stroke="#fef08a"
                strokeWidth="6"
                strokeDasharray="14 10"
                strokeLinecap="round"
                filter="url(#trailGlow)"
              />

              {/* 9. Decorative Spanish Pines and Scenery Clusters */}
              <g opacity="0.9">
                {/* Summit Pines */}
                <polygon points="120,340 135,305 150,340" fill="#14532d" />
                <polygon points="125,320 135,290 145,320" fill="#16a34a" />
                <polygon points="650,350 665,315 680,350" fill="#14532d" />
                <polygon points="655,330 665,300 675,330" fill="#16a34a" />

                {/* Upper Valley Groves */}
                <polygon points="90,750 105,715 120,750" fill="#14532d" />
                <polygon points="95,730 105,700 115,730" fill="#16a34a" />
                <polygon points="710,880 725,845 740,880" fill="#14532d" />
                <polygon points="715,860 725,830 735,860" fill="#16a34a" />

                {/* Mid Valley Groves */}
                <polygon points="80,1400 95,1365 110,1400" fill="#14532d" />
                <polygon points="85,1380 95,1350 105,1380" fill="#16a34a" />
                <polygon points="720,1500 735,1465 750,1500" fill="#14532d" />
                <polygon points="725,1480 735,1450 745,1480" fill="#16a34a" />

                {/* Lower Valley Pines */}
                <polygon points="90,1950 105,1915 120,1950" fill="#14532d" />
                <polygon points="95,1930 105,1900 115,1930" fill="#16a34a" />
                <polygon points="680,1980 695,1945 710,1980" fill="#14532d" />
                <polygon points="685,1960 695,1930 705,1960" fill="#16a34a" />
              </g>

              {/* 10. Wildflower Patches (Spanish red poppies and golden daisies) */}
              <g opacity="0.85">
                <circle cx="150" cy="550" r="3" fill="#ef4444" />
                <circle cx="156" cy="554" r="2.5" fill="#facc15" />
                <circle cx="162" cy="548" r="3" fill="#ef4444" />
                <circle cx="680" cy="620" r="3" fill="#ef4444" />
                <circle cx="688" cy="625" r="2.5" fill="#facc15" />
                <circle cx="180" cy="1100" r="3" fill="#facc15" />
                <circle cx="188" cy="1105" r="3" fill="#ef4444" />
                <circle cx="660" cy="1220" r="3" fill="#ef4444" />
                <circle cx="667" cy="1224" r="2.5" fill="#facc15" />
                <circle cx="160" cy="1780" r="3" fill="#ef4444" />
                <circle cx="168" cy="1785" r="2.5" fill="#facc15" />
              </g>
            </svg>

            {/* HTML INTERACTIVE ELEMENTS LAYER (100% Shared Coordinate Space with SVG!) */}
            <div className="absolute inset-0 w-full h-full z-10 pointer-events-auto">
              
              {/* 1. Grand Boss Fortress Sanctuary (Summit of the Citadel, guaranteed clearance) */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '36px',
                  transform: 'translateX(-50%)'
                }}
                translate="no"
                className="notranslate z-20 w-80 sm:w-96 text-center"
              >
              <div
                onClick={onOpenBoss}
                className={`group cursor-pointer rounded-3xl p-4 sm:p-5 border-4 transition-all duration-300 shadow-2xl flex flex-col items-center ${
                  isBossPassed
                    ? 'bg-gradient-to-b from-[#1c1828] via-[#291b35] to-[#141221] border-amber-300 shadow-purple-500/30 hover:scale-102'
                    : allLevelsDone
                    ? 'bg-gradient-to-b from-[#3b1218] via-[#4a1520] to-[#240c12] border-amber-400 shadow-rose-600/50 hover:scale-105 animate-pulse'
                    : 'bg-gradient-to-b from-[#181926] via-[#1e2030] to-[#12131d] border-slate-600 shadow-black/60 hover:scale-102'
                }`}
              >
                {/* Castle Battlements Crown */}
                <div className="flex items-center space-x-1.5 -mt-7 mb-1.5">
                  <div className="w-5 h-4 bg-amber-400 rounded-t-sm shadow" />
                  <div className="w-5 h-4 bg-amber-500 rounded-t-sm shadow" />
                  <div className="w-6 h-5 bg-amber-300 rounded-t-sm shadow-md" />
                  <div className="w-5 h-4 bg-amber-500 rounded-t-sm shadow" />
                  <div className="w-5 h-4 bg-amber-400 rounded-t-sm shadow" />
                </div>

                {/* Boss Crest & Portrait */}
                <div className="relative mb-2">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-1 shadow-xl flex items-center justify-center border-2 border-white">
                    <div className="w-full h-full bg-[#1e172a] rounded-xl flex items-center justify-center text-3xl sm:text-4xl">
                      {city.bossMission.badgeIcon}
                    </div>
                  </div>
                  {isBossPassed && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] sm:text-xs font-black uppercase mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Misión del Jefe de {city.name}</span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-white font-serif leading-tight">
                  {city.bossMission.title}
                </h4>
                <p className="text-xs text-amber-300 font-bold mt-0.5">
                  {city.bossMission.characterName} • {city.bossMission.characterRole}
                </p>

                {/* Progress bar to boss */}
                <div className="w-full mt-2.5 px-3 py-1.5 rounded-xl bg-white/10 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-300">Requisito de Entrada:</span>
                  <span className={allLevelsDone ? 'text-emerald-400 font-black' : 'text-amber-300'}>
                    {completedLevels.length} / 10 Niveles
                  </span>
                </div>

                {/* Status and Action Button */}
                <div className="w-full mt-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBoss();
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center space-x-2 border-2 transition-transform cursor-pointer ${
                      isBossPassed
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-emerald-300 hover:scale-105'
                        : allLevelsDone
                        ? 'bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 text-white border-white hover:scale-105 shadow-amber-500/40 glow-gold'
                        : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {isBossPassed
                        ? `¡Jefe Superado (${bossRecord?.scorePercent}%)! Reintentar`
                        : allLevelsDone
                        ? '¡Afrontar Desafío del Jefe (80% req.)!'
                        : `Desafiar al Jefe (${completedLevels.length}/10 niveles)`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Interactive Chiringuito de Tapas (Right Riverbank Terrace, opposite Level 6/7) */}
            <div
              style={{
                position: 'absolute',
                left: '84%',
                top: '50.0%',
                transform: 'translate(-50%, -50%)'
              }}
              className="z-20 text-center"
            >
              {(() => {
                const tapasId = `tapas-${city.id}`;
                const isTapasClaimed = progress.festivalVisitedStalls.includes(tapasId);
                const cityTapas = CITY_TAPAS_SPECIALTIES[city.id] || {
                  title: 'Chiringuito Tradicional',
                  foodName: 'Tapas Variadas y Refresco Típico',
                  description: 'Deliciosas tapas locales preparadas con los mejores ingredientes de la región.',
                  quote: '¡Buen provecho en tu viaje por España!',
                  icon: '🥘'
                };

                return (
                  <button
                    onClick={() => {
                      if (!isTapasClaimed) {
                        visitFestivalStall(tapasId, 100);
                        try {
                          confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
                        } catch {
                          // ignore
                        }
                      }
                      setShowTapasModal(true);
                    }}
                    className="group relative flex flex-col items-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title={`Chiringuito de Tapas de ${city.name}`}
                  >
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-[#7c2d12] via-[#ea580c] to-[#f59e0b] p-1 shadow-2xl border-2 border-white flex flex-col items-center justify-center">
                      <div className="text-3xl sm:text-4xl mb-0.5 filter drop-shadow">
                        {cityTapas.icon}
                      </div>
                      <span className="text-[10px] font-black text-white leading-tight">
                        Tapas
                      </span>
                      {!isTapasClaimed && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-white animate-pulse">
                          !
                        </span>
                      )}
                    </div>
                    <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#3d1a0c] text-amber-300 border border-amber-400 text-[10px] font-black shadow whitespace-nowrap">
                      Chiringuito {city.name}
                    </div>
                  </button>
                );
              })()}
            </div>

            {/* 3. Interactive Treasure Chest 1: Gran Cofre Real (Right bank, opposite Level 4/5) */}
            <div
              style={{
                position: 'absolute',
                left: '82%',
                top: '63.5%',
                transform: 'translate(-50%, -50%)'
              }}
              className="z-20 text-center"
            >
              <button
                onClick={() => {
                  const chest2Id = `chest-${city.id}-2`;
                  const isClaimed = progress.festivalVisitedStalls.includes(chest2Id);
                  if (isClaimed) {
                    setChestAlert({
                      title: 'Cofre Ya Reclamado',
                      message: `¡Ya has recogido las 250 monedas de este cofre en ${city.name}!`,
                      coins: 0
                    });
                    return;
                  }
                  visitFestivalStall(chest2Id, 250);
                  try {
                    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
                  } catch {
                    // ignore
                  }
                  setChestAlert({
                    title: '¡Gran Cofre Real Desbloqueado!',
                    message: `¡Enhorabuena! Has abierto el cofre real en el sendero de ${city.name}.`,
                    coins: 250
                  });
                }}
                className="group relative flex flex-col items-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                title="Cofre Real Secreto"
              >
                {(() => {
                  const isClaimed = progress.festivalVisitedStalls.includes(`chest-${city.id}-2`);
                  return (
                    <>
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1.5 flex items-center justify-center border-2 shadow-xl ${
                        isClaimed
                          ? 'bg-amber-900/60 border-amber-600/50 opacity-80'
                          : 'bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 border-white shadow-amber-500/50 animate-bounce'
                      }`}>
                        <span className="text-3xl sm:text-4xl filter drop-shadow">
                          {isClaimed ? '✨' : '👑'}
                        </span>
                      </div>
                      <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-black border shadow whitespace-nowrap ${
                        isClaimed
                          ? 'bg-slate-800/90 text-slate-400 border-slate-600'
                          : 'bg-amber-400 text-slate-950 border-white'
                      }`}>
                        {isClaimed ? 'Reclamado (+250)' : 'Cofre Real (+250 🪙)'}
                      </div>
                    </>
                  );
                })()}
              </button>
            </div>

            {/* 4. Interactive Treasure Chest 2: Cofre Secreto (Left bank, opposite Level 2/3) */}
            <div
              style={{
                position: 'absolute',
                left: '18%',
                top: '77.5%',
                transform: 'translate(-50%, -50%)'
              }}
              className="z-20 text-center"
            >
              <button
                onClick={() => {
                  const chest1Id = `chest-${city.id}-1`;
                  const isClaimed = progress.festivalVisitedStalls.includes(chest1Id);
                  if (isClaimed) {
                    setChestAlert({
                      title: 'Cofre Ya Reclamado',
                      message: `¡Ya has recogido las 150 monedas de este cofre en ${city.name}!`,
                      coins: 0
                    });
                    return;
                  }
                  visitFestivalStall(chest1Id, 150);
                  try {
                    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
                  } catch {
                    // ignore
                  }
                  setChestAlert({
                    title: '¡Cofre Secreto Encontrado!',
                    message: `¡Enhorabuena! Has abierto un cofre secreto en el sendero de ${city.name}.`,
                    coins: 150
                  });
                }}
                className="group relative flex flex-col items-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                title="Cofre de Monedas Secreto"
              >
                {(() => {
                  const isClaimed = progress.festivalVisitedStalls.includes(`chest-${city.id}-1`);
                  return (
                    <>
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl p-1.5 flex items-center justify-center border-2 shadow-xl ${
                        isClaimed
                          ? 'bg-amber-900/60 border-amber-600/50 opacity-80'
                          : 'bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 border-white shadow-amber-500/50 animate-bounce'
                      }`}>
                        <span className="text-3xl sm:text-4xl filter drop-shadow">
                          {isClaimed ? '✨' : '🎁'}
                        </span>
                      </div>
                      <div className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-black border shadow whitespace-nowrap ${
                        isClaimed
                          ? 'bg-slate-800/90 text-slate-400 border-slate-600'
                          : 'bg-amber-400 text-slate-950 border-white'
                      }`}>
                        {isClaimed ? 'Reclamado (+150)' : 'Cofre Secreto (+150 🪙)'}
                      </div>
                    </>
                  );
                })()}
              </button>
            </div>

            {/* 5. The 10 River Stepping Stone Level Nodes (Perfect Organic Curve Alignment & Generous 150px Spacing!) */}
            {[
              { levelNum: 1, x: 41.25, y: 87.91 },
              { levelNum: 2, x: 57.5, y: 80.93 },
              { levelNum: 3, x: 65.0, y: 73.95 },
              { levelNum: 4, x: 42.5, y: 66.98 },
              { levelNum: 5, x: 26.25, y: 60.0 },
              { levelNum: 6, x: 40.0, y: 53.02 },
              { levelNum: 7, x: 57.5, y: 46.05 },
              { levelNum: 8, x: 73.75, y: 39.07 },
              { levelNum: 9, x: 66.25, y: 32.09 },
              { levelNum: 10, x: 50.0, y: 24.65 }
            ].map(pos => {
              const level = city.levels[pos.levelNum - 1];
              const idx = pos.levelNum - 1;
              const record = progress.completedLevels[level.id];
              const isDone = Boolean(record);
              const isUnlocked = isLevelUnlocked(idx);
              const firstUnfinishedIdx = city.levels.findIndex(lvl => !progress.completedLevels[lvl.id]);
              const currentActiveLevelIdx = firstUnfinishedIdx !== -1 ? firstUnfinishedIdx : 9;
              const isCurrent = idx === currentActiveLevelIdx;
              const stars = record ? record.stars : 0;

              return (
                <div
                  key={level.id}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className="z-20 flex flex-col items-center"
                >
                  {/* Player Avatar Pin standing on current active node */}
                  {isCurrent && (
                    <div className="absolute -top-16 pointer-events-none">
                      <PlayerAvatarPin character={progress.profile?.character} />
                    </div>
                  )}

                  {/* 3D Stepping Stone Button */}
                  <button
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedLevelForPreview(level);
                      }
                    }}
                    className={`group relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-black transition-all duration-300 cursor-pointer ${
                      isDone
                        ? 'bg-gradient-to-b from-emerald-400 via-teal-600 to-emerald-800 border-4 border-amber-300 text-white shadow-[0_8px_0_rgba(6,78,59,0.85)] hover:scale-110 active:translate-y-1'
                        : isCurrent
                        ? 'bg-gradient-to-b from-amber-300 via-orange-400 to-amber-500 border-4 border-white text-slate-950 shadow-[0_8px_0_rgba(180,83,9,0.9)] ring-4 ring-amber-300/80 hover:scale-110 active:translate-y-1 glow-gold'
                        : 'bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border-4 border-slate-500 text-slate-400 shadow-[0_6px_0_rgba(30,41,59,0.8)] cursor-not-allowed opacity-80'
                    }`}
                  >
                    {isDone ? (
                      <span className="text-2xl sm:text-3xl font-black drop-shadow">
                        {level.levelNumber}
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-2xl sm:text-3xl font-black drop-shadow">
                        {level.levelNumber}
                      </span>
                    ) : (
                      <Lock className="w-6 h-6 text-slate-400" />
                    )}

                    {/* Green checkmark tag when completed */}
                    {isDone && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>

                  {/* 3 Golden Stars Plaque */}
                  <div className="flex items-center space-x-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/85 border border-slate-700 shadow-sm">
                    {[1, 2, 3].map(sIdx => (
                      <Star
                        key={sIdx}
                        className={`w-3 h-3 ${
                          stars >= sIdx
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Level Title Plaque: Clear, 2-line readable text that never truncates awkwardly */}
                  <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-[#24170D]/95 border-2 border-amber-500/70 text-white shadow-xl text-center max-w-[170px] backdrop-blur-sm transition-all group-hover:scale-105">
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Nivel {level.levelNumber}
                    </div>
                    <div className="text-xs font-bold leading-snug line-clamp-2 text-slate-100">
                      {level.title}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 6. Trailhead Welcome Gate (Bottom of the river) */}
            <div
              style={{
                position: 'absolute',
                left: '41.25%',
                top: '94.88%',
                transform: 'translate(-50%, -50%)'
              }}
              className="z-20 text-center"
            >
              <div className="px-4 py-2 rounded-2xl bg-[#2e1d11]/90 border-2 border-amber-400 text-white shadow-xl flex items-center space-x-2">
                <span className="text-xl">🏁</span>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                    PUNTO DE PARTIDA
                  </div>
                  <div className="text-xs font-bold text-slate-200">
                    Comienza el sendero en {city.name}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      )}

      {/* VIEW MODE 2: Curriculum Grid (5 Tiers Breakdown) */}
      {viewMode === 'grid' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Niveles Curriculares por Dificultad (BAESP101)</span>
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
                className="p-5 rounded-3xl bg-white border-2 border-[#EADFCF] shadow-sm space-y-3 text-left"
              >
                <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-xs text-[#7A6B60] font-medium">
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
                        onClick={() => setSelectedLevelForPreview(level)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer group hover:scale-[1.01] ${
                          isCompleted
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-300 shadow-xs'
                            : 'bg-white hover:bg-[#FFFDF9] border-[#E8DFD5] hover:border-amber-400 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-[#7A6B60]">
                              Nivel {level.levelNumber}
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

                          <h3 className="text-base font-black text-[#24140E] font-serif group-hover:text-[#E05615] transition-colors">
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
                          <div className="flex items-center space-x-1 font-bold text-[#E05615] group-hover:translate-x-1 transition-transform">
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
      )}

      {/* Boss Mission Encounter Banner Gate */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2B1B1E] via-[#2A1E30] to-[#1B1F38] border-2 border-fiesta-red/60 p-6 sm:p-8 shadow-2xl">
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

            <div className="flex flex-wrap items-center gap-3 text-xs text-amber-200">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 font-bold">
                +{city.bossMission.coinReward} monedas de bonificación
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/30 font-bold">
                +{city.bossMission.xpReward} XP
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 font-bold">
                Trofeo: {city.bossMission.badgeName}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="flex flex-col items-center justify-center shrink-0 min-w-[200px]">
            <button
              onClick={onOpenBoss}
              className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base shadow-xl transition-all flex items-center justify-center space-x-2 border-2 ${
                isBossPassed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-fiesta-red to-amber-600 hover:from-red-600 hover:to-amber-500 text-white border-amber-400/50 shadow-rose-600/30 glow-gold'
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
                ¡Muchas Gracias! Continuar Aventura
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
