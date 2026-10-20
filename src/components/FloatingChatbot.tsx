import React, { useState, useEffect, useRef } from 'react';
import { useGame, ActiveQuizState } from '../context/GameContext';
import { askCaminoGemini, CaminoResponse, CaminoContext } from '../services/geminiService';
import { speakSpanish } from '../services/spanishSpeechService';
import { getCityById } from '../data/citiesData';
import { 
  Bot, 
  Send, 
  X, 
  Minus, 
  Volume2, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  BookOpen,
  HelpCircle,
  GripHorizontal
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  spanishText?: string;
  pronunciation?: string;
  englishText?: string;
  correctionNotice?: string;
  practicePrompt?: string;
  timestamp: string;
  isReviewContext?: boolean;
  failed?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    sender: 'tutor',
    text: '¡Hola! Soy Camino, tu tutor personal de español en ¡Aventura Española! 🇪🇸',
    spanishText: '¿En qué puedo ayudarte hoy?',
    pronunciation: 'ehn keh PWEH-doh ah-yoo-DAHR-teh oy',
    englishText: 'How can I help you today? Ask me about Spanish words, grammar rules, verb conjugations, or pronunciation!',
    practicePrompt: 'Prueba a preguntarme: "¿Cómo se dice gracias en español?" o "¿Por qué ser vs estar?"',
    timestamp: 'Ahora'
  }
];

export interface FloatingChatbotProps {
  quizContextOverride?: ActiveQuizState | null;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ quizContextOverride }) => {
  const { 
    currentScreen, 
    currentUserEmail, 
    activeCityId, 
    activeLevelId, 
    activeQuizState: contextQuizState,
    progress 
  } = useGame();

  const activeQuizState = quizContextOverride !== undefined ? quizContextOverride : contextQuizState;

  // Screen exclusion rule: Never render on landing page / auth screen
  if (currentScreen === 'welcome' || currentScreen === 'auth' || !currentUserEmail) {
    return null;
  }

  // Quiz Lock evaluation (STRICT: Unanswered active quiz questions lock the tutor)
  const isQuizActive = Boolean(activeQuizState?.isActive);
  const isQuizAnswered = Boolean(activeQuizState?.isAnswered);
  const isLocked = isQuizActive && !isQuizAnswered;

  // Panel state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showLockedToast, setShowLockedToast] = useState<boolean>(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('camino_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MESSAGES;
  });

  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  // Dragging state for Picture-in-Picture window
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Persist messages in session
  useEffect(() => {
    try {
      sessionStorage.setItem('camino_chat_history', JSON.stringify(messages));
    } catch {
      // fallback
    }
  }, [messages]);

  // When question becomes active and unanswered, auto-minimize/hide chat and disable input
  useEffect(() => {
    if (isLocked) {
      if (isOpen && !isMinimized) {
        setIsMinimized(true);
      }
    }
  }, [isLocked, isOpen, isMinimized]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Draggable PiP handler
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header, ignore buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: dragStartRef.current.initialX + dx,
        y: dragStartRef.current.initialY + dy
      });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch drag support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: dragStartRef.current.initialX + dx,
        y: dragStartRef.current.initialY + dy
      });
    };

    const handleTouchEnd = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Send message
  const handleSendMessage = async (customText?: string) => {
    // STRICT LOCK CHECK: Never send or process if locked!
    if (isLocked) {
      triggerLockedToast();
      return;
    }

    const query = (customText ?? inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isReviewContext: Boolean(isQuizActive && isQuizAnswered)
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setLastFailedQuery(null);

    // Build pedagogical context
    const currentCity = activeCityId ? getCityById(activeCityId) : null;
    const context: CaminoContext = {
      cityName: activeQuizState?.cityName || currentCity?.name || 'España',
      cityId: activeCityId || undefined,
      playerName: progress.profile?.displayName || progress.profile?.character?.name || 'Estudiante',
      streak: progress.stats?.streak || 1,
      syllabusTopic: activeQuizState?.syllabusTopic,
      levelTitle: activeQuizState?.levelTitle
    };

    // ONLY provide review question & submitted answer context if question was SUBMITTED (Never prior!)
    if (isQuizActive && isQuizAnswered && activeQuizState) {
      context.questionPrompt = activeQuizState.questionPrompt;
      context.submittedAnswer = activeQuizState.submittedAnswer;
      context.isCorrect = activeQuizState.isCorrect;
      context.explanation = activeQuizState.explanation;
    }

    try {
      const response: CaminoResponse = await askCaminoGemini(query, context);

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: response.text,
        spanishText: response.spanishText,
        pronunciation: response.pronunciation,
        englishText: response.englishText,
        correctionNotice: response.correctionNotice,
        practicePrompt: response.practicePrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isReviewContext: Boolean(isQuizActive && isQuizAnswered)
      };

      setMessages(prev => [...prev, tutorMsg]);
    } catch {
      setLastFailedQuery(query);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'tutor',
        text: '¡Vaya! Hubo un problema al conectar con el servicio. ¿Quieres intentarlo de nuevo?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        failed: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLocked) {
        handleSendMessage();
      } else {
        triggerLockedToast();
      }
    }
  };

  const triggerLockedToast = () => {
    setShowLockedToast(true);
    setTimeout(() => setShowLockedToast(false), 3000);
  };

  const handleIconClick = () => {
    if (isLocked) {
      triggerLockedToast();
      return;
    }

    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else if (isMinimized) {
      setIsMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setIsMinimized(true);
    }
  };

  const currentCity = activeCityId ? getCityById(activeCityId) : null;
  const locationLabel = activeQuizState?.levelTitle || (currentCity ? `${currentCity.name}` : 'España');

  return (
    <>
      {/* Toast alert when clicking while locked */}
      {showLockedToast && (
        <div 
          data-testid="locked-toast"
          className="fixed bottom-36 right-6 z-50 bg-[#24140E] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-amber-500/40 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-bounce"
        >
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>🔒 Consulta al tutor bloqueada durante la pregunta activa. ¡Responde primero!</span>
        </div>
      )}

      {/* Floating Picture-in-Picture Chat Panel */}
      {isOpen && (
        <div
          data-testid="pip-chatbot-window"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className={`fixed bottom-24 right-5 sm:bottom-24 sm:right-6 z-50 w-[92vw] max-w-[390px] sm:max-w-[420px] bg-[#FAF7F2] border-2 ${
            isLocked ? 'border-amber-400/80' : isQuizActive && isQuizAnswered ? 'border-emerald-500' : 'border-[#E0D5C7]'
          } rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans transition-all duration-200 ${
            isMinimized ? 'h-14 overflow-hidden' : 'h-[520px] max-h-[78vh]'
          }`}
        >
          {/* Draggable PiP Header */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`px-4 py-3 cursor-grab active:cursor-grabbing select-none flex items-center justify-between border-b ${
              isLocked 
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-700' 
                : isQuizActive && isQuizAnswered
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-700'
                : 'bg-gradient-to-r from-[#C2410C] to-[#E05615] text-white border-[#A33408]'
            }`}
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                {isLocked ? (
                  <Lock className="w-4 h-4 text-amber-200" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight truncate">Camino • Tutor IA</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] text-white/80 font-medium truncate flex items-center space-x-1">
                  <span>📍 {locationLabel}</span>
                  {isQuizActive && isQuizAnswered && (
                    <span className="bg-emerald-800/80 px-1.5 py-0.2 rounded-full text-[9px] font-bold">Modo Revisión</span>
                  )}
                </p>
              </div>
            </div>

            {/* Window control buttons */}
            <div className="flex items-center space-x-1 shrink-0">
              <GripHorizontal className="w-4 h-4 text-white/50 mr-1 hidden sm:block" />
              <button
                data-testid="minimize-chatbot-btn"
                onClick={() => setIsMinimized(prev => !prev)}
                title={isMinimized ? 'Expandir' : 'Minimizar'}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                data-testid="close-chatbot-btn"
                onClick={() => setIsOpen(false)}
                title="Cerrar ventana"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <>
              {/* Context Warning / Review Banner */}
              {isLocked ? (
                <div 
                  data-testid="quiz-locked-indicator"
                  className="bg-amber-100 border-b border-amber-300 px-3.5 py-2 text-xs text-amber-900 font-semibold flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>🔒 Tutor bloqueado durante la pregunta activa. Responde para consultar dudas.</span>
                </div>
              ) : isQuizActive && isQuizAnswered ? (
                <div 
                  data-testid="quiz-review-indicator"
                  className="bg-emerald-100 border-b border-emerald-300 px-3.5 py-2 text-xs text-emerald-950 font-semibold flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>✓ Modo Revisión activo: Pregunta a Camino por qué fue correcta o tus dudas de gramática.</span>
                </div>
              ) : null}

              {/* Scrollable Conversation Area */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#FAF7F2]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 shadow-xs text-xs sm:text-sm ${
                        msg.sender === 'user'
                          ? 'bg-[#E05615] text-white rounded-br-xs'
                          : 'bg-white border border-[#E0D5C7] text-[#24140E] rounded-bl-xs'
                      }`}
                    >
                      {/* Teacher primary text */}
                      <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>

                      {/* Spanish phrase box with audio playback */}
                      {msg.spanishText && (
                        <div className="mt-2 p-2 bg-[#F6F0E6] border border-[#E6DAC8] rounded-xl flex items-start justify-between space-x-2 text-[#24140E]">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2410C]">Español</span>
                            <p className="font-bold text-xs sm:text-sm text-[#8B2500] leading-snug">{msg.spanishText}</p>
                            {msg.pronunciation && (
                              <p className="text-[10px] text-[#7A6B60] italic">🗣 {msg.pronunciation}</p>
                            )}
                          </div>
                          <button
                            onClick={() => msg.spanishText && speakSpanish(msg.spanishText)}
                            title="Escuchar pronunciación en español"
                            className="p-1.5 rounded-lg bg-white hover:bg-amber-100 text-[#C2410C] shadow-xs transition hover:scale-110 cursor-pointer shrink-0"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* English explanation */}
                      {msg.englishText && (
                        <p className="mt-1.5 text-xs text-[#52443B] bg-white/70 p-1.5 rounded-lg border border-[#EFE5D8]">
                          💡 <span className="font-medium">{msg.englishText}</span>
                        </p>
                      )}

                      {/* Grammar correction notice if student made a typo */}
                      {msg.correctionNotice && (
                        <div className="mt-1.5 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-1.5 rounded-lg flex items-start space-x-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span><strong>Corrección:</strong> {msg.correctionNotice}</span>
                        </div>
                      )}

                      {/* Practice challenge prompt */}
                      {msg.practicePrompt && (
                        <div className="mt-2 text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                          🎯 <strong>Reto:</strong> {msg.practicePrompt}
                        </div>
                      )}

                      {/* Failed retry button */}
                      {msg.failed && lastFailedQuery && (
                        <button
                          onClick={() => handleSendMessage(lastFailedQuery)}
                          className="mt-2 px-3 py-1 bg-[#E05615] text-white rounded-lg text-xs font-bold flex items-center space-x-1 hover:bg-[#C2410C] transition cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reintentar</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-[#A89A8E] mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Loading typing indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-2 bg-white border border-[#E0D5C7] rounded-2xl p-2.5 max-w-[200px] shadow-xs">
                    <Bot className="w-4 h-4 text-[#E05615] animate-spin" />
                    <span className="text-xs text-[#7A6B60] font-medium animate-pulse">Camino está pensando...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestion chips (Contextual) */}
              <div className="px-3 py-1.5 bg-[#F2ECE1] border-t border-[#E6DAC8] flex items-center space-x-1.5 overflow-x-auto text-[11px] no-scrollbar">
                {isQuizActive && isQuizAnswered ? (
                  <>
                    <button
                      disabled={isLocked || isLoading}
                      onClick={() => handleSendMessage('¿Por qué es correcta o incorrecta mi respuesta?')}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      ¿Por qué mi respuesta?
                    </button>
                    <button
                      disabled={isLocked || isLoading}
                      onClick={() => handleSendMessage('Explícame la regla gramatical de esta pregunta')}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      Explica la regla
                    </button>
                    <button
                      disabled={isLocked || isLoading}
                      onClick={() => handleSendMessage('Dame otro ejemplo similar')}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      Otro ejemplo
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={isLocked || isLoading}
                      onClick={() => handleSendMessage('¿Cuál es la diferencia entre ser y estar?')}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#FAF7F2] border border-[#E0D5C7] text-[#52443B] font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      Ser vs Estar
                    </button>
                    <button
                      disabled={isLocked || isLoading}
                      onClick={() => handleSendMessage('¿Cómo se dice "Where is the train station" en español?')}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#FAF7F2] border border-[#E0D5C7] text-[#52443B] font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      ¿Dónde está la estación?
                    </button>
                    <button
                      disabled={isLocked || isLoading}
                      onClick={() => handleSendMessage('Dame un consejo para conjugar verbos regulares')}
                      className="px-2.5 py-1 rounded-full bg-white hover:bg-[#FAF7F2] border border-[#E0D5C7] text-[#52443B] font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      Verbos regulares
                    </button>
                  </>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-[#EADFCF] flex items-center space-x-2">
                <input
                  ref={inputRef}
                  data-testid="chatbot-input"
                  type="text"
                  disabled={isLocked || isLoading}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isLocked 
                      ? '🔒 Responde la pregunta para consultar...' 
                      : 'Pregunta sobre vocabulario o gramática...'
                  }
                  className="flex-1 bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#24140E] placeholder:text-[#94877D] focus:outline-hidden focus:border-[#E05615] focus:ring-1 focus:ring-[#E05615] disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                />
                <button
                  data-testid="chatbot-send-btn"
                  disabled={isLocked || isLoading || !inputValue.trim()}
                  onClick={() => handleSendMessage()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#C2410C] to-[#E05615] hover:from-[#A33408] hover:to-[#C2410C] text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  title={isLocked ? 'Bloqueado durante pregunta activa' : 'Enviar mensaje'}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Chatbot Trigger Button (Fixed near bottom-right) */}
      <div 
        className="fixed bottom-20 right-5 sm:bottom-20 sm:right-6 z-40 select-none"
        title={isLocked ? '🔒 Consulta al tutor bloqueada durante la pregunta activa' : 'Pregunta al tutor Camino (IA)'}
      >
        <button
          data-testid="floating-chatbot-btn"
          aria-label={isLocked ? 'Tutor bloqueado' : 'Pregunta al tutor Camino'}
          aria-disabled={isLocked}
          onClick={handleIconClick}
          className={`relative group p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 transform cursor-pointer ${
            isLocked
              ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-200 border-2 border-amber-400/70 hover:scale-105 opacity-90'
              : 'bg-gradient-to-br from-[#C2410C] via-[#E05615] to-[#F59E0B] text-white border-2 border-amber-200/80 hover:scale-110 active:scale-95 hover:shadow-amber-500/30'
          }`}
        >
          {/* Subtle glow / pulse animation */}
          {!isLocked && (
            <span className="absolute -inset-1 rounded-full bg-amber-400/30 blur-sm group-hover:bg-amber-400/50 animate-pulse pointer-events-none" />
          )}

          {/* Icon: Lock or Robot Tutor */}
          <div className="relative flex items-center justify-center">
            {isLocked ? (
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-amber-100" />
            ) : (
              <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            )}
          </div>

          {/* Online green indicator badge */}
          {!isLocked && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow-xs animate-ping" />
          )}
          {!isLocked && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
          )}

          {/* Lock badge if locked */}
          {isLocked && (
            <span className="absolute -top-1 -right-1 bg-amber-900 border border-amber-300 text-[10px] text-amber-200 rounded-full px-1 font-bold shadow-xs">
              🔒
            </span>
          )}

          {/* Hover Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-3 py-1.5 bg-[#24140E] text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap pointer-events-none border border-amber-500/30 animate-fadeIn">
            <span>{isLocked ? '🔒 Tutor bloqueado en pregunta' : 'Pregunta al tutor Camino (IA)'}</span>
            <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#24140E]" />
          </div>
        </button>
      </div>
    </>
  );
};
