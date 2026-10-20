import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { FESTIVAL_STALLS, FESTIVAL_CHARACTERS } from '../data/festivalData';
import { FestivalStall, FestivalCharacter } from '../types';
import { shuffleArray } from '../utils/shuffle';
import { PlayerAvatar } from './PlayerAvatar';
import confetti from 'canvas-confetti';
import { speakSpanish } from '../services/spanishSpeechService';
import { Adventure3DScene, AdventureStation3D } from './Adventure3DScene';
import { FestivalFortuneWheel } from './FestivalFortuneWheel';
import { TomatinaGameModal } from './TomatinaGameModal';
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
  Gamepad2,
  Moon,
  Sun,
  Sunset,
  Music,
  Volume2,
  Utensils,
  BookOpen,
  Trophy
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

// Interactive Spanish Tapas Bar data
export interface PlazaTapa {
  id: string;
  name: string;
  emoji: string;
  region: string;
  description: string;
  pronunciation: string;
  trivia: string;
}

export const PLAZA_TAPAS: PlazaTapa[] = [
  {
    id: 'tapa-paella',
    name: 'Paella Valenciana',
    emoji: '🥘',
    region: 'Valencia',
    description: 'Arroz bomba cocinado a fuego lento con azafrán, judías verdes (bajoqueta), garrofó y romero silvestre.',
    pronunciation: 'pah-EH-yah bah-len-THYAH-nah',
    trivia: 'En Valencia, la paella auténtica se cocina en caldero plano al aire libre sobre leña de naranjo.'
  },
  {
    id: 'tapa-tortilla',
    name: 'Tortilla de Patatas',
    emoji: '🥔',
    region: 'Toda España',
    description: 'La mítica tortilla española elaborada con patatas pochadas en aceite de oliva, huevos camperos y punto jugoso.',
    pronunciation: 'tohr-TEE-yah deh pah-TAH-tahs',
    trivia: 'El gran debate nacional en España es con o sin cebolla (¡la mayoría de los maestros cocineros la prefiere con cebolla!).'
  },
  {
    id: 'tapa-jamon',
    name: 'Jamón Ibérico de Bellota',
    emoji: '🥓',
    region: 'Andalucía y Extremadura',
    description: 'Finas lonchas de jamón de cerdo ibérico alimentado con bellotas en dehesas centenarias de encinas.',
    pronunciation: 'hah-MOHN ee-BEH-ree-koh',
    trivia: 'El corte del jamón a cuchillo es considerado un arte secular en los mesones y bodegas españolas.'
  },
  {
    id: 'tapa-calamares',
    name: 'Bocadillo de Calamares',
    emoji: '🥖',
    region: 'Madrid (Plaza Mayor)',
    description: 'Pan crujiente recién horneado relleno de calamares fritos a la andaluza con limón fresco o alioli casero.',
    pronunciation: 'boh-kah-DEE-yoh deh kah-lah-MAH-rehs',
    trivia: 'En los soportales de la Plaza Mayor de Madrid se consumen miles de estos bocadillos cada fin de semana.'
  },
  {
    id: 'tapa-churros',
    name: 'Chocolate con Churros',
    emoji: '☕',
    region: 'Madrid y Castilla',
    description: 'Churros y porras dorados y crujientes servidos con chocolate caliente, negro y bien espeso.',
    pronunciation: 'choh-koh-LAH-teh kohn CHOO-rrohs',
    trivia: 'La Chocolatería San Ginés de Madrid lleva sirviendo churros ininterrumpidamente desde 1894.'
  },
  {
    id: 'tapa-pulpo',
    name: 'Pulpo a la Feira',
    emoji: '🐙',
    region: 'Galicia (Santiago)',
    description: 'Rodajas de pulpo tierno sobre patatas cocidas (cachelos), con sal gorda, aceite de oliva virgen y pimentón de la Vera.',
    pronunciation: 'POOL-poh ah lah FEH-ee-rah',
    trivia: 'Se sirve tradicionalmente sobre un plato redondo de madera de pino para absorber el exceso de agua.'
  }
];

// Refranes and wisdom for the Wishing Fountain
export interface FountainFortune {
  saying: string;
  author: string;
  meaning: string;
}

export const FOUNTAIN_FORTUNES: FountainFortune[] = [
  {
    saying: 'Caminante, no hay camino, se hace camino al andar.',
    author: 'Antonio Machado',
    meaning: 'Cada paso que das en español va creando tu propio sendero de maestría y libertad.'
  },
  {
    saying: 'Quien lee mucho y anda mucho, ve mucho y sabe mucho.',
    author: 'Miguel de Cervantes (Don Quijote)',
    meaning: 'Viajar por las 15 ciudades de España expande tu mente más que cualquier libro.'
  },
  {
    saying: 'El que la sigue, la consigue.',
    author: 'Refrán popular español',
    meaning: 'La constancia vence todas las dificultades: ¡tu fluidez en español es imparable!'
  },
  {
    saying: 'A buen entendedor, pocas palabras bastan.',
    author: 'Refrán tradicional',
    meaning: 'Tu oído ya capta la esencia del español natural que se habla en las plazas.'
  },
  {
    saying: 'El saber no ocupa lugar.',
    author: 'Sabiduría popular',
    meaning: 'Cada nueva palabra y giro coloquial que aprendes enriquece tu vida para siempre.'
  },
  {
    saying: 'No hay mal que por bien no venga.',
    author: 'Refrán popular',
    meaning: 'De cada pequeño tropiezo o fallo gramatical nace una comprensión mucho más profunda.'
  },
  {
    saying: 'Año nuevo, vida nueva y más caminos por recorrer.',
    author: 'Dicho castellano',
    meaning: '¡El final de tu viaje en La Gran Fiesta es solo el principio de tu aventura con el mundo hispanohablante!'
  }
];

// Live ambient banter of NPCs gathered in the square
export const PLAZA_CHATTER = [
  { npc: 'Elena', city: 'Madrid', text: '¡Qué emoción verte en la Plaza Mayor! ¡Prueba el bocadillo de calamares!' },
  { npc: 'Don Alonso', city: 'Toledo', text: '¡El temple de tu español es tan noble como el acero toledano!' },
  { npc: 'Doña Carmen', city: 'Sevilla', text: '¡Olé con olé! ¡Marca el compás en el tablao flamenco!' },
  { npc: 'Lucía', city: 'Salamanca', text: '¡La plaza está llena de historia viva y buena conversación!' },
  { npc: 'Mateo', city: 'Valencia', text: '¡El azafrán de la paella gigante inunda toda la plaza!' },
  { npc: 'Marc', city: 'Barcelona', text: '¡Bajo estos arcos se respira el arte y el diseño de España!' },
  { npc: 'Maite', city: 'Bilbao', text: '¡Aupa viajero! ¡Un brindis con txakoli por las 15 ciudades!' },
  { npc: 'Xoán', city: 'Santiago', text: '¡El esfuerzo del caminante culmina hoy con alegría compartida!' }
];

// Authentic Spanish festival announcements
const FESTIVAL_NEWS = [
  '🥘 ¡La gran paella gigante de Valencia está servida en el puesto gastronómico!',
  '🎡 ¡Gira la Ruleta de la Feria para ganar hasta 500 monedas de oro y vidas extra!',
  '🍅 ¡La batalla de la Tomatina de Buñol está abierta en la plaza! ¡Lanza tomates y bate el récord!',
  '💃 ¡Doña Carmen de Triana y los bailaores encienden el tablao flamenco con sevillanas!',
  '⛲ ¡Tira una moneda a la Fuente de los Deseos para recibir la sabiduría de Cervantes!',
  '🥘 ¡Descubre las 6 tapas tradicionales en la Mesa de Degustación!',
  '🎆 ¡Toca en cualquier parte del cielo para lanzar fuegos artificiales!',
  '🎓 ¡Preséntate en la Carpa de la Real Academia para el Diploma Oficial A1!'
];

// Web Audio API synthesizer for interactive flamenco rhythms
const playFiestaSound = (type: 'guitar' | 'palmas' | 'castanets' | 'ole' | 'splash') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'guitar') {
      // Spanish acoustic chord strum (A minor: 110Hz, 164.81Hz, 220Hz, 261.63Hz, 329.63Hz)
      const freqs = [110, 164.81, 220, 261.63, 329.63];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.035);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.035 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.035);
        osc.stop(ctx.currentTime + idx * 0.035 + 1.2);
      });
    } else if (type === 'palmas') {
      // Flamenco handclap noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.08);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (type === 'castanets') {
      // Rapid castanet clack roll
      [0, 0.06, 0.12, 0.18].forEach((timeOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1400, ctx.currentTime + timeOffset);
        gain.gain.setValueAtTime(0.16, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.04);
      });
    } else if (type === 'ole') {
      // Fanfare cheer chord
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.14, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.5);
      });
    } else if (type === 'splash') {
      // Water ripple splash for fountain
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Safe audio fallback
  }
};

// Confetti & sky fireworks launcher
const launchFireworks = (style: 'rojigualda' | 'traca' | 'estrellas' | 'tap', xPercent = 0.5, yPercent = 0.4) => {
  try {
    if (style === 'rojigualda') {
      // Spanish red & gold dual barrage
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { x: 0.35, y: 0.4 },
        colors: ['#C60B1E', '#FFC400', '#C60B1E']
      });
      setTimeout(() => {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { x: 0.65, y: 0.4 },
          colors: ['#FFC400', '#C60B1E', '#FFC400']
        });
      }, 250);
    } else if (style === 'traca') {
      // 5 rapid sequential bangs across the screen
      [0.2, 0.35, 0.5, 0.65, 0.8].forEach((x, idx) => {
        setTimeout(() => {
          confetti({
            particleCount: 45,
            spread: 65,
            origin: { x, y: 0.3 + (idx % 2) * 0.15 },
            colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899']
          });
        }, idx * 180);
      });
    } else if (style === 'estrellas') {
      // Cascading golden glitter
      confetti({
        particleCount: 95,
        spread: 120,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#FDE68A', '#F59E0B', '#D97706', '#FEF3C7'],
        scalar: 1.2
      });
    } else {
      // Tap on sky
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { x: xPercent, y: yPercent },
        colors: ['#F59E0B', '#E11D48', '#0284C7', '#10B981', '#FBBF24']
      });
    }
  } catch {
    // Safe fallback
  }
};

export const FestivalWorld: React.FC<FestivalWorldProps> = ({
  onBackToMap,
  onStartFinalAssessment
}) => {
  const { progress, visitFestivalStall, recordDialogueCompleted, awardCoins } = useGame();

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

  // Memoized shuffled options for NPC dialog quiz
  const shuffledNpcOptions = useMemo(() => {
    return activeNpc?.interactiveQuestion?.options
      ? shuffleArray(activeNpc.interactiveQuestion.options)
      : [];
  }, [activeNpc?.id, activeNpc?.interactiveQuestion?.options]);

  // Memoized shuffled options for Stall mini quiz
  const shuffledStallOptions = useMemo(() => {
    return activeStall?.miniQuiz?.options
      ? shuffleArray(activeStall.miniQuiz.options)
      : [];
  }, [activeStall?.id, activeStall?.miniQuiz?.options]);

  // Atmosphere Mode: 'dia' | 'atardecer' | 'noche'
  const [atmosphere, setAtmosphere] = useState<'dia' | 'atardecer' | 'noche'>('dia');
  const isNightMode = atmosphere === 'noche';
  const isSunset = atmosphere === 'atardecer';

  // Wishing Fountain Interactive State
  const [showFountainModal, setShowFountainModal] = useState<boolean>(false);
  const [fountainFortune, setFountainFortune] = useState<FountainFortune | null>(null);
  const [wishesCount, setWishesCount] = useState<number>(0);
  const [justMadeWish, setJustMadeWish] = useState<boolean>(false);

  // Tapas Tasting Table Interactive State
  const [showTapasModal, setShowTapasModal] = useState<boolean>(false);
  const [selectedTapa, setSelectedTapa] = useState<PlazaTapa>(PLAZA_TAPAS[0]);
  const [tastedTapas, setTastedTapas] = useState<string[]>(['tapa-paella', 'tapa-tortilla']);

  // Festival Passport / Milestones Modal State
  const [showPassportModal, setShowPassportModal] = useState<boolean>(false);

  // Flamenco Rhythm & Fiesta Meter State
  const [fiestaMeter, setFiestaMeter] = useState<number>(45);
  const [flamencoCombos, setFlamencoCombos] = useState<number>(0);
  const [totalFiestasTriggered, setTotalFiestasTriggered] = useState<number>(0);
  const [floatingNotes, setFloatingNotes] = useState<{ id: number; symbol: string; x: number }[]>([]);

  // Rotating live plaza chatter
  const [chatterIndex, setChatterIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setChatterIndex(prev => (prev + 1) % PLAZA_CHATTER.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fun festival features state
  const [showWheel, setShowWheel] = useState<boolean>(false);
  const [showTomatina, setShowTomatina] = useState<boolean>(false);
  const [tickerIndex, setTickerIndex] = useState<number>(0);
  const [activeFlamencoBeat, setActiveFlamencoBeat] = useState<string | null>(null);

  // Rotating news ticker
  useEffect(() => {
    const t = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % FESTIVAL_NEWS.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  // Fountain wish handler
  const handleMakeFountainWish = () => {
    setJustMadeWish(true);
    playFiestaSound('splash');
    launchFireworks('estrellas', 0.5, 0.4);
    awardCoins(100);
    setWishesCount(prev => prev + 1);
    const randomFortune = FOUNTAIN_FORTUNES[Math.floor(Math.random() * FOUNTAIN_FORTUNES.length)];
    setFountainFortune(randomFortune);
  };

  // Tapas tasting handler
  const handleTasteTapa = (tapa: PlazaTapa) => {
    setSelectedTapa(tapa);
    speakSpanish(tapa.name);
    if (!tastedTapas.includes(tapa.id)) {
      setTastedTapas(prev => [...prev, tapa.id]);
      awardCoins(25);
      launchFireworks('tap', 0.5, 0.5);
    }
  };

  // Flamenco beat handler with Fiesta Meter advancement
  const handleFlamencoBeatTap = (type: 'guitar' | 'palmas' | 'castanets' | 'ole') => {
    playFiestaSound(type);
    setActiveFlamencoBeat(type);
    setTimeout(() => setActiveFlamencoBeat(null), 300);

    // Spawn floating musical note
    const symbols = ['🎵', '🎶', '🎸', '💃', '👏', '✨'];
    const newNote = {
      id: Date.now() + Math.random(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      x: 20 + Math.random() * 60
    };
    setFloatingNotes(prev => [...prev.slice(-5), newNote]);
    setTimeout(() => {
      setFloatingNotes(prev => prev.filter(n => n.id !== newNote.id));
    }, 1200);

    setFlamencoCombos(prev => prev + 1);
    setFiestaMeter(prev => {
      const next = Math.min(100, prev + 15);
      if (next >= 100 && prev < 100) {
        setTotalFiestasTriggered(t => t + 1);
        awardCoins(100);
        launchFireworks('traca', 0.5, 0.35);
      }
      return next;
    });
  };

  // View mode: 'plaza' (illustrated 2.5D square - default) | '3d' | 'list'
  const [viewMode, setViewMode] = useState<'3d' | 'plaza' | 'list'>('plaza');

  // Coordinates for the 6 stalls and 14 characters in 3D
  const stallCoords: Record<string, { x: number; z: number }> = useMemo(() => ({
    'stall-tapas': { x: -14, z: 8 },
    'stall-flamenco': { x: -14, z: 0 },
    'stall-libreria': { x: -14, z: -8 },
    'stall-relojero': { x: 14, z: 8 },
    'stall-estacion': { x: 14, z: 0 },
    'stall-capitania': { x: 14, z: -8 },
  }), []);

  const stallColors: Record<string, number> = useMemo(() => ({
    'stall-tapas': 0xc60b1e,
    'stall-flamenco': 0xe07a5f,
    'stall-libreria': 0x1d3557,
    'stall-relojero': 0x2a9d8f,
    'stall-estacion': 0xf59e0b,
    'stall-capitania': 0x0284c7,
  }), []);

  // Open NPC dialogue
  const handleOpenNpc = useCallback((npc: FestivalCharacter) => {
    setActiveNpc(npc);
    setNpcQuizAnswer(null);
    setNpcQuizFeedback({ isCorrect: false, show: false });
    setShowEnglishTranslation(false);
  }, []);

  // Open Market Stall mini-quiz
  const handleOpenStall = useCallback((stall: FestivalStall) => {
    setActiveStall(stall);
    setStallAnswer('');
    setStallFeedback({ isCorrect: false, show: false });
  }, []);

  const festival3DStations: AdventureStation3D[] = useMemo(() => [
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
  ], [progress.festivalVisitedStalls, progress.rewardedDialogueIds, stallCoords, stallColors, handleOpenStall, handleOpenNpc]);

  const examStationData = useMemo(() => ({
    label: 'Carpa Real Academia Española',
    bossName: 'Examen Oficial Acumulativo BAESP101',
    isPassed: Boolean(progress.finalAssessmentCompleted),
    allLevelsDone: true,
    onInteract: () => onStartFinalAssessment()
  }), [progress.finalAssessmentCompleted, onStartFinalAssessment]);

  const playerName = (progress.profile?.displayName && progress.profile.displayName !== 'Viajero' && progress.profile.displayName !== 'years')
    ? progress.profile.displayName
    : (progress.profile?.character?.name && progress.profile.character.name !== 'Alex' && progress.profile.character.name !== 'Viajero' && progress.profile.character.name !== 'years')
    ? progress.profile.character.name
    : progress.profile?.displayName || 'Aventurero';
  const leftStalls = FESTIVAL_STALLS.filter(s => s.side === 'left');
  const rightStalls = FESTIVAL_STALLS.filter(s => s.side === 'right');
  const visitedStallsCount = progress.festivalVisitedStalls.length;
  const rewardedDialoguesCount = progress.rewardedDialogueIds.length;

  const passportMilestones = useMemo(() => [
    { id: 'stalls', title: '6 Puestos Tradicionales', desc: 'Aprende los secretos de cada tenderete', done: visitedStallsCount >= 6, progress: `${visitedStallsCount}/6` },
    { id: 'friends', title: '14 Amigos de España', desc: 'Conversa con los viajeros de las 15 ciudades', done: rewardedDialoguesCount >= 14, progress: `${rewardedDialoguesCount}/14` },
    { id: 'fountain', title: 'Deseo en la Fuente', desc: 'Lanza una moneda y recibe un refrán', done: wishesCount > 0, progress: wishesCount > 0 ? 'Concedido' : '0/1' },
    { id: 'tapas', title: '6 Tapas Degustadas', desc: 'Saborea la gastronomía típica española', done: tastedTapas.length >= 6, progress: `${tastedTapas.length}/6` },
    { id: 'tablao', title: 'Fiesta Flamenca (100%)', desc: 'Toca el compás y llena el medidor', done: fiestaMeter >= 100 || totalFiestasTriggered > 0, progress: `${fiestaMeter}%` },
    { id: 'wheel', title: 'Ruleta de la Feria', desc: 'Gira la ruleta y gana premios', done: Boolean(progress.festivalVisitedStalls.length > 0 || wishesCount > 0), progress: 'Girada' },
    { id: 'tomatina', title: 'Batalla de la Tomatina', desc: 'Lanza tomates en la gran fiesta de Buñol', done: true, progress: 'Disponible' },
    { id: 'exam', title: 'Examen Oficial A1', desc: 'Supera las 30 preguntas de la Real Academia', done: Boolean(progress.finalAssessmentCompleted), progress: progress.finalAssessmentCompleted ? 'Aprobado' : 'Pendiente' }
  ], [visitedStallsCount, rewardedDialoguesCount, wishesCount, tastedTapas.length, fiestaMeter, totalFiestasTriggered, progress.festivalVisitedStalls.length, progress.finalAssessmentCompleted]);

  const completedMilestonesCount = passportMilestones.filter(m => m.done).length;
  const activeChatter = PLAZA_CHATTER[chatterIndex] || PLAZA_CHATTER[0];

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
            
            {/* 3-Mode Atmosphere Selector (Día / Atardecer / Noche) */}
            <div className="flex bg-[#EFE7DC] p-1 rounded-full border border-[#E0D5C7] text-xs font-bold" title="Cambiar la iluminación y atmósfera de la Plaza Mayor">
              <button
                onClick={() => setAtmosphere('dia')}
                className={`px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer ${
                  atmosphere === 'dia' ? 'bg-white text-amber-700 font-black shadow-xs' : 'text-[#7A6B60] hover:text-[#24140E]'
                }`}
                title="Día Soleado"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Día</span>
              </button>
              <button
                onClick={() => setAtmosphere('atardecer')}
                className={`px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer ${
                  atmosphere === 'atardecer' ? 'bg-orange-500 text-white font-black shadow-xs' : 'text-[#7A6B60] hover:text-[#24140E]'
                }`}
                title="Atardecer Dorado"
              >
                <Sunset className="w-3.5 h-3.5 text-amber-200" />
                <span className="hidden md:inline">Tarde</span>
              </button>
              <button
                onClick={() => setAtmosphere('noche')}
                className={`px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer ${
                  atmosphere === 'noche' ? 'bg-slate-900 text-amber-300 font-black shadow-xs' : 'text-[#7A6B60] hover:text-[#24140E]'
                }`}
                title="Noche de Farolillos"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Noche</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center space-x-2 text-xs font-bold px-3 py-1.5 bg-white rounded-full border border-[#E8DFD5] text-[#524136] shadow-xs">
              <span className="text-[#B45309]">🎪 {visitedStallsCount}/6 Puestos</span>
              <span>•</span>
              <span className="text-[#BE185D]">💬 {rewardedDialoguesCount}/14 Amigos</span>
              <span>•</span>
              <span className="text-emerald-700">📜 {completedMilestonesCount}/8 Sellos</span>
            </div>

            <div className="flex bg-[#EFE7DC] p-1 rounded-full border border-[#E0D5C7] text-xs font-bold">
              <button
                onClick={() => setViewMode('plaza')}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === 'plaza'
                    ? 'bg-white text-[#24140E] font-black shadow-xs'
                    : 'text-[#7A6B60] hover:text-[#24140E]'
                }`}
              >
                🎪 Plaza Mayor
              </button>
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

      {/* Fiesta Live Announcements & Activity Ticker */}
      <div className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-3 transition-colors ${
        isNightMode 
          ? 'bg-slate-900/95 border-amber-500/30 text-amber-200' 
          : isSunset
          ? 'bg-gradient-to-r from-orange-950/90 via-amber-950/90 to-rose-950/90 border-orange-500/40 text-amber-100'
          : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200/80 text-[#78350F]'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 truncate">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shrink-0 animate-pulse">
              FIESTA EN VIVO
            </span>
            <span className="font-bold truncate text-[11px] sm:text-xs">
              {FESTIVAL_NEWS[tickerIndex]}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <button
              onClick={() => setShowFountainModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-black text-[11px] shadow-xs transition-transform hover:scale-105 cursor-pointer"
              title="Tirar una moneda a la Fuente de los Deseos"
            >
              <span>⛲ Deseos</span>
            </button>
            <button
              onClick={() => setShowTapasModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-black text-[11px] shadow-xs transition-transform hover:scale-105 cursor-pointer"
              title="Degustar las 6 tapas tradicionales españolas"
            >
              <span>🥘 Tapas</span>
            </button>
            <button
              onClick={() => setShowPassportModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs transition-transform hover:scale-105 cursor-pointer"
              title="Abrir el Pasaporte de la Plaza Mayor"
            >
              <span>📜 Pasaporte</span>
            </button>
            <button
              onClick={() => setShowWheel(true)}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-xs transition-transform hover:scale-105 cursor-pointer"
            >
              <span>🎡 Ruleta</span>
            </button>
            <button
              onClick={() => setShowTomatina(true)}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-[11px] shadow-xs transition-transform hover:scale-105 cursor-pointer"
            >
              <span>🍅 Tomatina</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. VIEW 0: PLAYABLE 3D FESTIVAL PLAZA
          ======================================================== */}
      {viewMode === '3d' && (
        <div className="p-2 sm:p-4 max-w-7xl mx-auto w-full">
          <Adventure3DScene
            cityName="Sevilla"
            cityNumber={4}
            totalCities={16}
            regionName="La Gran Fiesta"
            accentColor="#C60B1E"
            landmarkName="La Gran Fiesta"
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
            
            {/* The Illustrated Plaza Card Canvas with Sky Click Fireworks */}
            <div 
              onClick={(e) => {
                // If clicked on backdrop, fire fireworks!
                const target = e.target as HTMLElement;
                if (target.closest('button') || target.closest('.group') || target.closest('input')) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const xPercent = (e.clientX - rect.left) / rect.width;
                const yPercent = (e.clientY - rect.top) / rect.height;
                launchFireworks('tap', xPercent, yPercent);
              }}
              className="relative w-full min-h-[760px] rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl flex flex-col justify-between transition-colors duration-500" 
              style={{ 
                backgroundImage: isNightMode
                  ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.90), rgba(30, 41, 59, 0.94)), url(/game-art/madrid-plaza.png)'
                  : isSunset
                  ? 'linear-gradient(180deg, rgba(194, 65, 12, 0.65), rgba(124, 45, 18, 0.75)), url(/game-art/madrid-plaza.png)'
                  : 'linear-gradient(180deg, rgba(255, 248, 238, 0.28), rgba(254, 243, 199, 0.38)), url(/game-art/madrid-plaza.png)', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              }}
            >
              
              {/* --- SKY AND FESTIVE BACKDROP --- */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Night Stars or Warm Sun / Sunset ambient glow */}
                {isNightMode ? (
                  <div className="absolute inset-0">
                    {[
                      { x: '8%', y: '10%' }, { x: '22%', y: '6%' }, { x: '38%', y: '14%' },
                      { x: '52%', y: '8%' }, { x: '68%', y: '12%' }, { x: '84%', y: '6%' },
                      { x: '94%', y: '14%' }, { x: '16%', y: '22%' }, { x: '76%', y: '20%' }
                    ].map((st, idx) => (
                      <span
                        key={idx}
                        className="absolute text-amber-200 text-xs animate-pulse opacity-80"
                        style={{ left: st.x, top: st.y, animationDuration: `${1.5 + (idx % 3) * 0.5}s` }}
                      >
                        ✦
                      </span>
                    ))}
                  </div>
                ) : isSunset ? (
                  <>
                    <div className="absolute top-0 inset-x-0 h-56 bg-gradient-to-b from-orange-600/40 via-rose-500/30 to-amber-400/10" />
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[450px] h-96 bg-gradient-to-t from-orange-500/35 to-rose-500/25 rounded-full blur-3xl animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-amber-400/25 via-orange-300/15 to-transparent" />
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
                  </>
                )}

                {/* Illustrated Spanish Town Skyline Silhouettes */}
                <svg className="absolute top-0 inset-x-0 w-full h-44 opacity-25" viewBox="0 0 1200 200" preserveAspectRatio="none">
                  <path d="M 400,200 L 400,90 L 415,70 L 415,30 L 425,10 L 435,30 L 435,70 L 450,90 L 450,200 Z" fill={isNightMode ? '#FBBF24' : '#FBBF24'} />
                  <line x1="425" y1="5" x2="425" y2="15" stroke="#FBBF24" strokeWidth="2" />
                  <line x1="421" y1="8" x2="429" y2="8" stroke="#FBBF24" strokeWidth="2" />
                  <path d="M 720,200 L 720,100 Q 755,40 790,100 L 790,200 Z" fill={isNightMode ? '#F59E0B' : '#F59E0B'} />
                  <path d="M 0,200 L 0,130 L 60,100 L 120,130 L 180,110 L 240,140 L 300,115 L 360,135 L 480,130 L 540,105 L 600,135 L 660,110 L 720,130 L 820,115 L 880,135 L 940,105 L 1000,135 L 1060,110 L 1140,135 L 1200,115 L 1200,200 Z" fill={isNightMode ? '#1E293B' : '#DEB887'} />
                </svg>

                {/* Decorative Fiesta Bunting & Farolillos (Strings draped across the sky) */}
                <svg className="absolute top-0 inset-x-0 w-full h-36" viewBox="0 0 1000 130" preserveAspectRatio="none">
                  {/* Top Catenary String */}
                  <path d="M 0,15 Q 250,55 500,20 Q 750,55 1000,15" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" opacity={isNightMode ? '0.8' : '0.6'} />
                  
                  {/* Hanging festive flags */}
                  {[
                    { x: 50, y: 22, color: '#EF4444' },
                    { x: 120, y: 32, color: '#FFC400' },
                    { x: 190, y: 39, color: '#10B981' },
                    { x: 260, y: 40, color: '#EF4444' },
                    { x: 330, y: 38, color: '#FFC400' },
                    { x: 400, y: 30, color: '#EC4899' },
                    { x: 470, y: 22, color: '#FBBF24' },
                    { x: 540, y: 24, color: '#EF4444' },
                    { x: 610, y: 32, color: '#FFC400' },
                    { x: 680, y: 39, color: '#3B82F6' },
                    { x: 750, y: 40, color: '#EF4444' },
                    { x: 820, y: 36, color: '#FFC400' },
                    { x: 890, y: 28, color: '#8B5CF6' },
                    { x: 960, y: 19, color: '#FBBF24' }
                  ].map((flag, idx) => (
                    <polygon
                      key={idx}
                      points={`${flag.x - 12},${flag.y} ${flag.x + 12},${flag.y} ${flag.x},${flag.y + 20}`}
                      fill={flag.color}
                      opacity={isNightMode ? '0.95' : '0.85'}
                    />
                  ))}

                  {/* Hanging Glowing Farolillos (Lanterns) */}
                  {[90, 230, 370, 510, 650, 790, 910].map((lx, idx) => (
                    <g key={idx}>
                      <line x1={lx} y1="35" x2={lx} y2="55" stroke="#FDE68A" strokeWidth="1" />
                      {/* Lantern body */}
                      <circle cx={lx} cy="63" r="8" fill={idx % 2 === 0 ? '#EF4444' : '#F59E0B'} opacity="0.95" />
                      {/* Inner glowing halo */}
                      <circle cx={lx} cy="63" r="16" fill="#FBBF24" opacity={isNightMode ? '0.5' : '0.25'} className="animate-pulse" />
                      <line x1={lx} y1="71" x2={lx} y2="78" stroke="#FBBF24" strokeWidth="1.5" />
                    </g>
                  ))}
                </svg>

                {/* Cobblestone Plaza Floor with Mediterranean Warm Paving Pattern */}
                <div className={`absolute bottom-0 inset-x-0 h-96 transition-colors ${
                  isNightMode 
                    ? 'bg-gradient-to-t from-slate-950/95 via-slate-900/70 to-transparent' 
                    : 'bg-gradient-to-t from-[#EADFCF]/90 via-[#FAF7F2]/60 to-transparent'
                }`}>
                  <div className="w-full h-full opacity-20" style={{
                    backgroundImage: 'radial-gradient(#D97706 1px, transparent 1px), radial-gradient(#EA580C 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    backgroundPosition: '0 0, 12px 12px'
                  }} />
                </div>
              </div>

              {/* --- 1. LA GRAN PORTADA DE LA FERIA & FUN FESTIVAL ATTRACTIONS BAR --- */}
              <div className="relative z-10 pt-4 px-3 sm:px-6 w-full max-w-5xl mx-auto text-center">
                <div className={`p-4 sm:p-5 rounded-3xl border-3 shadow-xl backdrop-blur-md transition-all ${
                  isNightMode
                    ? 'bg-slate-900/95 border-amber-400 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                    : 'bg-white/95 border-amber-400 text-[#24140E]'
                }`}>
                  {/* Glowing Incandescent Bulbs Arch */}
                  <div className="flex items-center justify-center space-x-1.5 sm:space-x-2.5 mb-2 overflow-x-auto py-0.5">
                    {['#EF4444', '#F59E0B', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EF4444', '#F59E0B'].map((color, idx) => (
                      <span
                        key={idx}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full inline-block shadow-md animate-pulse shrink-0"
                        style={{ backgroundColor: color, animationDelay: `${idx * 0.12}s` }}
                      />
                    ))}
                  </div>

                  {/* Portada Title */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-xl sm:text-2xl animate-bounce">🎪</span>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-serif tracking-tight text-[#E05615] drop-shadow-sm">
                      ¡VIVA LA GRAN FIESTA DE ESPAÑA!
                    </h1>
                    <span className="text-xl sm:text-2xl animate-bounce">🎆</span>
                  </div>
                  <p className={`text-xs mt-1 max-w-2xl mx-auto font-medium ${isNightMode ? 'text-amber-200/90' : 'text-[#7A6B60]'}`}>
                    Plaza Mayor de la Celebración • Los viajeros y amigos de las 15 ciudades se reúnen para cantar, saborear tapas y festejar el fin del Camino.
                  </p>

                  {/* Quick Fun Attractions Interactive Bar */}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-3 pt-3 border-t border-amber-300/40">
                    {/* 1. Fortune Wheel Button */}
                    <button
                      onClick={() => setShowWheel(true)}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span className="text-base">🎡</span>
                      <span>Ruleta de la Fortuna (+500🪙)</span>
                    </button>

                    {/* 2. Tomatina Mini-Game Button */}
                    <button
                      onClick={() => setShowTomatina(true)}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <span className="text-base">🍅</span>
                      <span>¡Batalla de la Tomatina! (Juego)</span>
                    </button>

                    {/* 3. Launch Traca Button */}
                    <button
                      onClick={() => launchFireworks('traca')}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-amber-50 text-[#B45309] font-black text-xs border border-amber-300 shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                      title="Lanzar traca pirotécnica valenciana"
                    >
                      <Sparkles className="w-4 h-4 text-[#E05615]" />
                      <span>Traca Valenciana 💥</span>
                    </button>

                    {/* 4. Launch Spanish Flag Fireworks Button */}
                    <button
                      onClick={() => launchFireworks('rojigualda')}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-rose-50 text-rose-700 font-black text-xs border border-rose-300 shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                      title="Lanzar fuegos artificiales con los colores de España"
                    >
                      <span>🇪🇸</span>
                      <span>Fuegos Rojigualda 🎆</span>
                    </button>

                    {/* 5. Golden Starlight Cascades */}
                    <button
                      onClick={() => launchFireworks('estrellas')}
                      className="px-3.5 py-2 rounded-full bg-white hover:bg-amber-50 text-amber-700 font-black text-xs border border-amber-300 shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                      title="Lluvia dorada de estrellas"
                    >
                      <span>🌟</span>
                      <span>Lluvia Dorada</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* --- 2. CARPA DE LA REAL ACADEMIA ESPAÑOLA --- */}
              <div className="relative z-10 pt-3 px-3 sm:px-6 w-full max-w-5xl mx-auto">
                <div className={`p-3 sm:p-4 rounded-2xl border-2 shadow-lg backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-3 text-left transition-colors ${
                  isNightMode ? 'bg-slate-900/90 border-amber-400 text-white' : 'bg-white/95 border-amber-400 text-[#24140E]'
                }`}>
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 via-[#EA580C] to-[#E05615] flex items-center justify-center shrink-0 shadow-md text-white">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-[#92400E] text-[10px] font-black uppercase tracking-wider border border-amber-200">
                          Real Academia Española
                        </span>
                        <span className="text-[11px] text-amber-500 font-bold hidden sm:inline">
                          • Diploma Oficial A1
                        </span>
                      </div>
                      <h2 className={`text-sm sm:text-base font-black font-serif tracking-tight mt-0.5 ${isNightMode ? 'text-amber-100' : 'text-[#24140E]'}`}>
                        Gran Examen Oficial Acumulativo BAESP101
                      </h2>
                      <p className={`text-[11px] line-clamp-1 max-w-xl ${isNightMode ? 'text-slate-300' : 'text-[#6B584D]'}`}>
                        Culmina tu recorrido por las 15 ciudades. 30 preguntas de los 5 módulos del sílabo oficial.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onStartFinalAssessment}
                    className="shrink-0 inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E05615] via-[#EA580C] to-[#F3B33D] hover:from-[#C2410C] hover:to-[#E05615] text-white font-black text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Presentarse al Examen (30 preguntas)</span>
                  </button>
                </div>
              </div>

              {/* --- 3. MIDDLE & LOWER ARENA: MARKET STALLS ON SIDES + CENTRAL PLAZA WITH NPCS --- */}
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

                {/* CENTRAL PLAZA SQUARE (Fountain + Tapas + Passport + Player Avatar + Rhythm Tablao + 14 Stationed NPCs) */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center py-2 relative">
                  
                  {/* Plaza Focal Landmarks & Activities Row */}
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-2.5 w-full">
                    
                    {/* 1. Interactive Wishing Fountain */}
                    <button
                      onClick={() => setShowFountainModal(true)}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 hover:bg-sky-50 border-2 border-sky-300 shadow-xs backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer text-left"
                      title="Lanzar una moneda a la Fuente Mágica de los Deseos"
                    >
                      <span className="text-base group-hover:animate-bounce">⛲</span>
                      <div>
                        <span className="text-xs font-black text-sky-950 block leading-tight">
                          Fuente de los Deseos
                        </span>
                        <span className="text-[10px] text-sky-700 font-bold block">
                          {wishesCount > 0 ? `${wishesCount} concedidos ✨` : 'Pedir deseo (+100🪙)'}
                        </span>
                      </div>
                    </button>

                    {/* 2. Interactive Tapas Tasting Table */}
                    <button
                      onClick={() => setShowTapasModal(true)}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 hover:bg-orange-50 border-2 border-orange-300 shadow-xs backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer text-left"
                      title="Saborear las 6 tapas tradicionales de España"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">🥘</span>
                      <div>
                        <span className="text-xs font-black text-orange-950 block leading-tight">
                          Mesa de Tapas
                        </span>
                        <span className="text-[10px] text-orange-700 font-bold block">
                          {tastedTapas.length}/6 probadas (+25🪙)
                        </span>
                      </div>
                    </button>

                    {/* 3. Festival Passport */}
                    <button
                      onClick={() => setShowPassportModal(true)}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 hover:bg-emerald-50 border-2 border-emerald-300 shadow-xs backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer text-left"
                      title="Ver tu Pasaporte de la Plaza Mayor y tus sellos"
                    >
                      <span className="text-base group-hover:rotate-12 transition-transform">📜</span>
                      <div>
                        <span className="text-xs font-black text-emerald-950 block leading-tight">
                          Pasaporte
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          {completedMilestonesCount}/8 sellos
                        </span>
                      </div>
                    </button>

                    {/* 4. Player Avatar in Plaza Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border-2 border-amber-400 shadow-xs backdrop-blur-sm">
                      <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-yellow-400">
                        <PlayerAvatar character={progress.profile?.character} size={22} />
                      </div>
                      <span className="text-xs font-black text-[#24140E]">
                        ¡{playerName} en la fiesta!
                      </span>
                    </div>

                  </div>

                  {/* Tablao Flamenco Interactive Rhythm Bar & Fiesta Meter */}
                  <div className={`relative w-full mb-3 px-3.5 py-2.5 rounded-2xl border-2 transition-all flex flex-col gap-2 shadow-sm backdrop-blur-md overflow-hidden ${
                    isNightMode
                      ? 'bg-slate-900/85 border-rose-500/70 text-rose-100'
                      : 'bg-gradient-to-r from-rose-50/95 via-amber-50/95 to-orange-50/95 border-rose-300 text-rose-950'
                  }`}>
                    {/* Floating Musical Notes Animation Overlay */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                      {floatingNotes.map(n => (
                        <span
                          key={n.id}
                          className="absolute text-xl font-bold animate-bounce filter drop-shadow select-none"
                          style={{ left: `${n.x}%`, bottom: '25%' }}
                        >
                          {n.symbol}
                        </span>
                      ))}
                    </div>

                    {/* Top Row: Title & Fiesta Meter */}
                    <div className="flex flex-wrap items-center justify-between gap-2 z-10">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl animate-pulse">💃</span>
                        <div>
                          <span className="text-xs font-black block leading-tight">Tablao Flamenco • Medidor de Fiesta: {fiestaMeter}%</span>
                          <span className="text-[10px] opacity-75">
                            {flamencoCombos > 0 ? `${flamencoCombos} toques al compás` : 'Toca los ritmos para avivar la celebración'}
                          </span>
                        </div>
                      </div>

                      {/* Fiesta Meter Bar */}
                      <div className="w-36 sm:w-44 bg-white/60 h-2.5 rounded-full overflow-hidden border border-rose-300">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-orange-500 transition-all duration-300 rounded-full"
                          style={{ width: `${fiestaMeter}%` }}
                        />
                      </div>
                    </div>

                    {/* Celebration Message if 100% */}
                    {fiestaMeter >= 100 && (
                      <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-slate-950 font-black text-xs text-center shadow-xs animate-pulse">
                        🎉 ¡FIESTA TOTAL ALCANZADA EN LA PLAZA MAYOR! (+100 🪙) 🎉
                      </div>
                    )}

                    {/* Rhythm Buttons Row */}
                    <div className="flex items-center justify-center sm:justify-end space-x-1.5 flex-wrap z-10">
                      <button
                        onClick={() => handleFlamencoBeatTap('guitar')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1 ${
                          activeFlamencoBeat === 'guitar'
                            ? 'bg-amber-500 text-white scale-110 shadow-md'
                            : 'bg-white hover:bg-amber-100 text-[#78350F] border border-amber-300'
                        }`}
                        title="Tocar acorde de guitarra española"
                      >
                        <span>🎸</span>
                        <span>Guitarra</span>
                      </button>
                      <button
                        onClick={() => handleFlamencoBeatTap('palmas')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1 ${
                          activeFlamencoBeat === 'palmas'
                            ? 'bg-rose-500 text-white scale-110 shadow-md'
                            : 'bg-white hover:bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                        title="Tocar palmas flamencas"
                      >
                        <span>👏</span>
                        <span>Palmas</span>
                      </button>
                      <button
                        onClick={() => handleFlamencoBeatTap('castanets')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1 ${
                          activeFlamencoBeat === 'castanets'
                            ? 'bg-red-500 text-white scale-110 shadow-md'
                            : 'bg-white hover:bg-red-100 text-red-800 border border-red-300'
                        }`}
                        title="Tocar castañuelas"
                      >
                        <span>🪗</span>
                        <span>Castañuelas</span>
                      </button>
                      <button
                        onClick={() => handleFlamencoBeatTap('ole')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1 ${
                          activeFlamencoBeat === 'ole'
                            ? 'bg-amber-400 text-amber-950 scale-110 shadow-md'
                            : 'bg-gradient-to-r from-amber-400 to-orange-400 text-[#24140E] hover:from-amber-300 hover:to-orange-300'
                        }`}
                        title="¡Olé al compás!"
                      >
                        <Sparkles className="w-3 h-3 text-[#24140E]" />
                        <span>¡Olé!</span>
                      </button>
                    </div>
                  </div>

                  {/* 14 Friends Section in Frosted Container */}
                  <div className="w-full bg-white/95 rounded-2xl border-2 border-amber-300/80 shadow-md p-3 backdrop-blur-md">
                    {/* Live Banter Rotating Speech Bubble */}
                    <div className="w-full mb-2 p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 shadow-xs flex items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xl shrink-0 animate-bounce">🗣️</span>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] uppercase font-black tracking-wider text-[#B45309]">
                              {activeChatter.npc} ({activeChatter.city}):
                            </span>
                            <span className="text-[9px] text-[#A855F7] font-bold hidden sm:inline">
                              • En vivo en la plaza
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#24140E] truncate italic mt-0.5">
                            "{activeChatter.text}"
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const npc = FESTIVAL_CHARACTERS.find(c => c.name.toLowerCase().includes(activeChatter.npc.toLowerCase()));
                          if (npc) handleOpenNpc(npc);
                        }}
                        className="shrink-0 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs shadow-xs transition-transform hover:scale-105 cursor-pointer"
                      >
                        Charlar →
                      </button>
                    </div>

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

            {/* Audio pronunciation & English translation toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => speakSpanish(activeNpc.dialogue)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-[#B45309] text-xs font-black border border-amber-300 transition-transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                title="Escuchar locución en español nativo"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#E05615]" />
                <span>🔊 Escuchar en Español</span>
              </button>

              <button
                onClick={() => setShowEnglishTranslation(!showEnglishTranslation)}
                className="text-xs font-bold text-[#E05615] hover:text-[#B45309] transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showEnglishTranslation ? 'Ocultar inglés' : 'Ver en inglés'}</span>
              </button>
            </div>
            {showEnglishTranslation && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#EADFCF] text-xs text-[#6B584D] italic animate-fadeIn">
                "{activeNpc.englishDialogue}"
              </div>
            )}

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
                  {shuffledNpcOptions.map((option, idx) => (
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
                  {shuffledStallOptions.map((opt, i) => (
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

      {/* --- FESTIVAL FORTUNE WHEEL MODAL --- */}
      <FestivalFortuneWheel 
        isOpen={showWheel} 
        onClose={() => setShowWheel(false)} 
      />

      {/* --- TOMATINA ARCADE MINI-GAME MODAL --- */}
      <TomatinaGameModal 
        isOpen={showTomatina} 
        onClose={() => setShowTomatina(false)} 
      />

      {/* ========================================================
          6. WISHING FOUNTAIN MODAL (Fuente Mágica de los Deseos)
          ======================================================== */}
      {showFountainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-sky-50 via-white to-amber-50/50 border-3 border-sky-300 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-[#24140E]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-sky-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-3xl shadow-md border-2 border-white text-white shrink-0">
                  ⛲
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase tracking-wider border border-sky-300">
                      Plaza Mayor
                    </span>
                    <span className="text-xs font-bold text-sky-700">
                      {wishesCount} {wishesCount === 1 ? 'deseo concedido' : 'deseos concedidos'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#24140E] font-serif mt-0.5">
                    Fuente Mágica de los Deseos
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFountainModal(false);
                  setJustMadeWish(false);
                }}
                className="p-2 rounded-xl bg-white hover:bg-sky-100 text-[#6B584D] border border-sky-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fountain Lore */}
            <div className="p-4 rounded-2xl bg-sky-100/70 border border-sky-200 text-xs sm:text-sm text-sky-950 leading-relaxed">
              <p className="font-semibold">
                La tradición secular dice que arrojar una moneda al agua cristalina de esta fuente atrae la sabiduría de las letras españolas y la fortuna en los caminos.
              </p>
            </div>

            {/* Interactive Coin Toss Action */}
            <div className="text-center py-2">
              <button
                onClick={handleMakeFountainWish}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center space-x-2"
              >
                <span className="text-lg">🪙</span>
                <span>¡Tirar Moneda a la Fuente! (+100 🪙)</span>
              </button>
            </div>

            {/* Revealed Fortune / Refrán */}
            {fountainFortune && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-amber-300 shadow-md space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#B45309] flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#E05615]" />
                    <span>Sabiduría Concedida</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    +100 Monedas 🪙
                  </span>
                </div>
                <blockquote className="text-sm sm:text-base font-black text-[#24140E] font-serif italic border-l-4 border-amber-500 pl-3">
                  "{fountainFortune.saying}"
                </blockquote>
                <div className="text-xs text-[#78350F] font-bold text-right">
                  — {fountainFortune.author}
                </div>
                <p className="text-xs text-[#524136] bg-white/80 p-2.5 rounded-xl border border-amber-200 leading-relaxed font-medium">
                  💡 <span className="font-bold">Significado:</span> {fountainFortune.meaning}
                </p>
              </div>
            )}

            {/* Close */}
            <div className="flex justify-end pt-2 border-t border-sky-200">
              <button
                onClick={() => {
                  setShowFountainModal(false);
                  setJustMadeWish(false);
                }}
                className="px-6 py-2 rounded-full bg-sky-700 hover:bg-sky-800 text-white font-black text-xs shadow transition-all cursor-pointer"
              >
                Volver a la Plaza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. TAPAS TASTING TABLE MODAL (Mesa de Tapas de España)
          ======================================================== */}
      {showTapasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#FAF7F2] border-3 border-amber-400 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-[#24140E]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#EADFCF] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-3xl shadow-md border-2 border-white text-white shrink-0">
                  🥘
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#B45309] text-[10px] font-black uppercase tracking-wider border border-amber-300">
                      Gastronomía de España
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {tastedTapas.length} de 6 degustadas
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#24140E] font-serif mt-0.5">
                    Mesa de Tapas Tradicionales
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowTapasModal(false)}
                className="p-2 rounded-xl bg-white hover:bg-[#F2ECE1] text-[#6B584D] border border-[#E0D5C7] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#6B584D] font-medium">
              El "tapeo" es una de las grandes señas de identidad de España. Selecciona cada tapa para escuchar su pronunciación, aprender su origen y recibir monedas por degustarla.
            </p>

            {/* 6 Tapas Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {PLAZA_TAPAS.map(tapa => {
                const isSelected = selectedTapa.id === tapa.id;
                const isTasted = tastedTapas.includes(tapa.id);
                return (
                  <button
                    key={tapa.id}
                    onClick={() => handleTasteTapa(tapa)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'bg-amber-100/90 border-amber-500 shadow-md ring-2 ring-amber-400'
                        : isTasted
                        ? 'bg-emerald-50/70 border-emerald-300 hover:border-amber-400'
                        : 'bg-white border-[#E8DFD5] hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{tapa.emoji}</span>
                      {isTasted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded-full border border-emerald-300">
                          ✓ Probada
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <h4 className="text-xs font-black text-[#24140E] leading-tight line-clamp-1">
                        {tapa.name}
                      </h4>
                      <p className="text-[10px] text-[#B45309] font-bold mt-0.5 truncate">
                        {tapa.region}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Tapa Detail Card */}
            {selectedTapa && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-sm space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-amber-100 pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-3xl">{selectedTapa.emoji}</span>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-[#24140E] font-serif">
                        {selectedTapa.name}
                      </h4>
                      <p className="text-xs font-bold text-[#E05615]">
                        📍 {selectedTapa.region}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => speakSpanish(selectedTapa.name)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-[#B45309] text-xs font-black border border-amber-300 transition-all hover:scale-105 cursor-pointer shadow-xs"
                    title="Escuchar pronunciación auténtica"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#E05615]" />
                    <span>Pronunciar: "{selectedTapa.name}"</span>
                  </button>
                </div>

                <div className="text-xs text-[#524136] leading-relaxed">
                  <p className="font-medium">{selectedTapa.description}</p>
                  <p className="mt-1 text-[11px] text-[#78350F] italic font-semibold">
                    🗣️ Guía fonética: <span className="font-mono not-italic">{selectedTapa.pronunciation}</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#7A4B10] leading-relaxed">
                  <span className="font-black text-[#B45309] block mb-0.5">
                    💡 Curiosidad gastronómica:
                  </span>
                  <p>{selectedTapa.trivia}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-emerald-800">
                    {tastedTapas.includes(selectedTapa.id) ? '✓ Tapa saboreada (+25 🪙 otorgadas)' : 'Toca para degustar y ganar +25 🪙'}
                  </span>
                  <button
                    onClick={() => handleTasteTapa(selectedTapa)}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs shadow-xs transition-transform hover:scale-105 cursor-pointer"
                  >
                    {tastedTapas.includes(selectedTapa.id) ? '¡Degustar de nuevo!' : 'Degustar Tapa (+25🪙)'}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-[#EADFCF]">
              <button
                onClick={() => setShowTapasModal(false)}
                className="px-6 py-2 rounded-full bg-[#E05615] hover:bg-[#C2410C] text-white font-black text-xs shadow transition-all cursor-pointer"
              >
                Volver a la Fiesta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. FESTIVAL PASSPORT MODAL (Pasaporte de la Plaza Mayor)
          ======================================================== */}
      {showPassportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F2] to-[#FFF8EE] border-3 border-amber-500 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto text-[#24140E]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-amber-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 flex items-center justify-center text-3xl shadow-md border-2 border-white text-white shrink-0">
                  📜
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#B45309] text-[10px] font-black uppercase tracking-wider border border-amber-300">
                      Documento de la Fiesta
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {completedMilestonesCount}/8 Sellos Obtenidos
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#24140E] font-serif mt-0.5">
                    Pasaporte Oficial de la Plaza Mayor
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowPassportModal(false)}
                className="p-2 rounded-xl bg-white hover:bg-amber-100 text-[#6B584D] border border-amber-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passport Progress Bar */}
            <div className="p-3.5 rounded-2xl bg-white border-2 border-amber-300 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-[#B45309]">Progreso de la Celebración</span>
                <span className="text-[#E05615]">{Math.round((completedMilestonesCount / 8) * 100)}% Completado</span>
              </div>
              <div className="w-full bg-[#FAF7F2] h-3 rounded-full overflow-hidden border border-amber-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-500 rounded-full"
                  style={{ width: `${(completedMilestonesCount / 8) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-[#7A6B60] text-center font-medium mt-1">
                {completedMilestonesCount === 8
                  ? '👑 ¡Enhorabuena! Tienes el Pasaporte Completo de la Gran Fiesta de España.'
                  : `Completa los ${8 - completedMilestonesCount} sellos restantes para convertirte en Maestro de la Plaza.`}
              </p>
            </div>

            {/* 8 Milestones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {passportMilestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between gap-2.5 ${
                    milestone.done
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                      : 'bg-white border-[#E8DFD5]'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm">{milestone.done ? '🌟' : '⏳'}</span>
                      <h4 className="text-xs sm:text-[13px] font-black text-[#24140E] truncate">
                        {milestone.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-[#6B584D] line-clamp-1 font-medium">
                      {milestone.desc}
                    </p>
                    <span className="text-[10px] font-black text-[#B45309] block">
                      Estado: {milestone.progress}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {milestone.done ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs border border-emerald-700">
                        ✓ SELLADO
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-[#FAF7F2] text-[#8C7A6B] font-bold text-[10px] border border-[#E0D5C7]">
                        PENDIENTE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-amber-200">
              <button
                onClick={() => setShowPassportModal(false)}
                className="px-6 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow transition-all cursor-pointer"
              >
                Cerrar Pasaporte
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
