import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { FESTIVAL_STALLS, FESTIVAL_CHARACTERS } from '../data/festivalData';
import { FestivalStall, FestivalCharacter } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import confetti from 'canvas-confetti';
import { Adventure3DScene, AdventureStation3D } from './Adventure3DScene';
import { 
  ArrowLeft, 
  PartyPopper, 
  Sparkles, 
  Award, 
  Coins, 
  CheckCircle2, 
  MessageCircle, 
  GraduationCap,
  Store,
  Users,
  Star,
  Check,
  X,
  MapPin,
  ChevronRight,
  Eye,
  HelpCircle,
  Flame,
  Gamepad2
} from 'lucide-react';

interface FestivalWorldProps {
  onBackToMap: () => void;
  onStartFinalAssessment: () => void;
}

// Clean short display name for festival cards to ensure full legibility without ellipses truncation
const getCleanNpcDisplayName = (name: string): string => {
  return name
    .replace(/^Maestro\s+/, '')
    .replace(/^Catedrática\s+/, '')
    .replace(/^Historiador\s+/, '')
    .replace(/^Astrónomo\s+/, '')
    .replace(/^Capitán\s+/, '')
    .replace(/^Hospitalero\s+/, '')
    .replace(/\s+la\s+del\s+Falla$/, '')
    .replace(/\s+de\s+Ruzafa$/, '')
    .replace(/\s+de\s+Gaudí$/, '')
    .replace(/\s+del\s+Ebro$/, '');
};

export const FestivalWorld: React.FC<FestivalWorldProps> = ({
  onBackToMap,
  onStartFinalAssessment
}) => {
  const { progress, visitFestivalStall, recordDialogueCompleted } = useGame();

  // Active interactive modals
  const [activeNpc, setActiveNpc] = useState<FestivalCharacter | null>(null);
  const [npcQuizAnswer, setNpcQuizAnswer] = useState<string | null>(null);
  const [npcQuizFeedback, setNpcQuizFeedback] = useState<{ isCorrect: boolean; show: boolean }>({
    isCorrect: false,
    show: false
  });
  const [showEnglishTranslation, setShowEnglishTranslation] = useState<boolean>(false);

  // Stall Quiz modal state
  const [activeStall, setActiveStall] = useState<FestivalStall | null>(null);
  const [stallAnswer, setStallAnswer] = useState<string>('');
  const [stallFeedback, setStallFeedback] = useState<{ isCorrect: boolean; show: boolean }>({
    isCorrect: false,
    show: false
  });

  // View mode: '3d' (Three.js exploration) | 'plaza' (illustrated 2.5D square) | 'list' (detailed directory)
  const [viewMode, setViewMode] = useState<'3d' | 'plaza' | 'list'>('3d');

  // Coordinates for the 6 stalls and 14 characters in 3D
  const stallCoords: Record<string, { x: number; z: number }> = {
    'stall-tapas': { x: -14, z: 8 },
    'stall-flamenco': { x: -14, z: 0 },
    'stall-libreria': { x: -14, z: -8 },
    'stall-relojero': { x: 14, z: 8 },
    'stall-estacion': { x: 14, z: 0 },
    'stall-capitania': { x: 14, z: -8 },
  };

  const stallColors: Record<string, number> = {
    'stall-tapas': 0xc60b1e,
    'stall-flamenco': 0xe07a5f,
    'stall-libreria': 0x1d3557,
    'stall-relojero': 0x2a9d8f,
    'stall-estacion': 0xf59e0b,
    'stall-capitania': 0x0284c7,
  };

  const festival3DStations: AdventureStation3D[] = [
    // 6 Market Stalls
    ...FESTIVAL_STALLS.map(stall => {
      const visited = progress.festivalVisitedStalls.includes(stall.id);
      const pos = stallCoords[stall.id] || { x: -10, z: 0 };
      return {
        id: stall.id,
        x: pos.x,
        z: pos.z,
        label: stall.title,
        subLabel: stall.vendorName,
        status: visited ? ('completed' as const) : ('unlocked' as const),
        color: stallColors[stall.id] || 0xf59e0b,
        goodsColor: 0xffc94a,
        onInteract: () => handleOpenStall(stall)
      };
    }),
    // 14 Interactive NPCs (radial around square)
    ...FESTIVAL_CHARACTERS.map((char, idx) => {
      const chatted = progress.rewardedDialogueIds.includes(char.id);
      const angle = (idx / FESTIVAL_CHARACTERS.length) * Math.PI * 2;
      const radius = 6.8 + (idx % 2) * 2.2;
      const nx = Math.cos(angle) * radius;
      const nz = -5 + Math.sin(angle) * radius;

      return {
        id: char.id,
        x: nx,
        z: nz,
        label: `${char.name} (${char.originCity})`,
        subLabel: char.role,
        status: chatted ? ('completed' as const) : ('unlocked' as const),
        color: parseInt((char.avatarColor || '#E11D48').replace('#', ''), 16),
        goodsColor: 0x38bdf8,
        onInteract: () => handleOpenNpc(char)
      };
    })
  ];

  const examStationData = {
    label: 'Carpa Real Academia Española',
    bossName: 'Examen Oficial Acumulativo BAESP101',
    isPassed: Boolean(progress.finalAssessmentCompleted),
    allLevelsDone: true,
    onInteract: () => onStartFinalAssessment()
  };

  const playerName = (progress.profile?.displayName && progress.profile.displayName !== 'Viajero')
    ? progress.profile.displayName
    : (progress.profile?.character?.name && progress.profile.character.name !== 'Alex')
    ? progress.profile.character.name
    : progress.profile?.displayName || progress.profile?.character?.name || 'Viajero';
  const leftStalls = FESTIVAL_STALLS.filter(s => s.side === 'left');
  const rightStalls = FESTIVAL_STALLS.filter(s => s.side === 'right');
  const visitedStallsCount = progress.festivalVisitedStalls.length;
  const rewardedDialoguesCount = progress.rewardedDialogueIds.length;

  // Open NPC dialogue
  const handleOpenNpc = (npc: FestivalCharacter) => {
    setActiveNpc(npc);
    setNpcQuizAnswer(null);
    setNpcQuizFeedback({ isCorrect: false, show: false });
    setShowEnglishTranslation(false);
  };

  // Check NPC interactive quiz answer
  const handleAnswerNpcQuiz = (option: string) => {
    if (!activeNpc?.interactiveQuestion) return;
    setNpcQuizAnswer(option);
    const correct = option === activeNpc.interactiveQuestion.correctAnswer;
    setNpcQuizFeedback({ isCorrect: correct, show: true });

    if (correct) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }
      recordDialogueCompleted(activeNpc.id);
    }
  };

  // Open Market Stall mini-quiz
  const handleOpenStall = (stall: FestivalStall) => {
    setActiveStall(stall);
    setStallAnswer('');
    setStallFeedback({ isCorrect: false, show: false });
  };

  // Check Stall mini-quiz answer
  const handleCheckStallQuiz = () => {
    if (!activeStall || !stallAnswer) return;
    const q = activeStall.miniQuiz;

    let correct = false;
    if (Array.isArray(q.correctAnswer)) {
      correct = q.correctAnswer.some(a => a.toLowerCase().trim() === stallAnswer.toLowerCase().trim());
    } else {
      correct = q.correctAnswer.toLowerCase().trim() === stallAnswer.toLowerCase().trim();
    }

    setStallFeedback({ isCorrect: correct, show: true });
    if (correct) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.55 }
        });
      } catch {
        // Safe fallback
      }
      visitFestivalStall(activeStall.id, activeStall.rewardCoins);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] flex flex-col bg-[#FAF7F2] text-[#24140E]">
      
      {/* ========================================================
          1. FESTIVAL TOP BAR & QUICK CONTROLS
          ======================================================== */}
      <div className="bg-white/95 backdrop-blur-md border-b border-[#EADFCF] shadow-xs px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Back to map button */}
          <button
            onClick={onBackToMap}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white hover:bg-[#F2ECE1] text-[#24140E] text-xs sm:text-sm font-bold border border-[#E0D5C7] shadow-xs transition-transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 text-[#E05615]" />
            <span>Volver al Mapa de España</span>
          </button>

          {/* Festival Title Pill */}
          <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-orange-500/15 border border-amber-300 text-[#B45309] font-black text-xs sm:text-sm shadow-xs">
            <PartyPopper className="w-4 h-4 text-[#E05615]" />
            <span>La Gran Fiesta • Plaza Mayor de la Celebración</span>
          </div>

          {/* Progress & View Toggle */}
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-2 text-xs font-bold px-3 py-1.5 bg-white rounded-full border border-[#E8DFD5] text-[#524136] shadow-xs">
              <span className="text-[#B45309]">🎪 {visitedStallsCount}/6 Puestos</span>
              <span>•</span>
              <span className="text-[#BE185D]">💬 {rewardedDialoguesCount}/14 Amigos</span>
            </div>

            <div className="flex bg-[#EFE7DC] p-1 rounded-full border border-[#E0D5C7] text-xs font-bold">
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1 rounded-full transition-all flex items-center space-x-1 ${
                  viewMode === '3d'
                    ? 'bg-white text-[#24140E] font-black shadow-xs'
                    : 'text-[#7A6B60] hover:text-[#24140E]'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Plaza 3D</span>
              </button>
              <button
                onClick={() => setViewMode('plaza')}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === 'plaza'
                    ? 'bg-white text-[#24140E] font-black shadow-xs'
                    : 'text-[#7A6B60] hover:text-[#24140E]'
                }`}
              >
                🎪 Ilustrada
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#24140E] font-black shadow-xs'
                    : 'text-[#7A6B60] hover:text-[#24140E]'
                }`}
              >
                📋 Directorio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. VIEW 0: PLAYABLE 3D FESTIVAL PLAZA
          ======================================================== */}
      {viewMode === '3d' && (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
          <Adventure3DScene
            cityName="La Gran Fiesta Española"
            cityNumber={16}
            totalCities={16}
            regionName="Plaza Mayor de la Celebración"
            accentColor="#C60B1E"
            landmarkName="Carpa de la Real Academia & Puestos"
            stations={festival3DStations}
            bossStation={examStationData}
            onBackToMap={onBackToMap}
          />
        </div>
      )}

      {/* ========================================================
          3. VIEW 1: THE ILLUSTRATED FESTIVAL PLAZA ARENA
          ======================================================== */}
      {viewMode === 'plaza' && (
        <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between select-none">
          
          {/* Main Visual Arena Container */}
          <div className="relative w-full max-w-7xl mx-auto p-4 sm:p-6 my-auto">
            
            {/* The Illustrated Plaza Card Canvas */}
            <div className="relative w-full min-h-[720px] rounded-3xl overflow-hidden border-4 border-amber-300 shadow-2xl flex flex-col justify-between" style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,248,238,0.25), rgba(254,243,199,0.35)), url(/game-art/madrid-plaza.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              
              {/* --- SKY AND FESTIVE BACKDROP --- */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Warm golden Mediterranean ambient glow */}
                <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-amber-400/20 via-orange-300/10 to-transparent" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
                <div className="absolute top-36 left-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
                <div className="absolute top-36 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />

                {/* Illustrated Spanish Town Skyline Silhouettes */}
                <svg className="absolute top-0 inset-x-0 w-full h-44 opacity-25" viewBox="0 0 1200 200" preserveAspectRatio="none">
                  {/* Church bell tower in center-left */}
                  <path d="M 400,200 L 400,90 L 415,70 L 415,30 L 425,10 L 435,30 L 435,70 L 450,90 L 450,200 Z" fill="#FBBF24" />
                  {/* Cross on top of spire */}
                  <line x1="425" y1="5" x2="425" y2="15" stroke="#FBBF24" strokeWidth="2" />
                  <line x1="421" y1="8" x2="429" y2="8" stroke="#FBBF24" strokeWidth="2" />
                  {/* Cathedral dome in center-right */}
                  <path d="M 720,200 L 720,100 Q 755,40 790,100 L 790,200 Z" fill="#F59E0B" />
                  {/* Terracotta Mediterranean town roofs across the horizon */}
                  <path d="M 0,200 L 0,130 L 60,100 L 120,130 L 180,110 L 240,140 L 300,115 L 360,135 L 480,130 L 540,105 L 600,135 L 660,110 L 720,130 L 820,115 L 880,135 L 940,105 L 1000,135 L 1060,110 L 1140,135 L 1200,115 L 1200,200 Z" fill="#DEB887" />
                </svg>

                {/* Decorative Fiesta Bunting (Papel Picado strings draped across the sky) */}
                <svg className="absolute top-0 inset-x-0 w-full h-32" viewBox="0 0 1000 120" preserveAspectRatio="none">
                  {/* Top Catenary String 1 */}
                  <path d="M 0,15 Q 250,55 500,20 Q 750,55 1000,15" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                  {/* Hanging festive flags on string 1 */}
                  {[
                    { x: 50, y: 22, color: '#EF4444' },
                    { x: 120, y: 32, color: '#3B82F6' },
                    { x: 190, y: 39, color: '#10B981' },
                    { x: 260, y: 40, color: '#F59E0B' },
                    { x: 330, y: 38, color: '#8B5CF6' },
                    { x: 400, y: 30, color: '#EC4899' },
                    { x: 470, y: 22, color: '#FBBF24' },
                    { x: 540, y: 24, color: '#EF4444' },
                    { x: 610, y: 32, color: '#10B981' },
                    { x: 680, y: 39, color: '#3B82F6' },
                    { x: 750, y: 40, color: '#F59E0B' },
                    { x: 820, y: 36, color: '#EC4899' },
                    { x: 890, y: 28, color: '#8B5CF6' },
                    { x: 960, y: 19, color: '#FBBF24' }
                  ].map((flag, idx) => (
                    <polygon
                      key={idx}
                      points={`${flag.x - 12},${flag.y} ${flag.x + 12},${flag.y} ${flag.x},${flag.y + 20}`}
                      fill={flag.color}
                      opacity="0.85"
                    />
                  ))}

                  {/* Hanging Glowing Lanterns */}
                  {[100, 240, 380, 520, 660, 800, 920].map((lx, idx) => (
                    <g key={idx}>
                      <line x1={lx} y1="35" x2={lx} y2="55" stroke="#FDE68A" strokeWidth="1" />
                      <circle cx={lx} cy="62" r="7" fill="#F59E0B" opacity="0.9" />
                      <circle cx={lx} cy="62" r="14" fill="#FBBF24" opacity="0.25" className="animate-pulse" />
                    </g>
                  ))}
                </svg>

                {/* Cobblestone Plaza Floor with Mediterranean Warm Paving Pattern */}
                <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-[#EADFCF]/90 via-[#FAF7F2]/60 to-transparent">
                  <div className="w-full h-full opacity-20" style={{
                    backgroundImage: 'radial-gradient(#D97706 1px, transparent 1px), radial-gradient(#EA580C 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    backgroundPosition: '0 0, 12px 12px'
                  }} />
                </div>
              </div>

              {/* --- TOP BACKSTAGE: CARPA DE LA REAL ACADEMIA (ACADEMY EXAM STAGE - COMPACT & SLEEK) --- */}
              <div className="relative z-10 pt-4 px-3 sm:px-6 w-full max-w-5xl mx-auto">
                <div className="p-3 sm:p-4 rounded-2xl bg-white/95 border-2 border-amber-400 shadow-lg backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 via-[#EA580C] to-[#E05615] flex items-center justify-center shrink-0 shadow-md text-white">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-[#92400E] text-[10px] font-black uppercase tracking-wider border border-amber-200">
                          Real Academia Española
                        </span>
                        <span className="text-[11px] text-amber-700 font-bold hidden sm:inline">
                          • Diploma Oficial A1
                        </span>
                      </div>
                      <h2 className="text-sm sm:text-base font-black text-[#24140E] font-serif tracking-tight mt-0.5">
                        Gran Examen Oficial Acumulativo BAESP101
                      </h2>
                      <p className="text-[11px] text-[#6B584D] line-clamp-1 max-w-xl">
                        Culmina tu recorrido por las 15 ciudades. 30 preguntas de los 5 módulos del sílabo oficial.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onStartFinalAssessment}
                    className="shrink-0 inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Presentarse al Examen (30 preguntas)</span>
                  </button>
                </div>
              </div>

              {/* --- MIDDLE & LOWER ARENA: MARKET STALLS ON SIDES + CENTRAL PLAZA WITH NPCS --- */}
              <div className="relative z-10 flex-1 px-3 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                
                {/* LEFT MARKET STALLS (3 Stalls) */}
                <div className="lg:col-span-3 flex flex-col gap-2.5">
                  <div className="flex items-center mb-0.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border-2 border-amber-300 text-[#78350F] text-xs font-black uppercase tracking-wider shadow-xs backdrop-blur-sm">
                      <Store className="w-3.5 h-3.5 text-[#E05615]" />
                      <span>Puestos Tradicionales (Oeste)</span>
                    </span>
                  </div>

                  {leftStalls.map((stall) => {
                    const visited = progress.festivalVisitedStalls.includes(stall.id);
                    return (
                      <div
                        key={stall.id}
                        onClick={() => handleOpenStall(stall)}
                        className={`group relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-sm hover:scale-[1.02] active:scale-98 ${
                          visited
                            ? 'bg-emerald-50/95 border-emerald-400 hover:border-emerald-500'
                            : 'bg-white/95 border-[#E8DFD5] hover:border-amber-400 hover:bg-[#FFFDF9]'
                        }`}
                      >
                        {/* Decorative Striped Canopy Roof on top of stall card */}
                        <div 
                          className="h-2 rounded-t-lg -mx-3 -mt-3 mb-2 opacity-90"
                          style={{
                            background: `repeating-linear-gradient(90deg, ${stall.canopyColor || '#C60B1E'}, ${stall.canopyColor || '#C60B1E'} 12px, #FFF 12px, #FFF 24px)`
                          }}
                        />

                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <div className="flex items-start space-x-2 min-w-0 flex-1">
                            <span className="text-xl filter drop-shadow shrink-0 mt-0.5">{stall.icon || '🎪'}</span>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-[13px] font-black text-[#24140E] leading-snug line-clamp-2 group-hover:text-[#E05615] transition-colors">
                                {stall.title}
                              </h4>
                              <p className="text-[10px] text-[#78350F] font-bold mt-0.5 leading-tight">
                                {stall.vendorName}
                              </p>
                            </div>
                          </div>
                          {visited && (
                            <span className="shrink-0 text-[10px] text-emerald-800 font-extrabold flex items-center space-x-0.5 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hecho</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-[#6B584D] line-clamp-1 font-medium bg-amber-50/60 px-1.5 py-0.5 rounded border border-amber-100/60 mt-1">
                          {stall.specialty}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#EADFCF]">
                          <span className="text-[#B45309] font-bold flex items-center space-x-1">
                            <Coins className="w-3 h-3 text-[#E05615]" />
                            <span>+{stall.rewardCoins} monedas</span>
                          </span>
                          <span className="text-[#8B5E3C] group-hover:text-[#E05615] font-bold transition-colors">
                            Reto cultural →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CENTRAL PLAZA SQUARE (Fountain + Visible Player Avatar + 14 Stationed NPCs) */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center py-2 relative">
                  
                  {/* Plaza Focal Centerpiece: Compact Fountain + Player Avatar in one balanced row */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-3">
                    {/* Compact Fountain Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 border-2 border-sky-300/80 shadow-xs backdrop-blur-sm">
                      <span className="text-base animate-bounce">⛲</span>
                      <span className="text-[11px] font-black text-sky-950">
                        Fuente de los Viajeros
                      </span>
                    </div>

                    {/* Player Avatar in Plaza Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 border-2 border-amber-400 shadow-xs backdrop-blur-sm">
                      <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-yellow-400">
                        <PlayerAvatar character={progress.profile?.character} size={24} />
                      </div>
                      <span className="text-xs font-black text-[#24140E]">
                        ¡{playerName} en la fiesta!
                      </span>
                    </div>
                  </div>

                  {/* 14 Friends Section in Frosted Container */}
                  <div className="w-full bg-white/95 rounded-2xl border-2 border-amber-300/80 shadow-md p-3 backdrop-blur-md">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-amber-100">
                      <span className="text-xs font-black uppercase tracking-wider text-[#78350F] flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#E05615]" />
                        <span>Amigos de las 15 Ciudades (Toca para charlar)</span>
                      </span>
                      <span className="text-[10px] text-[#78350F] font-black bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        {rewardedDialoguesCount}/14 Charlados (+250 🟡 c/u)
                      </span>
                    </div>

                    {/* 14 NPC tokens distributed cleanly without truncated names */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2">
                      {FESTIVAL_CHARACTERS.map((npc) => {
                        const chatted = progress.rewardedDialogueIds.includes(npc.id);
                        const cleanName = getCleanNpcDisplayName(npc.name);
                        const cleanCity = npc.originCity === 'Santiago de Compostela' ? 'Santiago' : npc.originCity;

                        return (
                          <button
                            key={npc.id}
                            onClick={() => handleOpenNpc(npc)}
                            className={`group flex flex-col items-center p-1.5 sm:p-2 rounded-xl border-2 transition-all text-center focus:outline-none hover:scale-105 active:scale-95 shadow-xs ${
                              chatted
                                ? 'bg-emerald-50/95 border-emerald-400'
                                : 'bg-[#FFFDF9] border-[#EADFCF] hover:border-amber-400 hover:bg-white'
                            }`}
                            title={`Hablar con ${npc.name} (${npc.originCity}) - ${npc.role}`}
                          >
                            <div className="relative mb-1">
                              <div 
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl shadow-xs border-2 border-white group-hover:scale-105 transition-transform"
                                style={{ backgroundColor: npc.avatarColor || '#E11D48' }}
                              >
                                {npc.avatar}
                              </div>

                              {chatted ? (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow">
                                  ✓
                                </span>
                              ) : (
                                <span className="absolute -top-1 -right-1 px-1 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black animate-pulse shadow">
                                  💬
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-black text-[#24140E] group-hover:text-[#E05615] leading-tight text-center break-words">
                              {cleanName}
                            </span>
                            <span className="text-[9px] text-[#8B5E3C] font-bold leading-tight text-center mt-0.5 opacity-90">
                              {cleanCity}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* RIGHT MARKET STALLS (3 Stalls) */}
                <div className="lg:col-span-3 flex flex-col gap-2.5">
                  <div className="flex items-center mb-0.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border-2 border-amber-300 text-[#78350F] text-xs font-black uppercase tracking-wider shadow-xs backdrop-blur-sm">
                      <Store className="w-3.5 h-3.5 text-[#E05615]" />
                      <span>Puestos Tradicionales (Este)</span>
                    </span>
                  </div>

                  {rightStalls.map((stall) => {
                    const visited = progress.festivalVisitedStalls.includes(stall.id);
                    return (
                      <div
                        key={stall.id}
                        onClick={() => handleOpenStall(stall)}
                        className={`group relative p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-sm hover:scale-[1.02] active:scale-98 ${
                          visited
                            ? 'bg-emerald-50/95 border-emerald-400 hover:border-emerald-500'
                            : 'bg-white/95 border-[#E8DFD5] hover:border-amber-400 hover:bg-[#FFFDF9]'
                        }`}
                      >
                        {/* Decorative Striped Canopy Roof on top of stall card */}
                        <div 
                          className="h-2 rounded-t-lg -mx-3 -mt-3 mb-2 opacity-90"
                          style={{
                            background: `repeating-linear-gradient(90deg, ${stall.canopyColor || '#2A9D8F'}, ${stall.canopyColor || '#2A9D8F'} 12px, #FFF 12px, #FFF 24px)`
                          }}
                        />

                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <div className="flex items-start space-x-2 min-w-0 flex-1">
                            <span className="text-xl filter drop-shadow shrink-0 mt-0.5">{stall.icon || '🎪'}</span>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-[13px] font-black text-[#24140E] leading-snug line-clamp-2 group-hover:text-[#E05615] transition-colors">
                                {stall.title}
                              </h4>
                              <p className="text-[10px] text-[#78350F] font-bold mt-0.5 leading-tight">
                                {stall.vendorName}
                              </p>
                            </div>
                          </div>
                          {visited && (
                            <span className="shrink-0 text-[10px] text-emerald-800 font-extrabold flex items-center space-x-0.5 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hecho</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-[#6B584D] line-clamp-1 font-medium bg-amber-50/60 px-1.5 py-0.5 rounded border border-amber-100/60 mt-1">
                          {stall.specialty}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#EADFCF]">
                          <span className="text-[#B45309] font-bold flex items-center space-x-1">
                            <Coins className="w-3 h-3 text-[#E05615]" />
                            <span>+{stall.rewardCoins} monedas</span>
                          </span>
                          <span className="text-[#8B5E3C] group-hover:text-[#E05615] font-bold transition-colors">
                            Reto cultural →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Plaza Promenade Footnote */}
              <div className="relative z-10 px-4 py-2 border-t border-[#EADFCF] bg-white/95 backdrop-blur-sm text-center text-[11px] text-[#6B584D]">
                <span>🌟 Explora los puestos de ambos lados de la plaza, conversa con cada amigo para ganar monedas y pulsa en la Carpa para el Examen Oficial.</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. VIEW 2: ACCESSIBLE DETAILED DIRECTORY LIST
          ======================================================== */}
      {viewMode === 'list' && (
        <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
          
          {/* Academy Stage Card (Prestigious Pavilion) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#FFF8EE] via-[#FFF3E8] to-[#FFE8D6] border-2 border-amber-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-1.5">
              <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-[#B45309] font-black text-xs uppercase tracking-wider border border-amber-300/80">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Examen Oficial Acumulativo</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#24140E] font-serif">
                Real Academia Española • Nivel A1
              </h2>
              <p className="text-xs sm:text-sm text-[#6B584D] max-w-2xl font-medium">
                30 preguntas que cubren los 5 módulos del sílabo oficial BAESP101. Genera Diploma Oficial acreditado.
              </p>
            </div>
            <button
              onClick={onStartFinalAssessment}
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-sm shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Comenzar Examen Oficial</span>
            </button>
          </div>

          {/* Stalls Grid */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-black text-[#24140E] font-serif flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFF3E8] border border-[#FAD9C0] flex items-center justify-center text-lg">
                🎪
              </div>
              <span>Puestos y Pabellones de la Feria (6 en total)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FESTIVAL_STALLS.map((stall) => {
                const visited = progress.festivalVisitedStalls.includes(stall.id);
                return (
                  <div
                    key={stall.id}
                    onClick={() => handleOpenStall(stall)}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between group shadow-sm hover:shadow-md ${
                      visited
                        ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-400'
                        : 'bg-white hover:bg-[#FFFDFB] border-[#E8DFD5] hover:border-amber-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#FFF6EE] border border-[#FAD9C0] flex items-center justify-center text-2xl">
                          {stall.icon || '🎪'}
                        </div>
                        {visited ? (
                          <span className="px-2.5 py-1 rounded-full text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 font-extrabold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completado</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-[#B45309] border border-amber-300">
                            +{stall.rewardCoins} 🪙
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-[#24140E] font-serif group-hover:text-[#E05615] transition-colors">
                        {stall.title}
                      </h4>
                      <p className="text-xs text-[#6B584D] mt-1.5 line-clamp-2 leading-relaxed">
                        {stall.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F2ECE1] text-xs font-bold text-[#E05615] flex items-center justify-between">
                      <span className="text-[#8C7A6B]">{stall.vendorName}</span>
                      <span className="flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                        <span>Probar reto</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Characters Grid */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-black text-[#24140E] font-serif flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFE8ED] border border-[#FFCCD5] flex items-center justify-center text-lg">
                👥
              </div>
              <span>Personajes de las 15 Ciudades (14 amigos)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FESTIVAL_CHARACTERS.map((char) => {
                const chatted = progress.rewardedDialogueIds.includes(char.id);
                return (
                  <div
                    key={char.id}
                    onClick={() => handleOpenNpc(char)}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between group shadow-sm hover:shadow-md ${
                      chatted
                        ? 'bg-emerald-50/20 border-emerald-300 hover:border-emerald-400'
                        : 'bg-white hover:bg-[#FFFDFB] border-[#E8DFD5] hover:border-rose-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-3 mb-2.5">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-white shrink-0"
                          style={{ backgroundColor: char.avatarColor || '#E11D48' }}
                        >
                          {char.avatar}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-black text-[#24140E] font-serif group-hover:text-[#E11D48] transition-colors truncate">
                            {char.name}
                          </h4>
                          <p className="text-xs text-[#B45309] font-bold truncate">
                            {char.originCity} • {char.role}
                          </p>
                        </div>
                      </div>
                      <p className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE5D9] text-xs text-[#524136] italic line-clamp-2 leading-relaxed">
                        "{char.dialogue}"
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F2ECE1] flex items-center justify-between text-xs">
                      <span className="text-[#8C7A6B]">Sabiduría de {char.originCity}</span>
                      {chatted ? (
                        <span className="text-emerald-700 font-extrabold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Charlado</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-[#B45309] border border-amber-200 font-black transition-colors">
                          Charlar (+250 🪙) →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          4. INTERACTIVE NPC DIALOGUE MODAL
          ======================================================== */}
      {activeNpc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-[#24140E]">
            
            {/* Header: NPC Profile */}
            <div className="flex items-start justify-between border-b border-[#EADFCF] pb-3">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-2 border-white shrink-0"
                  style={{ backgroundColor: activeNpc.avatarColor || '#E11D48' }}
                >
                  {activeNpc.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-[#24140E] font-serif">{activeNpc.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[#B45309] text-[10px] font-black border border-amber-300">
                      {activeNpc.originCity}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#7A6B60]">{activeNpc.role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveNpc(null)}
                  className="p-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] border border-[#E0D5C7] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Speech Bubble: Spanish Dialogue */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#EADFCF] text-[#24140E] text-sm font-semibold leading-relaxed relative shadow-xs">
              <div className="absolute -top-2.5 left-6 px-2 py-0.5 bg-[#FAF7F2] text-[10px] font-black text-[#B45309] uppercase tracking-wider rounded-full border border-amber-200">
                Saludo en Español
              </div>
              "{activeNpc.dialogue}"
            </div>

            {/* English translation toggle */}
            <div>
              <button
                onClick={() => setShowEnglishTranslation(!showEnglishTranslation)}
                className="text-xs font-bold text-[#E05615] hover:text-[#B45309] transition-colors flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showEnglishTranslation ? 'Ocultar traducción al inglés' : 'Ver traducción al inglés'}</span>
              </button>
              {showEnglishTranslation && (
                <div className="mt-2 p-3.5 rounded-2xl bg-white border border-[#EADFCF] text-xs text-[#6B584D] italic animate-fadeIn">
                  "{activeNpc.englishDialogue}"
                </div>
              )}
            </div>

            {/* Cultural Wisdom / Trivia */}
            <div className="p-4 rounded-2xl bg-[#FFF8EE] border border-amber-300 text-xs text-[#7A4B10] leading-relaxed">
              <span className="font-black text-[#B45309] block mb-1">
                💡 Sabiduría de {activeNpc.originCity}:
              </span>
              <p>{activeNpc.trivia}</p>
            </div>

            {/* Interactive Conversational Question */}
            {activeNpc.interactiveQuestion && (
              <div className="p-5 rounded-2xl bg-white border-2 border-[#E8DFD5] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#E05615] flex items-center space-x-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Pregunta de Conversación</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#B45309] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    +250 monedas 🪙
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-[#24140E]">
                  {activeNpc.interactiveQuestion.prompt}
                </p>

                {/* 3 Selectable Answers */}
                <div className="space-y-2">
                  {activeNpc.interactiveQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      disabled={npcQuizFeedback.show && npcQuizFeedback.isCorrect}
                      onClick={() => handleAnswerNpcQuiz(option)}
                      className={`w-full p-3 rounded-xl border-2 text-left text-xs sm:text-sm font-bold transition-all ${
                        npcQuizAnswer === option
                          ? npcQuizFeedback.isCorrect
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black'
                            : 'bg-rose-50 border-rose-500 text-rose-950 font-black'
                          : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] border-[#E0D5C7] text-[#24140E] hover:border-amber-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {/* Question Feedback */}
                {npcQuizFeedback.show && (
                  <div className={`p-3.5 rounded-2xl border text-xs animate-fadeIn ${
                    npcQuizFeedback.isCorrect
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}>
                    <p className="font-black text-sm">
                      {npcQuizFeedback.isCorrect 
                        ? activeNpc.interactiveQuestion.reactionCorrect 
                        : activeNpc.interactiveQuestion.reactionIncorrect}
                    </p>
                    <p className="mt-1 text-[#4A3B32]">{activeNpc.interactiveQuestion.explanation}</p>
                    {npcQuizFeedback.isCorrect && (
                      <p className="mt-1 font-bold text-[#B45309]">
                        ⭐ ¡Has ganado +250 monedas por conversar con {activeNpc.name}!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-[#EADFCF]">
              <button
                onClick={() => setActiveNpc(null)}
                className="px-6 py-2.5 rounded-full bg-[#E05615] hover:bg-[#C2410C] text-white font-black text-xs shadow transition-all"
              >
                ¡Hasta luego, {activeNpc.name}!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          5. INTERACTIVE MARKET STALL QUIZ MODAL
          ======================================================== */}
      {activeStall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#FAF7F2] border-2 border-[#EADFCF] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-[#24140E]">
            
            {/* Header: Stall title & canopy stripe */}
            <div>
              <div 
                className="h-2.5 rounded-t-xl -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 mb-4 opacity-90"
                style={{
                  background: `repeating-linear-gradient(90deg, ${activeStall.canopyColor || '#C60B1E'}, ${activeStall.canopyColor || '#C60B1E'} 16px, #FFF 16px, #FFF 32px)`
                }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{activeStall.icon || '🎪'}</span>
                    <span className="text-xs font-black text-[#B45309] uppercase tracking-wider">
                      {activeStall.spanishTitle}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#24140E] font-serif">{activeStall.title}</h3>
                  <p className="text-xs font-semibold text-[#7A6B60]">{activeStall.vendorName}</p>
                </div>
                <button
                  onClick={() => setActiveStall(null)}
                  className="p-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] border border-[#E0D5C7]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Specialty & prompt */}
            <div className="p-4 rounded-2xl bg-[#FFF8EE] border border-amber-300 text-xs text-[#7A4B10]">
              <span className="font-black text-[#B45309] block mb-1">Especialidad del puesto:</span>
              <p>{activeStall.specialty}</p>
            </div>

            {/* Mini Quiz Area */}
            <div className="p-5 rounded-2xl bg-white border-2 border-[#E8DFD5] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#E05615]">
                  Reto del Puesto
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-[#24140E]">
                {activeStall.miniQuiz.prompt}
              </p>

              {activeStall.miniQuiz.options ? (
                <div className="space-y-2">
                  {activeStall.miniQuiz.options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={stallFeedback.show && stallFeedback.isCorrect}
                      onClick={() => setStallAnswer(opt)}
                      className={`w-full p-3 rounded-xl border-2 text-left text-xs sm:text-sm font-bold transition-all ${
                        stallAnswer === opt
                          ? 'bg-amber-100/60 border-amber-500 text-[#24140E] font-black'
                          : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] border-[#E0D5C7] text-[#24140E]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  disabled={stallFeedback.show && stallFeedback.isCorrect}
                  value={stallAnswer}
                  onChange={e => setStallAnswer(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#E0D5C7] text-[#24140E] text-sm focus:outline-none focus:border-[#E05615] font-medium"
                />
              )}

              {stallFeedback.show && (
                <div className={`p-3.5 rounded-2xl border text-xs animate-fadeIn ${
                  stallFeedback.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <p className="font-black text-sm">
                    {stallFeedback.isCorrect 
                      ? `¡Excelente! Has ganado +${activeStall.rewardCoins} monedas y la insignia "${activeStall.rewardBadge}".` 
                      : 'Incorrecto. Vuelve a intentarlo.'}
                  </p>
                  <p className="mt-1 text-[#4A3B32]">{activeStall.miniQuiz.explanation}</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#EADFCF]">
              <button
                onClick={handleCheckStallQuiz}
                className="px-6 py-2.5 rounded-full bg-[#F3B33D] hover:bg-[#F5BA31] text-[#24140E] font-black text-xs shadow transition-all"
              >
                Comprobar Respuesta
              </button>
              {stallFeedback.isCorrect && (
                <button
                  onClick={() => setActiveStall(null)}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition-all"
                >
                  Continuar
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
