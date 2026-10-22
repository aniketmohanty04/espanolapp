import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { speakSpanish, stopSpanishSpeech } from '../services/spanishSpeechService';
import {
  isSpeechRecognitionSupported,
  startSpanishListening,
  stopSpanishListening,
  evaluateSpanishPronunciation,
  requestMicrophonePermission,
  createAudioVolumeAnalyzer,
  AudioVolumeAnalyzer,
  PronunciationEvaluation
} from '../services/spanishVoiceRecognitionService';

interface PronunciationTrainerModalProps {
  targetText: string;
  englishMeaning?: string;
  title?: string;
  onClose: () => void;
  onApplySpokenAnswer?: (spokenAnswer: string, evaluation: PronunciationEvaluation) => void;
}

export const PronunciationTrainerModal: React.FC<PronunciationTrainerModalProps> = ({
  targetText,
  englishMeaning,
  title = 'Entrenador de Pronunciación Española',
  onClose,
  onApplySpokenAnswer
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<PronunciationEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioVolumeLevel, setAudioVolumeLevel] = useState<number>(0);

  // Cadence control: default to slow with distinct inter-word pauses
  const [isSlowMode, setIsSlowMode] = useState<boolean>(true);

  const isSupported = isSpeechRecognitionSupported();
  const volumeAnalyzerRef = useRef<AudioVolumeAnalyzer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef<string>('');

  const stopVolumeMonitor = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (volumeAnalyzerRef.current) {
      volumeAnalyzerRef.current.stop();
      volumeAnalyzerRef.current = null;
    }
    setAudioVolumeLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpanishListening();
      stopSpanishSpeech();
      stopVolumeMonitor();
    };
  }, [stopVolumeMonitor]);

  // Listen to native model pronunciation with optional slow & distinct word pauses
  const handlePlayNativeAudio = useCallback(() => {
    if (isPlayingAudio) {
      stopSpanishSpeech();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    speakSpanish(targetText, {
      rate: isSlowMode ? 0.72 : 0.84,
      pauseBetweenWords: isSlowMode,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  }, [targetText, isPlayingAudio, isSlowMode]);

  // Toggle voice capture with explicit mic permissions and live volume visualization
  const handleToggleListening = useCallback(async () => {
    if (isRecording) {
      stopSpanishListening();
      stopVolumeMonitor();
      setIsRecording(false);
      if (lastTranscriptRef.current.trim().length > 0) {
        const evalResult = evaluateSpanishPronunciation(targetText, lastTranscriptRef.current);
        setEvaluation(evalResult);
      }
      return;
    }

    setErrorMessage(null);
    setSpokenTranscript('');
    setEvaluation(null);
    lastTranscriptRef.current = '';

    // Step 1: Ensure explicit browser mic permission
    const permResult = await requestMicrophonePermission();
    if (!permResult.granted) {
      setErrorMessage(permResult.error || 'Permiso de micrófono bloqueado en tu navegador.');
      return;
    }

    // Step 2: Initialize real-time audio volume monitoring
    const analyzer = await createAudioVolumeAnalyzer();
    if (analyzer) {
      volumeAnalyzerRef.current = analyzer;
      const pollVolume = () => {
        if (volumeAnalyzerRef.current) {
          setAudioVolumeLevel(volumeAnalyzerRef.current.getVolume());
          animFrameRef.current = requestAnimationFrame(pollVolume);
        }
      };
      animFrameRef.current = requestAnimationFrame(pollVolume);
    }

    // Step 3: Start continuous Spanish speech recognition
    const started = startSpanishListening({
      lang: 'es-ES',
      continuous: true,
      interimResults: true,
      onStart: () => {
        setIsRecording(true);
      },
      onResult: (transcript, isFinal, confidence) => {
        lastTranscriptRef.current = transcript;
        setSpokenTranscript(transcript);
        if (transcript.trim().length > 0) {
          const evalResult = evaluateSpanishPronunciation(targetText, transcript, confidence);
          setEvaluation(evalResult);
        }
      },
      onError: (err) => {
        setIsRecording(false);
        stopVolumeMonitor();
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsRecording(false);
        stopVolumeMonitor();
        if (lastTranscriptRef.current.trim().length > 0) {
          const evalResult = evaluateSpanishPronunciation(targetText, lastTranscriptRef.current);
          setEvaluation(evalResult);
        }
      }
    });

    if (!started) {
      stopVolumeMonitor();
      setErrorMessage('No se pudo iniciar el reconocimiento de voz. Te recomendamos usar Google Chrome o Microsoft Edge.');
    }
  }, [isRecording, targetText, stopVolumeMonitor]);

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
                "{targetText}"
              </p>
              {englishMeaning && (
                <p className="text-xs text-slate-600 italic mt-1 font-medium">
                  Meaning: {englishMeaning}
                </p>
              )}
            </div>

            {/* Audio Playback & Speed Controls */}
            <div className="flex flex-col items-center space-y-1.5 shrink-0">
              <button
                onClick={handlePlayNativeAudio}
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

        {/* Recording / Voice Input Controls */}
        <div className="flex flex-col items-center justify-center my-2 space-y-2.5">
          {isSupported ? (
            <div className="relative flex items-center justify-center">
              <button
                onClick={handleToggleListening}
                className={`relative p-5 rounded-full border-4 transition-all duration-300 flex items-center justify-center shadow-xl cursor-pointer ${
                  isRecording
                    ? 'bg-red-500 border-red-300 text-white animate-pulse scale-110 shadow-red-500/40'
                    : 'bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 border-amber-300 text-slate-950 hover:scale-105 shadow-amber-500/30'
                }`}
                title={isRecording ? 'Detener grabación' : 'Hablar en español'}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                {isRecording && (
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75" />
                )}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-xs text-amber-900 font-semibold text-center">
              Tu navegador no tiene la Web Speech API activa. Te recomendamos Google Chrome o Microsoft Edge, o utiliza el campo de texto a continuación:
            </div>
          )}

          {/* Real-time Audio Volume Waveform */}
          {isRecording && (
            <div className="flex items-center space-x-1.5 py-0.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Voz detectada:</span>
              <div className="flex items-center space-x-1 h-5">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => {
                  const h = Math.max(4, Math.min(20, Math.round(audioVolumeLevel * (0.4 + (bar % 3) * 0.3))));
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

          <span className="text-xs font-bold text-slate-700">
            {isRecording ? '🎧 Escuchando tu voz en español... ¡Habla ahora!' : 'Toca el micrófono para hablar en español'}
          </span>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 mb-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
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

        {/* Manual Test / Fallback input */}
        <div className="mb-2.5">
          <details className="text-xs text-slate-600 cursor-pointer" open={!isSupported}>
            <summary className="font-semibold hover:text-amber-800 select-none">
              ¿Quieres escribir para evaluar tu pronunciación y tildes? (Opcional)
            </summary>
            <div className="mt-2 flex items-center space-x-2">
              <input
                data-testid="pronunciation-manual-input"
                type="text"
                placeholder="Escribe aquí tu frase en español..."
                value={spokenTranscript}
                onChange={(e) => {
                  const val = e.target.value;
                  setSpokenTranscript(val);
                  if (val.trim()) {
                    const evalResult = evaluateSpanishPronunciation(targetText, val);
                    setEvaluation(evalResult);
                  } else {
                    setEvaluation(null);
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                data-testid="pronunciation-eval-btn"
                onClick={() => {
                  if (spokenTranscript.trim()) {
                    const evalResult = evaluateSpanishPronunciation(targetText, spokenTranscript);
                    setEvaluation(evalResult);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
              >
                Evaluar
              </button>
            </div>
          </details>
        </div>

        {/* Pronunciation Assessment Results */}
        {evaluation && (
          <div className="space-y-3 pt-2 border-t border-amber-200 animate-fadeIn">
            {/* Score & Rating Badge */}
            <div
              className="p-3 rounded-2xl border-2 flex items-center justify-between"
              style={{
                backgroundColor: `${evaluation.ratingColor}15`,
                borderColor: evaluation.ratingColor
              }}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" style={{ color: evaluation.ratingColor }} />
                <div>
                  <span className="font-bold text-sm block" style={{ color: evaluation.ratingColor }}>
                    {evaluation.ratingLabel}
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Precisión fonética estimada
                  </span>
                </div>
              </div>
              <div
                className="px-3 py-1 rounded-xl text-lg font-black font-mono shadow-xs"
                style={{
                  backgroundColor: evaluation.ratingColor,
                  color: '#FFFFFF'
                }}
              >
                {evaluation.overallScore}%
              </div>
            </div>

            {/* Word-by-Word Breakdown */}
            {evaluation.wordBreakdown.length > 0 && (
              <div className="p-3 rounded-2xl bg-white border border-amber-200 space-y-1.5">
                <span className="text-[10px] font-black text-amber-800 uppercase block">
                  Análisis por palabra:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.wordBreakdown.map((item, idx) => {
                    const isGood = item.status === 'correct';
                    const isNear = item.status === 'near';
                    return (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          isGood
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                            : isNear
                            ? 'bg-amber-50 border-amber-400 text-amber-900'
                            : 'bg-rose-50 border-rose-300 text-rose-900'
                        }`}
                        title={item.tip || `Similitud: ${Math.round(item.similarity * 100)}%`}
                      >
                        {item.word} {isGood ? '✓' : isNear ? '~' : '✗'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Phonetic Coaching Tips */}
            {evaluation.phoneticTips.length > 0 && (
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
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Detener' : 'Repetir intento'}</span>
              </button>

              {onApplySpokenAnswer && evaluation.isMatch && (
                <button
                  onClick={() => onApplySpokenAnswer(spokenTranscript, evaluation)}
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
