import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Check,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { speakSpanish, stopSpanishSpeech } from '../services/spanishSpeechService';
import { transcribeSpanishAudioWithGemini } from '../services/geminiService';
import {
  isAnyAudioInputSupported,
  isSpeechRecognitionSupported,
  startSpanishListening,
  stopSpanishListening,
  abortSpanishListening,
  startAudioRecordingSession,
  AudioRecordingSession,
  evaluateSpanishPronunciation,
  matchSpokenTextToQuizOptions,
  MatchedQuizOption,
  PronunciationEvaluation
} from '../services/spanishVoiceRecognitionService';
import {
  assessSpanishPronunciationWithAzure,
  createOfflineApproximationResult,
  AzureAssessmentResult,
  AzurePronunciationLocale,
  AzureWordAssessment
} from '../services/azurePronunciationService';

interface PronunciationTrainerModalProps {
  targetText: string;
  englishMeaning?: string;
  title?: string;
  options?: string[];
  onClose: () => void;
  onApplySpokenAnswer?: (spokenAnswer: string, evaluation?: PronunciationEvaluation) => void;
}

export const PronunciationTrainerModal: React.FC<PronunciationTrainerModalProps> = ({
  targetText,
  englishMeaning,
  title = 'Entrenador de Pronunciación Española',
  options,
  onClose,
  onApplySpokenAnswer
}) => {
  // Current active target text (can be toggled if options are present)
  const [activeTarget, setActiveTarget] = useState<string>(targetText);
  const [selectedLocale, setSelectedLocale] = useState<AzurePronunciationLocale>('es-ES');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [azureResult, setAzureResult] = useState<AzureAssessmentResult | null>(null);
  const [expandedWordIndex, setExpandedWordIndex] = useState<number | null>(null);
  const [detectedOption, setDetectedOption] = useState<MatchedQuizOption | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioVolumeLevel, setAudioVolumeLevel] = useState<number>(0);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // Cadence control: default to slow with distinct inter-word pauses
  const [isSlowMode, setIsSlowMode] = useState<boolean>(true);

  // Audio Mode: True on Edge/Brave/Firefox or if Web Speech fails with network error
  const [useAudioMode, setUseAudioMode] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      const isEdgeOrBrave = (navigator as any).brave ||
        navigator.userAgent.includes('Edg/') ||
        navigator.userAgent.includes('Brave');
      return Boolean(isEdgeOrBrave);
    }
    return false;
  });

  const isAudioSupported = isAnyAudioInputSupported();
  const sessionRef = useRef<AudioRecordingSession | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const isAssessingRef = useRef<boolean>(false);

  // Synchronize targetText if prop changes
  useEffect(() => {
    setActiveTarget(targetText);
  }, [targetText]);

  const stopAudioMonitor = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setAudioVolumeLevel(0);
    setRecordingSeconds(0);
  }, []);

  // Cleanup on unmount — strictly release all microphone tracks and stop speech
  useEffect(() => {
    return () => {
      abortSpanishListening();
      stopSpanishSpeech();
      stopAudioMonitor();
      if (sessionRef.current) {
        sessionRef.current.abort();
        sessionRef.current = null;
      }
    };
  }, [stopAudioMonitor]);

  // Listen to native model pronunciation with slow & distinct word pauses
  const handlePlayNativeAudio = useCallback((textToPlay: string = activeTarget) => {
    if (isPlayingAudio) {
      stopSpanishSpeech();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    speakSpanish(textToPlay, {
      rate: isSlowMode ? 0.72 : 0.84,
      pauseBetweenWords: isSlowMode,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  }, [activeTarget, isPlayingAudio, isSlowMode]);

  // Evaluates transcript against active target and detects quiz options
  const processCapturedTranscript = useCallback((transcript: string, confidence?: number) => {
    const trimmed = transcript.trim();
    if (!trimmed) return;

    lastTranscriptRef.current = trimmed;
    setSpokenTranscript(trimmed);

    // 1. Evaluate pronunciation against active phrase using local engine
    const evalResult = evaluateSpanishPronunciation(activeTarget, trimmed, confidence);
    setEvaluation(evalResult);

    // 2. Check if spoken text matches any quiz options or letter aliases
    if (options && options.length > 0) {
      const matched = matchSpokenTextToQuizOptions(trimmed, options);
      setDetectedOption(matched);
    }
  }, [activeTarget, options]);

  // Execute Azure Speech Pronunciation Assessment on recorded audio blob
  const runAzureAssessment = useCallback(async (audioBlob: Blob, fallbackTranscript: string) => {
    if (isAssessingRef.current) return;
    isAssessingRef.current = true;
    setIsAssessing(true);
    setErrorMessage(null);

    try {
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob,
        referenceText: activeTarget,
        locale: selectedLocale,
        spokenTranscriptFallback: fallbackTranscript
      });

      setAzureResult(result);

      const effectiveText = result.displayText || fallbackTranscript;
      if (effectiveText) {
        setSpokenTranscript(effectiveText);
        if (options && options.length > 0) {
          const matched = matchSpokenTextToQuizOptions(effectiveText, options);
          setDetectedOption(matched);
        }
      }

      // Keep local evaluation for backwards compatibility and phonetic tips
      const localEval = evaluateSpanishPronunciation(activeTarget, effectiveText || activeTarget);
      setEvaluation({
        ...localEval,
        overallScore: result.scores.pronunciationScore,
        accuracyPercent: result.scores.accuracyScore,
        isMatch: result.scores.pronunciationScore >= 65
      });

      if (result.recognitionStatus === 'InitialSilenceTimeout' || result.recognitionStatus === 'NoMatch') {
        setErrorMessage(result.guidance || 'No se detectó voz clara. Habla cerca del micrófono e inténtalo de nuevo.');
      }
    } catch (err) {
      console.warn('Azure assessment notice:', err);
      // Create safe fallback on unexpected client exception
      const fallback = createOfflineApproximationResult(activeTarget, fallbackTranscript || activeTarget, selectedLocale);
      setAzureResult(fallback);
    } finally {
      isAssessingRef.current = false;
      setIsAssessing(false);
    }
  }, [activeTarget, options, selectedLocale]);

  // Stop recording and process transcript from Azure, Web Speech, or Gemini
  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    stopAudioMonitor();
    stopSpanishListening();

    const activeSession = sessionRef.current;
    sessionRef.current = null;

    let audioBlob: Blob | null = null;
    if (activeSession) {
      try {
        audioBlob = await activeSession.stop();
      } catch (err) {
        console.warn('Error stopping audio recorder:', err);
      }
    }

    const liveTranscript = (lastTranscriptRef.current || spokenTranscript).trim();

    // If audio recording was captured, send to Azure AI Speech Assessment
    if (audioBlob && audioBlob.size > 800) {
      await runAzureAssessment(audioBlob, liveTranscript);
      return;
    }

    // Fallback if no audio blob but Web Speech transcript was captured
    if (liveTranscript.length > 0) {
      processCapturedTranscript(liveTranscript);
      const fallback = createOfflineApproximationResult(activeTarget, liveTranscript, selectedLocale);
      setAzureResult(fallback);
      return;
    }

    // If Web Speech produced no text, try Gemini fallback
    if (audioBlob && audioBlob.size > 400) {
      setIsTranscribing(true);
      try {
        const geminiResult = await transcribeSpanishAudioWithGemini(audioBlob, activeTarget, options);
        if (geminiResult && geminiResult.transcript) {
          processCapturedTranscript(geminiResult.transcript, geminiResult.confidence);
          await runAzureAssessment(audioBlob, geminiResult.transcript);
          setIsTranscribing(false);
          return;
        }
      } catch (err) {
        console.warn('Gemini transcription notice:', err);
      }
      setIsTranscribing(false);
    }

    // Grace period for speech recognizer
    setTimeout(() => {
      const finalTranscript = (lastTranscriptRef.current || spokenTranscript).trim();
      if (finalTranscript.length > 0) {
        processCapturedTranscript(finalTranscript);
      } else {
        setErrorMessage('No se detectó voz del micrófono. Habla claro cerca del micrófono o prueba escribir tu frase abajo.');
      }
    }, 350);
  }, [activeTarget, options, selectedLocale, stopAudioMonitor, processCapturedTranscript, runAzureAssessment, spokenTranscript]);

  // Start recording audio locally using MediaRecorder
  const startAudioRecordingFallback = useCallback(async () => {
    if (isAssessing) return; // Prevent concurrent requests
    stopSpanishListening();
    setErrorMessage(null);
    setSpokenTranscript('');
    setEvaluation(null);
    setAzureResult(null);
    setDetectedOption(null);
    lastTranscriptRef.current = '';

    try {
      const audioSession = await startAudioRecordingSession();
      sessionRef.current = audioSession;
      setIsRecording(true);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        setAudioVolumeLevel(audioSession.getVolume());
        if (elapsed >= 10) {
          handleStopRecording();
        }
      }, 1000);
    } catch (err: unknown) {
      setIsRecording(false);
      const errorObj = err as { name?: string; message?: string };
      console.warn('MediaRecorder notice:', err);
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        setErrorMessage('🔒 Permiso de micrófono bloqueado. Haz clic en el candado 🔒 en la barra de direcciones de tu navegador, cambia "Micrófono" a "Permitir" y vuelve a pulsar el botón.');
      } else {
        setErrorMessage('No se pudo acceder al micrófono. Verifica que esté conectado y permitido en tu navegador.');
      }
    }
  }, [handleStopRecording, isAssessing]);

  // Start voice capture session
  const handleStartRecording = useCallback(async () => {
    if (isAssessing) return; // Prevent concurrent requests
    setErrorMessage(null);
    setSpokenTranscript('');
    setEvaluation(null);
    setAzureResult(null);
    setDetectedOption(null);
    lastTranscriptRef.current = '';

    // If Audio Mode is selected or on Edge/Brave, use MediaRecorder directly!
    if (useAudioMode || !isSpeechRecognitionSupported()) {
      startAudioRecordingFallback();
      return;
    }

    // Otherwise use Web Speech API in Chrome
    const started = startSpanishListening({
      lang: selectedLocale,
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsRecording(true);
      },
      onResult: (transcript, _isFinal, confidence) => {
        if (transcript.trim().length > 0) {
          processCapturedTranscript(transcript, confidence);
        }
      },
      onError: (err) => {
        console.warn('SpeechRecognition notice, auto-switching to Audio Recording mode:', err);
        setUseAudioMode(true);
        startAudioRecordingFallback();
      },
      onEnd: () => {
        setIsRecording(false);
        stopAudioMonitor();
      }
    });

    if (started) {
      setIsRecording(true);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        setAudioVolumeLevel(Math.round(45 + Math.sin(elapsed * 4) * 30 + Math.cos(elapsed * 7) * 20));
        if (elapsed >= 12) {
          handleStopRecording();
        }
      }, 1000);
    } else {
      setUseAudioMode(true);
      startAudioRecordingFallback();
    }
  }, [isAssessing, selectedLocale, useAudioMode, handleStopRecording, processCapturedTranscript, startAudioRecordingFallback, stopAudioMonitor]);

  // Toggle button click
  const handleToggleListening = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [isRecording, handleStartRecording, handleStopRecording]);

  // Handles applying spoken answer or detected option
  const handleConfirmAnswer = (chosenText: string) => {
    if (onApplySpokenAnswer) {
      onApplySpokenAnswer(chosenText, evaluation || undefined);
    }
    onClose();
  };

  // Manual text testing handler
  const handleManualEval = (textToEval: string) => {
    const trimmed = textToEval.trim();
    if (!trimmed) {
      setEvaluation(null);
      setAzureResult(null);
      setDetectedOption(null);
      return;
    }

    processCapturedTranscript(trimmed);
    const approx = createOfflineApproximationResult(activeTarget, trimmed, selectedLocale);
    setAzureResult(approx);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-amber-50 to-orange-50/90 rounded-3xl border-3 border-amber-400 shadow-2xl p-6 text-slate-900 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-amber-200/60 text-slate-700 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center space-x-2 text-amber-700 text-xs font-black uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>{title}</span>
        </div>

        {/* Target Spanish Sentence Box */}
        <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-xs mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide block mb-1">
                Frase Objetivo (Target Phrase):
              </span>
              <p className="text-xl font-black text-slate-950 font-serif leading-snug">
                "{activeTarget}"
              </p>
              {englishMeaning && (
                <p className="text-xs text-slate-600 italic mt-1 font-medium">
                  Significado: {englishMeaning}
                </p>
              )}
            </div>

            {/* Audio Playback & Speed Controls */}
            <div className="flex flex-col items-center space-y-1.5 shrink-0">
              <button
                onClick={() => handlePlayNativeAudio(activeTarget)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center ${
                  isPlayingAudio
                    ? 'bg-amber-400 border-amber-600 text-slate-950 scale-105 shadow-md'
                    : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                }`}
                title="Escuchar modelo nativo de pronunciación"
              >
                <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsSlowMode(prev => !prev)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  isSlowMode
                    ? 'bg-amber-300 border-amber-500 text-amber-950 shadow-xs'
                    : 'bg-stone-100 border-stone-300 text-stone-600 hover:bg-stone-200'
                }`}
                title="Alternar entre pronunciación pausada palabra por palabra y velocidad normal"
              >
                {isSlowMode ? '🐢 Pausado' : '🗣️ Normal'}
              </button>
            </div>
          </div>
        </div>

        {/* Spanish Locale Selector */}
        <div className="mb-2.5 p-2.5 rounded-2xl bg-white/80 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-bold text-slate-800">Variante de Español:</span>
            <span className="text-[10px] text-amber-700 font-medium">(Azure Locale)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              data-testid="locale-es-ES-btn"
              onClick={() => setSelectedLocale('es-ES')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedLocale === 'es-ES'
                  ? 'bg-amber-400 border-amber-600 text-slate-950 shadow-xs font-black'
                  : 'bg-white hover:bg-amber-50 border-amber-200 text-slate-700'
              }`}
            >
              🇪🇸 España (es-ES)
            </button>
            <button
              type="button"
              data-testid="locale-es-MX-btn"
              onClick={() => setSelectedLocale('es-MX')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedLocale === 'es-MX'
                  ? 'bg-amber-400 border-amber-600 text-slate-950 shadow-xs font-black'
                  : 'bg-white hover:bg-amber-50 border-amber-200 text-slate-700'
              }`}
            >
              🇲🇽 México (es-MX)
            </button>
          </div>
        </div>

        {/* Quiz Multiple Choice Options Pills (if provided) */}
        {options && options.length > 0 && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-100/60 border border-amber-200">
            <span className="text-[11px] font-bold text-amber-900 block mb-1.5">
              💡 Opciones del cuestionario (pulsa para practicar o di tu respuesta en voz alta):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = activeTarget === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveTarget(opt);
                      if (spokenTranscript) {
                        handleManualEval(spokenTranscript);
                      }
                    }}
                    className={`p-2 rounded-xl text-xs font-bold text-left border flex items-center space-x-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 border-amber-600 text-slate-950 shadow-xs scale-101'
                        : 'bg-white hover:bg-amber-50 border-amber-200 text-slate-800'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                      {letter}
                    </span>
                    <span className="truncate">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode Selector */}
        <div className="flex items-center justify-center space-x-2 my-1">
          <button
            type="button"
            onClick={() => setUseAudioMode(false)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
              !useAudioMode
                ? 'bg-amber-300 border-amber-500 text-amber-950 font-black shadow-xs'
                : 'bg-white/80 border-amber-200 text-slate-600 hover:bg-amber-100'
            }`}
          >
            ⚡ Web Speech (Chrome)
          </button>
          <button
            type="button"
            onClick={() => setUseAudioMode(true)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
              useAudioMode
                ? 'bg-amber-400 border-amber-600 text-amber-950 font-black shadow-xs'
                : 'bg-white/80 border-amber-200 text-slate-600 hover:bg-amber-100'
            }`}
          >
            🎙️ Audio Grabado (Azure / Universal)
          </button>
        </div>

        {/* Recording / Voice Input Controls */}
        <div className="flex flex-col items-center justify-center my-2 space-y-2.5">
          <div className="relative flex items-center justify-center">
            <button
              onClick={handleToggleListening}
              disabled={isTranscribing || isAssessing}
              data-testid="pronunciation-mic-btn"
              className={`relative p-5 rounded-full border-4 transition-all duration-300 flex items-center justify-center shadow-xl cursor-pointer ${
                isRecording
                  ? 'bg-red-500 border-red-300 text-white animate-pulse scale-110 shadow-red-500/40'
                  : 'bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 border-amber-300 text-slate-950 hover:scale-105 shadow-amber-500/30'
              }`}
              title={isRecording ? 'Toca para finalizar y evaluar' : 'Toca para hablar en español'}
            >
              {isAssessing || isTranscribing ? (
                <Loader2 className="w-8 h-8 animate-spin text-slate-950" />
              ) : isRecording ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
              {isRecording && (
                <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75" />
              )}
            </button>
          </div>

          {/* Real-time Audio Volume Waveform */}
          {isRecording && (
            <div className="flex items-center space-x-1.5 py-0.5 animate-fadeIn">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                ● Grabando ({recordingSeconds}s):
              </span>
              <div className="flex items-center space-x-1 h-5">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
                  const h = Math.max(4, Math.min(20, Math.round(audioVolumeLevel * (0.35 + (bar % 3) * 0.35))));
                  return (
                    <div
                      key={bar}
                      className="w-1.5 rounded-full bg-gradient-to-t from-red-500 to-amber-500 transition-all duration-75"
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <span className="text-xs font-bold text-slate-800 text-center">
            {isAssessing
              ? '☁️ Evaluando pronunciación con Azure AI Speech...'
              : isTranscribing
              ? '🤖 Procesando audio con IA Camino...'
              : isRecording
              ? (useAudioMode
                  ? '🔴 Grabando tu audio... Di tu respuesta y pulsa para evaluar.'
                  : '🔴 Escuchando... Di tu frase o respuesta.')
              : (useAudioMode
                  ? 'Toca el micrófono para grabar y evaluar con Azure Speech'
                  : 'Toca el micrófono para hablar en español')}
          </span>
        </div>

        {/* Error message or network speech fallback */}
        {errorMessage && (
          <div className="p-3.5 mb-2.5 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-slate-800 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-amber-950 block">{errorMessage}</span>
                {options && options.length > 0 && (
                  <span className="text-[11px] text-amber-800 font-medium block mt-1">
                    👉 Puedes pulsar sobre la opción deseada para responder directamente:
                  </span>
                )}
              </div>
            </div>

            {/* Direct fallback to Audio Recording button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setUseAudioMode(true);
                  startAudioRecordingFallback();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md cursor-pointer active:scale-95 transition-all"
              >
                <Mic className="w-4 h-4 text-slate-950" />
                <span>🎙️ Hablar ahora con Grabación de Audio Directa</span>
              </button>
            </div>

            {/* Quick Answer Option Buttons */}
            {options && options.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleConfirmAnswer(opt)}
                      className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border-2 border-amber-300 hover:border-emerald-500 text-slate-900 font-bold text-xs flex items-center space-x-2 transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                        {letter}
                      </span>
                      <span className="truncate">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live / Spoken Transcript Display */}
        {spokenTranscript && (
          <div className="p-3 mb-2.5 rounded-2xl bg-white/90 border border-amber-200 text-slate-900 text-sm animate-fadeIn">
            <span className="text-[10px] font-black text-amber-800 uppercase block mb-0.5">
              Lo que hemos detectado (You said):
            </span>
            <p className="font-semibold text-slate-900 italic">"{spokenTranscript}"</p>
          </div>
        )}

        {/* Detected Quiz Option Match Card */}
        {detectedOption && (
          <div className="p-3.5 mb-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                {detectedOption.letter}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 block">
                  🎯 Opción detectada por voz:
                </span>
                <span className="font-black text-sm text-emerald-950">
                  {detectedOption.matchedOption}
                </span>
              </div>
            </div>
            {onApplySpokenAnswer && (
              <button
                type="button"
                onClick={() => handleConfirmAnswer(detectedOption.matchedOption)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar [{detectedOption.letter}]</span>
              </button>
            )}
          </div>
        )}

        {/* Manual Test / Typing input (Always easily accessible) */}
        <div className="mb-2.5 p-3 rounded-2xl bg-white/70 border border-amber-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-700">
              ¿Prefieres escribir o probar texto?
            </span>
            <button
              type="button"
              onClick={() => {
                setSpokenTranscript(activeTarget);
                handleManualEval(activeTarget);
              }}
              className="text-[10px] text-amber-800 font-bold underline hover:text-amber-950 cursor-pointer"
            >
              Copiar frase objetivo
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              data-testid="pronunciation-manual-input"
              type="text"
              placeholder="Escribe tu frase en español..."
              value={spokenTranscript}
              onChange={(e) => {
                const val = e.target.value;
                setSpokenTranscript(val);
                if (val.trim()) {
                  handleManualEval(val);
                } else {
                  setEvaluation(null);
                  setAzureResult(null);
                  setDetectedOption(null);
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              data-testid="pronunciation-eval-btn"
              onClick={() => {
                if (spokenTranscript.trim()) {
                  handleManualEval(spokenTranscript);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Evaluar
            </button>
          </div>
        </div>

        {/* ========================================================
            AZURE AI SPEECH PRONUNCIATION ASSESSMENT RESULTS
            ======================================================== */}
        {azureResult && (
          <div className="space-y-3 pt-2 border-t border-amber-200 animate-fadeIn" data-testid="azure-assessment-results">
            {/* Header with Provider Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                Evaluación Fonética
              </span>
              {azureResult.isRealAzure ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px] border border-blue-300 flex items-center space-x-1 shadow-xs">
                  <Cloud className="w-3 h-3 text-blue-600" />
                  <span>Azure AI Speech ({azureResult.locale})</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                  ⚡ Modo Local (Aproximación de texto)
                </span>
              )}
            </div>

            {/* Comprehensive Scores Grid (PronScore, Accuracy, Fluency, Completeness) */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-center shadow-xs">
                <span className="text-[10px] text-slate-600 font-bold block uppercase">Pronunciación</span>
                <span className="text-lg font-black text-amber-900 font-mono">
                  {azureResult.scores.pronunciationScore}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-center shadow-xs">
                <span className="text-[10px] text-slate-600 font-bold block uppercase">Precisión</span>
                <span className="text-lg font-black text-emerald-800 font-mono">
                  {azureResult.scores.accuracyScore}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-center shadow-xs">
                <span className="text-[10px] text-slate-600 font-bold block uppercase">Fluidez</span>
                <span className="text-lg font-black text-blue-800 font-mono">
                  {azureResult.scores.fluencyScore}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-center shadow-xs">
                <span className="text-[10px] text-slate-600 font-bold block uppercase">Completitud</span>
                <span className="text-lg font-black text-purple-800 font-mono">
                  {azureResult.scores.completenessScore}%
                </span>
              </div>
            </div>

            {/* Word-by-Word Breakdown with Azure ErrorType and Expandable Phonemes */}
            {azureResult.words && azureResult.words.length > 0 && (
              <div className="p-3 rounded-2xl bg-white border border-amber-200 space-y-2">
                <span className="text-[10px] font-black text-amber-800 uppercase block">
                  Desglose de palabras y fonemas (pulsa para ver fonemas):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {azureResult.words.map((w: AzureWordAssessment, idx: number) => {
                    const isGood = w.accuracyScore >= 80 && w.errorType === 'None';
                    const isNear = w.accuracyScore >= 60 || w.errorType === 'Mispronunciation';
                    const isExpanded = expandedWordIndex === idx;
                    const hasPhonemes = Boolean(w.phonemes && w.phonemes.length > 0);

                    return (
                      <div key={idx} className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            if (hasPhonemes) {
                              setExpandedWordIndex(isExpanded ? null : idx);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                            isGood
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 hover:bg-emerald-100'
                              : isNear
                              ? 'bg-amber-50 border-amber-400 text-amber-950 hover:bg-amber-100'
                              : 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100'
                          }`}
                          title={`Precisión: ${w.accuracyScore}% | Error: ${w.errorType}`}
                        >
                          <span>{w.word}</span>
                          <span className="font-mono text-[10px] opacity-80">{w.accuracyScore}%</span>
                          {w.errorType !== 'None' && (
                            <span className="text-[9px] uppercase px-1 rounded bg-rose-200 text-rose-800 font-black">
                              {w.errorType}
                            </span>
                          )}
                          {hasPhonemes && (
                            isExpanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />
                          )}
                        </button>

                        {/* Expandable Phoneme Scores */}
                        {isExpanded && w.phonemes && (
                          <div className="mt-1 p-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-mono flex flex-wrap gap-1 animate-fadeIn">
                            {w.phonemes.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className={`px-1.5 py-0.5 rounded ${
                                  p.accuracyScore >= 80 ? 'bg-emerald-700' : p.accuracyScore >= 60 ? 'bg-amber-600' : 'bg-rose-700'
                                }`}
                              >
                                /{p.phoneme}/: {p.accuracyScore}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Offline Fallback Guidance Notice */}
            {!azureResult.isRealAzure && (
              <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-300 text-[11px] text-amber-900">
                <span className="font-bold block">💡 Nota sobre modo local:</span>
                <span>
                  {azureResult.guidance || 'Evaluación local aproximada. Para activar la evaluación acústica nativa, configura AZURE_SPEECH_KEY en el servidor.'}
                </span>
              </div>
            )}

            {/* Phonetic Coaching Tips from Camino */}
            {evaluation && evaluation.phoneticTips && evaluation.phoneticTips.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-100/70 border border-amber-300 text-xs text-amber-950 space-y-1">
                <span className="font-bold flex items-center space-x-1 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                  <span>Consejos del Tutor Camino:</span>
                </span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] font-medium leading-relaxed">
                  {evaluation.phoneticTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={handleToggleListening}
                disabled={isAssessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Detener grabación' : 'Repetir intento'}</span>
              </button>

              {onApplySpokenAnswer && (
                <button
                  onClick={() => handleConfirmAnswer(detectedOption ? detectedOption.matchedOption : (spokenTranscript || activeTarget))}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Respuesta</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer cancel button */}
        <div className="pt-3 text-center">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
