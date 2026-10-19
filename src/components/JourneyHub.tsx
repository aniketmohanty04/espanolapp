import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_CITIES, getCityById } from '../data/citiesData';
import { City, Level } from '../types';
import { askCaminoGemini } from '../services/geminiService';
import { 
  Compass, 
  MapPin, 
  Star, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Bot, 
  Play, 
  Route, 
  Globe, 
  BookOpen, 
  Calendar, 
  Award, 
  Settings, 
  User,
  Heart
} from 'lucide-react';

interface JourneyHubProps {
  onStartJourney: () => void;
  onOpenMap: () => void;
  onSelectCityPath: (cityId: string) => void;
  onPlayLevel: (cityId: string, levelId: string) => void;
  onOpenFestival: () => void;
  onOpenNotebook: () => void;
  onOpenStudyPlan: () => void;
  onOpenSyllabus: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'camino';
  text: string;
  spanishText?: string;
  pronunciation?: string;
  englishText?: string;
  correctionNotice?: string;
  practicePrompt?: string;
  source?: 'gemini' | 'fallback';
}

// City Curated Photos matching the editorial reference style
const CITY_EDITORIAL_PHOTOS: Record<string, string> = {
  madrid: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80',
  granada: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80',
  sevilla: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80',
  toledo: 'https://images.unsplash.com/photo-1579282240050-352db0a14c21?auto=format&fit=crop&w=800&q=80',
  salamanca: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
  segovia: 'https://images.unsplash.com/photo-1561081522-f3f2256795fc?auto=format&fit=crop&w=800&q=80',
  cordoba: 'https://images.unsplash.com/photo-1579282240050-352db0a14c21?auto=format&fit=crop&w=800&q=80',
  malaga: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80',
  cadiz: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  valencia: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd1?auto=format&fit=crop&w=800&q=80',
  zaragoza: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=800&q=80',
  bilbao: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
  'san-sebastian': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  santiago: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=80'
};

// City Subtitle summaries matching the stepper
const CITY_STEPPER_SUBTITLES: Record<string, string> = {
  madrid: 'The missing train ticket',
  barcelona: 'Objects & places',
  granada: 'Find your way',
  sevilla: 'Taste the city',
  toledo: 'The imperial artisan',
  salamanca: 'Words of the university',
  segovia: 'Ancient Roman aqueducts',
  cordoba: 'Courtyards & descriptions',
  malaga: 'Mediterranean weather & time',
  cadiz: 'Atlantic coastal life',
  valencia: 'Daily routines & markets',
  zaragoza: 'Transit & schedules',
  bilbao: 'Pintxos & directions',
  'san-sebastian': 'Culinary expressions & dining',
  santiago: 'The final pilgrim path'
};

export const JourneyHub: React.FC<JourneyHubProps> = ({
  onStartJourney,
  onOpenMap,
  onSelectCityPath,
  onPlayLevel,
  onOpenFestival,
  onOpenNotebook,
  onOpenStudyPlan,
  onOpenSyllabus,
  onOpenAchievements,
  onOpenSettings
}) => {
  const { progress } = useGame();
  
  // Currently active or selected city in the stepper (defaults to furthest unlocked city and first unfinished level)
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    const unlocked = progress.unlockedCityIds;
    return (unlocked && unlocked.length > 0) ? unlocked[unlocked.length - 1] : 'madrid';
  });
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(() => {
    const initialCityId = (progress.unlockedCityIds && progress.unlockedCityIds.length > 0) 
      ? progress.unlockedCityIds[progress.unlockedCityIds.length - 1] 
      : 'madrid';
    const city = getCityById(initialCityId) || ALL_CITIES[0];
    const firstUnfinished = city.levels.findIndex(lvl => !progress.completedLevels[lvl.id]);
    return firstUnfinished !== -1 ? firstUnfinished : 0;
  });
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Stepper scroll container reference
  const stepperRef = useRef<HTMLDivElement>(null);

  // Chatbot state for "Meet Camino" powered by Google Gemini 3.8 Flash
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'camino',
      text: "¡Hola viajero! I'm Camino, your personal Spanish coach & fluency tutor. 🤖🇪🇸",
      spanishText: '¡Bienvenido a tu aventura por España!',
      pronunciation: 'byen-beh-NEE-doh ah too ah-ben-TOO-rah por es-PAH-nyah',
      englishText: 'Ask me to translate words, explain grammar, or chat in Spanish and I will gently find and fix any faults!',
      practicePrompt: 'Try asking "how do you say summer in espanol" or say "yo soy calor"!',
      source: 'gemini'
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isCaminoLoading, setIsCaminoLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isCaminoLoading]);

  const selectedCity = getCityById(selectedCityId) || ALL_CITIES[0];
  const activeLevel = selectedCity.levels[selectedLevelIdx] || selectedCity.levels[0];

  const isLevelCompleted = Boolean(progress.completedLevels[activeLevel.id]);
  const isCityUnlocked = progress.unlockedCityIds.includes(selectedCity.id);

  // Scroll Stepper left/right
  const handleScrollStepper = (direction: 'left' | 'right') => {
    if (stepperRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      stepperRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Camino AI Responses powered by Google Gemini 3.8 Flash
  const handleSendChat = async (customText?: string) => {
    const textToSend = customText || chatInput.trim();
    if (!textToSend || isCaminoLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsCaminoLoading(true);

    try {
      const response = await askCaminoGemini(textToSend, {
        cityName: selectedCity.name,
        cityId: selectedCity.id,
        levelNumber: activeLevel.levelNumber,
        streak: progress.stats.streak || 1,
        playerName: (progress.profile?.displayName && progress.profile.displayName !== 'Viajero' && progress.profile.displayName !== 'years')
          ? progress.profile.displayName
          : (progress.profile?.character?.name && progress.profile.character.name !== 'Alex' && progress.profile.character.name !== 'Viajero' && progress.profile.character.name !== 'years')
          ? progress.profile.character.name
          : progress.profile?.displayName || 'Aventurero'
      });

      const caminoMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'camino',
        text: response.text,
        spanishText: response.spanishText,
        englishText: response.englishText,
        pronunciation: response.pronunciation,
        correctionNotice: response.correctionNotice,
        practicePrompt: response.practicePrompt,
        source: response.source
      };

      setMessages(prev => [...prev, caminoMsg]);
    } catch (err) {
      console.warn('Error fetching Gemini Camino response:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'camino',
          text: `Como tu profesor de español, aquí tienes la instrucción para "${textToSend}":`,
          spanishText: `¿Cómo se dice "${textToSend}" en español?`,
          englishText: 'To ask how to say any word, use: "¿Cómo se dice [palabra] en español?". You can also ask me about verb conjugations (hablar, comer, vivir, ser, estar) or write a sentence for me to correct!',
          practicePrompt: '¿Cómo se dice "amigo" en español?',
          source: 'fallback'
        }
      ]);
    } finally {
      setIsCaminoLoading(false);
    }
  };

  const streakDay = Math.min(progress.stats.streak || 1, 36);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#24140E] font-sans selection:bg-[#E05615] selection:text-white pb-16">
      
      {/* ========================================================
          1. TOP NAVIGATION BAR (Exact match to Image 1)
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EADFCF] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenMap}
              className="flex items-center space-x-2.5 text-left group focus:outline-none"
            >
              {/* Compass Icon Badge */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E05615] to-[#EA580C] flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-lg sm:text-xl tracking-tight text-[#24140E] font-serif leading-none">
                  ¡Aventura Española!
                </h1>
                <span className="text-[9px] tracking-[0.2em] font-extrabold text-[#8C7A6B] uppercase block mt-0.5">
                  LEARN BY GOING
                </span>
              </div>
            </button>
          </div>

          {/* Center: Quick navigation links */}
          <nav className="hidden md:flex items-center space-x-2 text-xs font-bold text-[#6B584D]">
            <button
              onClick={onOpenMap}
              className="px-3 py-1.5 rounded-full hover:bg-[#EFE6D9] text-[#24140E] transition-colors flex items-center space-x-1"
            >
              <Globe className="w-3.5 h-3.5 text-[#E05615]" />
              <span>Mapa de España</span>
            </button>
            <button
              onClick={() => onSelectCityPath(selectedCity.id)}
              className="px-3 py-1.5 rounded-full hover:bg-[#EFE6D9] text-[#24140E] transition-colors flex items-center space-x-1"
            >
              <Route className="w-3.5 h-3.5 text-[#E05615]" />
              <span>Sendero {selectedCity.name}</span>
            </button>
            <button
              onClick={onOpenFestival}
              className="px-3 py-1.5 rounded-full hover:bg-[#EFE6D9] text-[#E05615] font-extrabold transition-colors flex items-center space-x-1"
            >
              <span>🎉 La Gran Fiesta</span>
            </button>
            <button
              onClick={onOpenNotebook}
              className="px-3 py-1.5 rounded-full hover:bg-[#EFE6D9] text-[#6B584D] transition-colors"
            >
              Cuaderno
            </button>
            <button
              onClick={onOpenSyllabus}
              className="px-3 py-1.5 rounded-full hover:bg-[#EFE6D9] text-[#6B584D] transition-colors"
            >
              Sílabo A1
            </button>
          </nav>

          {/* Right: Coins, XP, and Profile Avatar */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm font-black">
            {/* Coins Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8DFD5] shadow-xs text-[#24140E]">
              <span className="text-base">🪙</span>
              <span>{progress.stats.coins.toLocaleString()}</span>
            </div>

            {/* XP Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8DFD5] shadow-xs text-[#2563EB]">
              <Sparkles className="w-4 h-4 text-[#38BDF8] fill-[#38BDF8]" />
              <span>{progress.stats.xp.toLocaleString()} XP</span>
            </div>

            {/* Profile Avatar with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#24140E] hover:bg-[#3D251A] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
                title="Perfil y Ajustes"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border-2 border-[#E8DFD5] p-2 shadow-2xl z-50 animate-scaleUp text-xs font-bold text-[#382318]">
                  <div className="px-3 py-2 border-b border-[#F0E8DD]">
                    <p className="font-extrabold text-sm text-[#24140E]">
                      {(progress.profile?.displayName && progress.profile.displayName !== 'Viajero' && progress.profile.displayName !== 'years')
                        ? progress.profile.displayName
                        : (progress.profile?.character?.name && progress.profile.character.name !== 'Alex' && progress.profile.character.name !== 'Viajero' && progress.profile.character.name !== 'years')
                        ? progress.profile.character.name
                        : progress.profile?.displayName || 'Aventurero'}
                    </p>
                    <p className="text-[10px] text-[#8C7A6B]">Nivel {progress.stats.level} • {selectedCity.name}</p>
                  </div>
                  <button
                    onClick={() => { setShowProfileMenu(false); onOpenStudyPlan(); }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center space-x-2 mt-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#E05615]" />
                    <span>Plan de Estudio 35 Días</span>
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); onOpenAchievements(); }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center space-x-2"
                  >
                    <Award className="w-3.5 h-3.5 text-[#E05615]" />
                    <span>Trofeos y Logros</span>
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); onOpenSettings(); }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#8C7A6B]" />
                    <span>Configuración</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. HERO SECTION (Exact match to Image 1)
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline and Call-to-Actions */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            {/* Day / Journey Begins Badge */}
            <div className="flex items-center space-x-3 text-xs sm:text-sm font-extrabold text-[#8C7A6B] tracking-[0.15em] uppercase mb-4 sm:mb-6">
              <span className="w-8 h-[2px] bg-[#8C7A6B] inline-block" />
              <span>DAY {String(streakDay).padStart(2, '0')} / 36 • YOUR JOURNEY BEGINS</span>
            </div>

            {/* Giant Display Headline */}
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black font-serif tracking-tight leading-[0.95] text-[#24140E]">
              Spain is
              <br />
              <span className="text-[#E05615]">calling.</span>
            </h2>

            {/* Supporting Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-[#6B584D] font-normal leading-relaxed mt-5 max-w-lg">
              Learn the Spanish you need to find your train, meet your people, and make it to the fiesta.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8">
              <button
                onClick={() => onStartJourney()}
                className="px-7 py-4 rounded-2xl bg-[#E05615] hover:bg-[#C9470C] text-white font-black text-sm sm:text-base shadow-xl shadow-orange-600/25 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2 cursor-pointer"
              >
                <span>Start your journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenMap}
                className="px-6 py-4 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#24140E] border-2 border-[#E0D5C7] font-bold text-sm sm:text-base transition-all hover:border-[#D0C2B0] shadow-xs flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4 text-[#E05615]" />
                <span>View the map</span>
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Postcard Artwork with Geometric Overlays */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div 
              className="relative w-full max-w-[460px] aspect-[4/3.5] rounded-[2.5rem] bg-[#E8C2B3] p-4 sm:p-5 shadow-2xl border-8 border-white overflow-hidden"
              style={{
                backgroundImage: 'linear-gradient(rgba(195, 115, 95, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(195, 115, 95, 0.25) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              {/* Inner Photographic Card */}
              <div 
                className="w-full h-full rounded-2xl overflow-hidden relative shadow-md"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1000&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 35%'
                }}
              >
                {/* Soft Warm Sky Tint */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-950/20 via-transparent to-amber-200/10 pointer-events-none" />

                {/* Golden Sun Disc (Upper Right) */}
                <div 
                  className="absolute top-2 right-10 w-32 h-32 rounded-full bg-[#E5B242] mix-blend-multiply opacity-90 pointer-events-none" 
                />

                {/* Geometric Terracotta Architectural Silhouettes (Bottom Edge) */}
                <svg 
                  viewBox="0 0 400 130" 
                  preserveAspectRatio="none" 
                  className="absolute bottom-0 left-0 right-0 w-full h-28 pointer-events-none z-10"
                >
                  {/* Layer 1: Darker Terracotta Background Blocks */}
                  <rect x="0" y="45" width="70" height="85" fill="#B84B2E" opacity="0.85" />
                  <rect x="55" y="70" width="65" height="60" fill="#A83F24" opacity="0.80" />
                  <rect x="110" y="40" width="75" height="90" fill="#B84B2E" opacity="0.85" />
                  <rect x="175" y="60" width="70" height="70" fill="#A83F24" opacity="0.80" />
                  <rect x="235" y="30" width="65" height="100" fill="#B84B2E" opacity="0.85" />
                  <rect x="290" y="55" width="60" height="75" fill="#A83F24" opacity="0.80" />
                  <rect x="340" y="40" width="60" height="90" fill="#B84B2E" opacity="0.85" />

                  {/* Layer 2: Foreground Warm Terracotta Blocks */}
                  <rect x="0" y="60" width="55" height="70" fill="#C85A3B" opacity="0.95" />
                  <rect x="45" y="85" width="50" height="45" fill="#C85A3B" opacity="0.95" />
                  <rect x="85" y="55" width="65" height="75" fill="#C85A3B" opacity="0.95" />
                  <rect x="140" y="75" width="80" height="55" fill="#C85A3B" opacity="0.95" />
                  <rect x="210" y="45" width="70" height="85" fill="#C85A3B" opacity="0.95" />
                  <rect x="270" y="70" width="65" height="60" fill="#C85A3B" opacity="0.95" />
                  <rect x="325" y="50" width="75" height="80" fill="#C85A3B" opacity="0.95" />
                </svg>

                {/* Floating Badge 1: Level Up (Top Right) */}
                <div className="absolute top-6 right-5 z-20 px-3.5 py-1.5 rounded-full bg-white text-[#24140E] text-xs font-black shadow-lg border border-slate-100 flex items-center space-x-1.5 select-none animate-bounce">
                  <span className="text-amber-500 font-bold">★</span>
                  <span>Level up</span>
                </div>

                {/* Floating Badge 2: hola -> hello (Middle Right) */}
                <div 
                  translate="no" 
                  className="notranslate absolute bottom-16 right-5 z-20 px-3.5 py-1.5 rounded-full bg-white text-[#24140E] text-xs font-black shadow-lg border border-slate-100 flex items-center space-x-1.5 select-none"
                >
                  <span className="text-[#E05615] font-black">hola</span>
                  <span className="text-slate-400 font-bold mx-1">→</span>
                  <span className="text-[#24140E] font-black">hello</span>
                </div>

                {/* Floating Badge 3: Madrid, España (Bottom Left) */}
                <div 
                  translate="no" 
                  className="notranslate absolute bottom-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-white text-[#24140E] text-xs font-bold shadow-lg border border-slate-100 flex items-center space-x-1.5 select-none"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#E05615]" />
                  <span>Madrid, España</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. CHOOSE YOUR NEXT STOP — HORIZONTAL CITY STEPPER WITH 5 MODULES (3 CITIES PER MODULE)
          ======================================================== */}
      <section id="journey-stepper-section" className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E05615] text-white text-[10px] font-black uppercase tracking-wider">
                PLAN DE ESTUDIOS: 5 MÓDULOS
              </span>
              <span className="text-xs font-bold text-[#8C7A6B]">
                3 Ciudades por Módulo • 15 Ciudades en Total
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#24140E]">
              Choose your next stop
            </h3>
            <p className="text-xs sm:text-sm text-[#7D6B5E] mt-0.5">
              Completa las 3 ciudades de cada módulo para culminar cada hito del sílabo oficial.
            </p>
          </div>

          {/* Stepper Carousel Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleScrollStepper('left')}
              className="w-9 h-9 rounded-full bg-white border border-[#E0D5C7] text-[#24140E] hover:bg-[#FAF7F2] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScrollStepper('right')}
              className="w-9 h-9 rounded-full bg-white border border-[#E0D5C7] text-[#24140E] hover:bg-[#FAF7F2] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Modules Navigation & Progress Tabs (3 Cities per Module) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(modNum => {
            const modCities = ALL_CITIES.filter(c => c.moduleIndex === modNum);
            const completedModCities = modCities.filter(c => Boolean(progress.completedBosses[c.id]?.passed)).length;
            const isModComplete = completedModCities === 3;
            const isModUnlocked = modCities.some(c => progress.unlockedCityIds.includes(c.id));
            const isCurrentMod = selectedCity.moduleIndex === modNum;
            
            const moduleShortNames = [
              '1. Fundamentos & SER',
              '2. Espacio & ESTAR',
              '3. Tiempo & GUSTAR',
              '4. Rutinas & Ciudad',
              '5. Gastronomía & Fiesta'
            ];

            return (
              <button
                key={modNum}
                onClick={() => {
                  const targetCity = modCities.find(c => progress.unlockedCityIds.includes(c.id)) || modCities[0];
                  if (targetCity) {
                    setSelectedCityId(targetCity.id);
                    setSelectedLevelIdx(0);
                    if (stepperRef.current) {
                      const cardIndex = ALL_CITIES.findIndex(c => c.id === targetCity.id);
                      stepperRef.current.scrollTo({ left: cardIndex * 280, behavior: 'smooth' });
                    }
                  }
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isCurrentMod
                    ? 'bg-[#24140E] text-white border-[#24140E] shadow-md ring-2 ring-[#E05615]'
                    : isModComplete
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    : isModUnlocked
                    ? 'bg-white text-[#24140E] border-[#E0D5C7] hover:border-[#E05615]'
                    : 'bg-white/50 text-slate-400 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-0.5">
                  <span className={isCurrentMod ? 'text-amber-400' : 'text-[#8C7A6B]'}>
                    MÓDULO {modNum}
                  </span>
                  <span>{isModComplete ? '✅ 3/3' : isModUnlocked ? `${completedModCities}/3` : '🔒'}</span>
                </div>
                <div className="font-bold text-xs truncate">
                  {moduleShortNames[modNum - 1]}
                </div>
                <div className="text-[10px] opacity-75 truncate mt-0.5">
                  {modCities.map(c => c.name).join(' • ')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sand-Toned Stepper Card Track Container */}
        <div className="relative rounded-[2rem] bg-[#F2ECE1] border-2 border-[#DDD3C4] p-4 sm:p-6 shadow-inner overflow-hidden">
          
          {/* Dashed Transit Guide Line behind cards */}
          <div className="absolute top-[48%] left-10 right-10 h-0.5 border-t-2 border-dashed border-[#CBBBA8] z-0 pointer-events-none hidden sm:block" />

          {/* Horizontal Scrollable Track */}
          <div 
            ref={stepperRef}
            className="flex items-center space-x-4 sm:space-x-5 overflow-x-auto scrollbar-none scroll-smooth relative z-10 py-1"
          >
            {ALL_CITIES.map((city, idx) => {
              const isUnlocked = progress.unlockedCityIds.includes(city.id);
              const isSelected = selectedCityId === city.id;
              const isBossDone = Boolean(progress.completedBosses[city.id]?.passed);
              const completedCount = city.levels.filter(l => Boolean(progress.completedLevels[l.id])).length;
              const isCompleted = completedCount === 10;
              const photo = CITY_EDITORIAL_PHOTOS[city.id] || CITY_EDITORIAL_PHOTOS.madrid;
              const subtitle = CITY_STEPPER_SUBTITLES[city.id] || city.landmark;
              const cityModulePos = ((city.number - 1) % 3) + 1; // 1, 2, or 3
              const isModuleMilestone = cityModulePos === 3;

              const badgeColors = [
                'bg-[#E05615] text-white',
                'bg-[#2563EB] text-white',
                'bg-[#0D9488] text-white',
                'bg-[#991B1B] text-white'
              ][idx % 4];

              return (
                <div
                  key={city.id}
                  onClick={() => {
                    setSelectedCityId(city.id);
                    const firstUnfinished = city.levels.findIndex(lvl => !progress.completedLevels[lvl.id]);
                    setSelectedLevelIdx(firstUnfinished !== -1 ? firstUnfinished : 0);
                    // Only launch if city is already unlocked!
                    if (isUnlocked && isSelected) {
                      if (idx === 0) {
                        onStartJourney();
                      } else {
                        onSelectCityPath(city.id);
                      }
                    }
                  }}
                  className={`shrink-0 w-64 sm:w-72 rounded-2xl bg-white overflow-hidden border-2 transition-all duration-300 shadow-md group ${
                    isSelected 
                      ? 'border-[#E05615] ring-4 ring-[#E05615]/20 scale-102' 
                      : 'border-transparent hover:border-[#D0C2B0]'
                  } ${!isUnlocked ? 'cursor-pointer opacity-90' : 'cursor-pointer'}`}
                >
                  {/* Card Photo Header */}
                  <div 
                    className="relative h-40 p-3 flex flex-col justify-between"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%), url(${photo})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {/* Top Row: City Number Badge + Module Indicator + Status Icon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md ${badgeColors}`}>
                          {city.number}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-black/60 text-amber-300 text-[10px] font-black tracking-wider uppercase backdrop-blur-xs">
                          M{city.moduleIndex} ({cityModulePos}/3)
                        </span>
                      </div>

                      {isBossDone || isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : !isUnlocked ? (
                        <div className="w-6 h-6 rounded-full bg-slate-900/80 text-amber-400 flex items-center justify-center backdrop-blur-xs border border-slate-700">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                          ACTUAL
                        </div>
                      )}
                    </div>

                    {/* Bottom: City Title, Module Milestone Pill and Subtitle */}
                    <div>
                      {isModuleMilestone && (
                        <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black uppercase mb-1 shadow">
                          <span>🏆</span>
                          <span>HITO FINAL MÓDULO {city.moduleIndex}</span>
                        </div>
                      )}
                      <h4 className="text-white font-black text-xl font-serif drop-shadow leading-tight">
                        {city.name}
                      </h4>
                      <p className="text-slate-200 text-xs font-medium drop-shadow truncate mt-0.5">
                        {subtitle}
                      </p>
                    </div>

                    {/* Locked Vignette Overlay */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                        <div className="px-3 py-1.5 rounded-full bg-slate-900/90 text-slate-200 border border-slate-700 text-xs font-black flex items-center space-x-1.5 shadow-xl">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>BLOQUEADA</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Button - Strictly Non-Clickable When Locked */}
                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (idx === 0) {
                          onStartJourney();
                        } else {
                          onSelectCityPath(city.id);
                        }
                      }}
                      className="w-full px-4 py-3 bg-white hover:bg-orange-50/50 flex items-center justify-between text-xs font-black text-[#E05615] transition-colors cursor-pointer border-t border-[#F2ECE1]"
                    >
                      <span>
                        {idx === 0 ? 'START HERE' : 'EXPLORE CITY'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-[#E05615]" />
                    </button>
                  ) : (
                    <div
                      className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-400 border-t border-[#F2ECE1] cursor-not-allowed select-none"
                      title="Completa la ciudad anterior y derrota a su jefe para desbloquear."
                    >
                      <span className="flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>BLOQUEADO</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Completa Ciudad {city.number - 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. TWO-COLUMN LAYOUT: MISSION CARD + MEET CAMINO (Exact match to Image 2)
          ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          
          {/* ======================================================
              LEFT COLUMN: MISSION 01 CARD (Exact match to Image 2)
              ====================================================== */}
          <div className="lg:col-span-6 rounded-[2.5rem] bg-[#24140E] text-white p-7 sm:p-9 shadow-2xl relative overflow-hidden flex flex-col justify-between border-2 border-[#382318]">
            
            {/* Background Subtle Dot-Grid Pattern in Top Right */}
            <div className="absolute top-0 right-0 w-52 h-52 opacity-15 bg-[radial-gradient(#FAF7F2_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

            <div>
              {/* Header: Module Badge + Tag + Big Number Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#E05615] text-white text-[10px] font-black tracking-wider uppercase">
                    MÓDULO {selectedCity.moduleIndex} ({((selectedCity.number - 1) % 3) + 1}/3)
                  </span>
                  <span className="text-xs font-black tracking-[0.2em] uppercase text-[#E08A5B]">
                    MISSION {String(activeLevel.levelNumber).padStart(2, '0')}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center font-bold text-sm text-slate-300">
                  {String(activeLevel.levelNumber).padStart(2, '0')}
                </div>
              </div>

              {/* Syllabus Topic & City Mapping Indicator */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                  📍 {selectedCity.name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  📖 {activeLevel.syllabusTopic}
                </span>
                {selectedCity.number % 3 === 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
                    🏆 Cierre de Módulo {selectedCity.moduleIndex}
                  </span>
                )}
              </div>

              {/* Locked Notice if City is Not Unlocked */}
              {!isCityUnlocked && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-200 text-xs flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-amber-300 uppercase tracking-wider text-[11px] mb-0.5">
                      CIUDAD BLOQUEADA • MÓDULO {selectedCity.moduleIndex}
                    </h4>
                    <p className="text-amber-100/90 leading-relaxed">
                      Esta ciudad pertenece al Módulo {selectedCity.moduleIndex}. Para acceder a {selectedCity.name} y sus 10 misiones, primero debes completar las misiones y derrotar al jefe de la ciudad anterior.
                    </p>
                  </div>
                </div>
              )}

              {/* Mission Title */}
              <h3 className="text-3xl sm:text-4xl font-black font-serif tracking-tight leading-tight text-white mb-4">
                {activeLevel.title}
              </h3>

              {/* Mission Scenario / Description */}
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed mb-6">
                {activeLevel.description || `A stranger asks you where you are going. Choose the words that will get you through ${selectedCity.name}.`}
              </p>

              {/* Level Quick Selector (1 to 10 in current city) - Strictly locked sequentially */}
              <div className="flex items-center space-x-1.5 mb-6 overflow-x-auto py-1">
                {selectedCity.levels.map((lvl, lIdx) => {
                  const isDone = Boolean(progress.completedLevels[lvl.id]);
                  const isUnlocked = isCityUnlocked && (lIdx === 0 || Boolean(progress.completedLevels[selectedCity.levels[lIdx - 1]?.id]));
                  const isCurrent = lIdx === selectedLevelIdx;

                  return (
                    <button
                      key={lvl.id}
                      disabled={!isUnlocked}
                      onClick={() => {
                        if (isUnlocked) {
                          setSelectedLevelIdx(lIdx);
                        }
                      }}
                      className={`w-7 h-7 rounded-full font-black text-xs transition-transform flex items-center justify-center ${
                        !isUnlocked
                          ? 'bg-[#2E1B12] text-slate-600 cursor-not-allowed opacity-50 border border-white/5'
                          : isCurrent
                          ? 'bg-[#E05615] text-white scale-110 shadow'
                          : isDone
                          ? 'bg-emerald-600 text-white cursor-pointer'
                          : 'bg-[#382318] text-slate-300 hover:text-white cursor-pointer'
                      }`}
                      title={!isUnlocked ? `Nivel ${lvl.levelNumber} bloqueado (completa primero el nivel ${lvl.levelNumber - 1})` : `Nivel ${lvl.levelNumber}: ${lvl.title}`}
                    >
                      {!isUnlocked ? <Lock className="w-3 h-3 text-slate-500" /> : lvl.levelNumber}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Rewards + Action Button */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              
              {/* Rewards */}
              <div className="flex items-center space-x-3 text-xs sm:text-sm font-black text-[#F5C296]">
                <span className="flex items-center space-x-1">
                  <span>🪙</span>
                  <span>+{activeLevel.coinReward || 100}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 text-[#93C5FD]">
                  <span>✨</span>
                  <span>+{activeLevel.xpReward || 80} XP</span>
                </span>
              </div>

              {/* Play Mission Primary Button (Golden Amber Pill) */}
              <div className="flex items-center space-x-2">
                {(() => {
                  const isCurrentLevelUnlocked = isCityUnlocked && (selectedLevelIdx === 0 || Boolean(progress.completedLevels[selectedCity.levels[selectedLevelIdx - 1]?.id]));
                  const hasLives = (progress.stats.lives ?? 3) > 0;

                  if (!isCityUnlocked) {
                    return (
                      <>
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-full bg-white/5 text-slate-500 text-xs font-bold cursor-not-allowed border border-white/5"
                          title="Sendero bloqueado"
                        >
                          <Lock className="w-3.5 h-3.5 mr-1 inline" />
                          <span>Sendero 🔒</span>
                        </button>
                        <button
                          disabled
                          className="px-6 py-3 rounded-full bg-slate-800 text-slate-400 font-black text-sm flex items-center space-x-2 cursor-not-allowed border border-slate-700 select-none"
                          title="Completa la ciudad anterior para desbloquear esta misión"
                        >
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>Misión Bloqueada</span>
                        </button>
                      </>
                    );
                  }

                  if (!isCurrentLevelUnlocked) {
                    return (
                      <>
                        <button
                          onClick={() => onSelectCityPath(selectedCity.id)}
                          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                          title="Ver sendero completo"
                        >
                          Sendero 🛤️
                        </button>
                        <button
                          disabled
                          className="px-6 py-3 rounded-full bg-slate-800/90 text-amber-300 font-bold text-xs sm:text-sm flex items-center space-x-2 cursor-not-allowed border border-amber-500/30 select-none shadow-md"
                          title={`Completa el nivel anterior para desbloquear el Nivel ${activeLevel.levelNumber}`}
                        >
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>Nivel {activeLevel.levelNumber} Bloqueado</span>
                        </button>
                      </>
                    );
                  }

                  if (!hasLives) {
                    return (
                      <>
                        <button
                          onClick={() => onSelectCityPath(selectedCity.id)}
                          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                          title="Ver sendero completo"
                        >
                          Sendero 🛤️
                        </button>
                        <button
                          onClick={() => onPlayLevel(selectedCity.id, activeLevel.id)}
                          className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center space-x-2 cursor-pointer animate-pulse"
                          title="Sin vidas disponibles (0/3 ❤️). Haz clic para recargar o ver el temporizador"
                        >
                          <Heart className="w-4 h-4 fill-white text-white" />
                          <span>Sin Vidas (0/3) • Recargar</span>
                        </button>
                      </>
                    );
                  }

                  return (
                    <>
                      <button
                        onClick={() => onSelectCityPath(selectedCity.id)}
                        className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                        title="Ver sendero completo"
                      >
                        Sendero 🛤️
                      </button>
                      <button
                        onClick={() => onPlayLevel(selectedCity.id, activeLevel.id)}
                        className="px-6 py-3 rounded-full bg-[#F3B33D] hover:bg-[#F5BA31] text-[#24140E] font-black text-sm shadow-xl transition-transform hover:scale-105 active:scale-95 flex items-center space-x-2 cursor-pointer"
                      >
                        <span>Play mission</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ======================================================
              RIGHT COLUMN: MEET CAMINO AI GUIDE (Exact match to Image 2)
              ====================================================== */}
          <div className="lg:col-span-6 rounded-[2.5rem] bg-white border-2 border-[#E8DFD5] p-7 sm:p-9 shadow-xl flex flex-col justify-between">
            
            {/* Header: Bot Icon + Title + AI Guide Pill */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E8DD]">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF3E8] border border-[#FAD9C0] flex items-center justify-center text-2xl shadow-xs">
                  🤖
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-black text-lg text-[#24140E] font-serif">
                      Camino AI
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Profesor de Español</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6B60] font-medium">
                    Tu profesor de español en vivo • Live AI Spanish Teacher
                  </p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-[#E05615]" />
            </div>

            {/* Conversation Feed */}
            <div 
              ref={chatScrollRef}
              className="py-4 space-y-3.5 max-h-[290px] overflow-y-auto scrollbar-none pr-1"
            >
              {messages.map(msg => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="px-4 py-2 rounded-2xl bg-[#24140E] text-white text-xs sm:text-sm font-semibold max-w-[80%] shadow-xs">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-[#FDF8F2] border border-[#EFE5D9] text-xs sm:text-sm text-[#382318] max-w-[92%] shadow-xs space-y-2">
                      <p className="font-semibold text-[#24140E]">
                        {msg.text}
                      </p>

                      {/* Spanish Grammar Coach & Fault Finder Notice */}
                      {msg.correctionNotice && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 shadow-xs flex items-start space-x-2">
                          <span className="text-base leading-none">🔍</span>
                          <div>
                            <span className="font-extrabold uppercase text-[10px] tracking-wide text-amber-800 block mb-0.5">
                              Spanish Coach • Fault Correction
                            </span>
                            <p className="leading-snug text-slate-800">{msg.correctionNotice}</p>
                          </div>
                        </div>
                      )}

                      {/* Pure Spanish Target Text with Pronunciation */}
                      {msg.spanishText && (
                        <div className="p-3 rounded-xl bg-white border border-[#EADFCF] shadow-xs space-y-1">
                          <div className="text-xs font-black text-[#E05615] whitespace-pre-line tracking-wide">
                            {msg.spanishText}
                          </div>
                          {msg.pronunciation && (
                            <div className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Say:</span>
                              <span className="italic text-slate-600">{msg.pronunciation}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* English Meaning / Explanation */}
                      {msg.englishText && (
                        <p className="text-xs text-[#6B584D] italic">
                          {msg.englishText}
                        </p>
                      )}

                      {/* Interactive Practice Challenge */}
                      {msg.practicePrompt && (
                        <button
                          type="button"
                          onClick={() => handleSendChat(msg.practicePrompt)}
                          className="w-full text-left p-2.5 rounded-xl bg-orange-50/80 hover:bg-orange-100 border border-orange-200/80 text-[11px] text-[#C9470C] font-semibold transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span>🎯</span>
                            <span className="truncate"><strong>Practice:</strong> {msg.practicePrompt}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE1]">
                        <span className="text-[10px] text-[#A89A8E]">Camino • Profesor de Español</span>
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                          <span>Gemini AI</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Live Loading Thinking Indicator */}
              {isCaminoLoading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="p-3.5 rounded-2xl bg-[#FFF6EE] border border-[#FAD9C0] text-xs text-[#E05615] flex items-center space-x-2.5 shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-[#E05615] animate-ping" />
                    <span className="font-bold">Camino está preparando tu lección en Gemini AI...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="pt-2">
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px] font-bold">
                <button
                  type="button"
                  disabled={isCaminoLoading}
                  onClick={() => handleSendChat('how do you say summer in espanol')}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F0E6D8] border border-[#E0D5C7] text-[#6B584D] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ☀️ Summer
                </button>
                <button
                  type="button"
                  disabled={isCaminoLoading}
                  onClick={() => handleSendChat('yo soy calor')}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  🔍 Check: &quot;yo soy calor&quot;
                </button>
                <button
                  type="button"
                  disabled={isCaminoLoading}
                  onClick={() => handleSendChat('How do I order coffee in a café?')}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F0E6D8] border border-[#E0D5C7] text-[#6B584D] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ☕ Order Coffee
                </button>
                <button
                  type="button"
                  disabled={isCaminoLoading}
                  onClick={() => handleSendChat('Where is the train station?')}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F0E6D8] border border-[#E0D5C7] text-[#6B584D] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  🚆 Train station
                </button>
                <button
                  type="button"
                  disabled={isCaminoLoading}
                  onClick={() => handleSendChat('Explain Ser vs Estar simply')}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F0E6D8] border border-[#E0D5C7] text-[#6B584D] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  💡 Ser vs Estar
                </button>
              </div>

              {/* Chat Input Bar */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center space-x-2 mt-1"
              >
                <input
                  type="text"
                  value={chatInput}
                  disabled={isCaminoLoading}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isCaminoLoading ? "Camino está respondiendo..." : "Ask Camino about Spanish, grammar or Spain..."}
                  className="grow px-4 py-3 rounded-full bg-[#FAF7F2] border border-[#E0D5C7] text-xs sm:text-sm text-[#24140E] placeholder-[#9E8E81] focus:outline-none focus:border-[#E05615] transition-colors disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isCaminoLoading || !chatInput.trim()}
                  className="w-10 h-10 rounded-full bg-[#24140E] hover:bg-[#3D251A] disabled:opacity-40 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0 shadow-sm"
                  title="Enviar"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
