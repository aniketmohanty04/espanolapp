import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { speakSpanish, stopSpanishSpeech } from '../services/spanishSpeechService';
import {
  isSpeechRecognitionSupported,
  startSpanishListening,
  stopSpanishListening,
  evaluateSpanishPronunciation,
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
  const isSupported = isSpeechRecognitionSupported();

  // Stop any ongoing speech or recognition when modal unmounts
  useEffect(() => {
    return () => {
      stopSpanishListening();
      stopSpanishSpeech();
    };
  }, []);

  // Listen to native pronunciation
  const handlePlayNativeAudio = useCallback(() => {
    if (isPlayingAudio) {
      stopSpanishSpeech();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    speakSpanish(targetText, {
      rate: 0.85, // clear beginner-friendly cadence
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false)
    });
  }, [targetText, isPlayingAudio]);

  // Toggle voice capture
  const handleToggleListening = useCallback(() => {
    if (isRecording) {
      stopSpanishListening();
      setIsRecording(false);
      return;
    }

    setErrorMessage(null);
    setSpokenTranscript('');
    setEvaluation(null);

    const started = startSpanishListening({
      lang: 'es-ES',
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsRecording(true);
      },
      onResult: (transcript, isFinal, confidence) => {
        setSpokenTranscript(transcript);
        if (isFinal || transcript.length >= targetText.length * 0.8) {
          const evalResult = evaluateSpanishPronunciation(targetText, transcript, confidence);
          setEvaluation(evalResult);
        }
      },
      onError: (err) => {
        setIsRecording(false);
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });

    if (!started) {
      setErrorMessage('No se pudo activar el micrófono. Verifica los permisos de tu navegador.');
    }
  }, [isRecording, targetText]);

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
        <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-xs mb-4">
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
          </div>
        </div>

        {/* Recording / Voice Input Controls */}
        <div className="flex flex-col items-center justify-center my-3 space-y-3">
          {isSupported ? (
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
          ) : (
            <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-800 font-semibold text-center">
              Reconocimiento de voz no soportado directamente en este navegador. Te recomendamos usar Google Chrome o Microsoft Edge.
            </div>
          )}

          <span className="text-xs font-bold text-slate-700">
            {isRecording ? '🎧 Escuchando tu voz en español... ¡Habla ahora!' : 'Toca el micrófono para hablar en español'}
          </span>
        </div>

        {/* Manual Test / Fallback input */}
        <div className="mt-1 mb-3">
          <details className="text-xs text-slate-600 cursor-pointer">
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

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 mb-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live / Spoken Transcript Display */}
        {spokenTranscript && (
          <div className="p-3 mb-3 rounded-2xl bg-white/90 border border-amber-200 text-slate-900 text-sm">
            <span className="text-[10px] font-black text-amber-800 uppercase block mb-1">
              Lo que hemos detectado (You said):
            </span>
            <p className="font-semibold text-slate-900 italic">"{spokenTranscript}"</p>
          </div>
        )}

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
                <span>Repetir intento</span>
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
        <div className="pt-4 text-center">
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
