/**
 * Client Service for Azure AI Speech Pronunciation Assessment
 *
 * Communicates strictly with the secure backend endpoint (Supabase Edge Function or /api/assess-pronunciation).
 * NEVER handles or requires AZURE_SPEECH_KEY on the client.
 *
 * Provides:
 * 1. Automatic 16kHz PCM WAV conversion for recorded audio.
 * 2. Support for 'es-ES' (Spain) and 'es-MX' (Mexico).
 * 3. Structured parsing of PronScore, Accuracy, Fluency, Completeness, Words, and Phonemes.
 * 4. Transparent offline fallback clearly labeled as local text approximation (never fakes Azure scores).
 */

import { convertAudioBlobToWav } from '../utils/audioConversion';
import { supabaseService } from './supabaseClient';
import { evaluateSpanishPronunciation } from './spanishVoiceRecognitionService';

export type AzurePronunciationLocale = 'es-ES' | 'es-MX';

export interface AzurePhonemeScore {
  phoneme: string;
  accuracyScore: number;
}

export interface AzureSyllableScore {
  syllable: string;
  accuracyScore: number;
}

export interface AzureWordAssessment {
  word: string;
  accuracyScore: number;
  errorType: 'None' | 'Mispronunciation' | 'Omission' | 'Insertion' | string;
  phonemes?: AzurePhonemeScore[];
  syllables?: AzureSyllableScore[];
}

export interface AzureAssessmentResult {
  success: boolean;
  provider: 'azure' | 'offline_approximation';
  isRealAzure: boolean;
  locale: AzurePronunciationLocale;
  recognitionStatus: string;
  displayText?: string;
  scores?: {
    pronunciationScore: number; // 0 to 100
    accuracyScore: number;      // 0 to 100
    fluencyScore?: number | null;      // Available only when assessed acoustically by Azure
    completenessScore?: number | null; // Available only when assessed acoustically by Azure
  };
  words: AzureWordAssessment[];
  error?: string;
  errorCode?: string;
  guidance?: string;
}

export interface AssessPronunciationOptions {
  audioBlob: Blob;
  referenceText: string;
  locale?: AzurePronunciationLocale;
  spokenTranscriptFallback?: string;
  forceOfflineFallback?: boolean;
  endpointUrl?: string;
}

/**
 * Resolves the backend endpoint for pronunciation assessment.
 * Priority:
 * 1. Direct explicit override (if specified in options or argument)
 * 2. Custom endpoint from AZURE_ASSESSMENT_ENDPOINT or VITE_AZURE_ASSESSMENT_URL
 * 3. Supabase Edge Function URL (${supabaseUrl}/functions/v1/assess-pronunciation) if Supabase is configured
 * 4. Local / serverless endpoint (/api/assess-pronunciation)
 */
export function getAssessmentEndpoint(customOverrideUrl?: string): { url: string; headers: Record<string, string> } {
  const directOverride = (customOverrideUrl || '').trim();
  if (directOverride) {
    return { url: directOverride, headers: {} };
  }

  const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  const envUrl = (
    (globalProcess && (globalProcess.env?.AZURE_ASSESSMENT_ENDPOINT || globalProcess.env?.VITE_AZURE_ASSESSMENT_URL)) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AZURE_ASSESSMENT_URL) ||
    ''
  ).trim();
  if (envUrl) {
    return { url: envUrl, headers: {} };
  }

  const supabaseConfig = supabaseService.getConfig();
  if (supabaseConfig.isConfigured && supabaseConfig.url) {
    const baseUrl = supabaseConfig.url.replace(/\/+$/, '');
    return {
      url: `${baseUrl}/functions/v1/assess-pronunciation`,
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`
      }
    };
  }

  return { url: '/api/assess-pronunciation', headers: {} };
}

/**
 * Creates an offline approximation result using local text similarity.
 * Strictly labels the result as an approximation, never fabricating phoneme or acoustic scores.
 * If spokenText is empty or missing, returns an explicit no-speech failure without scores.
 */
export function createOfflineApproximationResult(
  referenceText: string,
  spokenText: string,
  locale: AzurePronunciationLocale = 'es-ES',
  errorNotice?: string
): AzureAssessmentResult {
  const cleanSpoken = (spokenText || '').trim();
  if (!cleanSpoken) {
    return {
      success: false,
      provider: 'offline_approximation',
      isRealAzure: false,
      locale,
      recognitionStatus: 'NoSpeechDetected',
      displayText: '',
      words: [],
      error: errorNotice || 'No se detectó voz o texto para evaluar.',
      errorCode: 'NO_SPEECH_DETECTED',
      guidance: 'No se detectó voz. Habla claro cerca del micrófono e inténtalo de nuevo.'
    };
  }

  const localEval = evaluateSpanishPronunciation(referenceText, cleanSpoken);

  // Map word breakdown to assessment format
  const words: AzureWordAssessment[] = localEval.wordBreakdown.map((w) => ({
    word: w.word,
    accuracyScore: Math.round(w.similarity * 100),
    errorType: w.status === 'correct' ? 'None' : w.status === 'near' ? 'Mispronunciation' : 'Omission'
  }));

  return {
    success: true,
    provider: 'offline_approximation',
    isRealAzure: false,
    locale,
    recognitionStatus: 'OfflineApproximation',
    displayText: cleanSpoken,
    scores: {
      pronunciationScore: localEval.overallScore,
      accuracyScore: localEval.accuracyPercent,
      fluencyScore: null,       // Acoustic fluency is explicitly unavailable from text alone
      completenessScore: null   // Acoustic completeness is explicitly unavailable from text alone
    },
    words,
    error: errorNotice,
    errorCode: 'OFFLINE_FALLBACK',
    guidance: 'Evaluación local aproximada (basada en texto). Azure AI Speech no está conectado o el servidor está en modo offline.'
  };
}

/**
 * Sends recorded audio to the secure backend for genuine Azure AI Speech Pronunciation Assessment.
 */
export async function assessSpanishPronunciationWithAzure(
  options: AssessPronunciationOptions
): Promise<AzureAssessmentResult> {
  const {
    audioBlob,
    referenceText,
    locale = 'es-ES',
    spokenTranscriptFallback = '',
    forceOfflineFallback = false
  } = options;

  const validTranscriptFallback = (spokenTranscriptFallback || '').trim();

  if (forceOfflineFallback) {
    if (!validTranscriptFallback) {
      return {
        success: false,
        provider: 'offline_approximation',
        isRealAzure: false,
        locale,
        recognitionStatus: 'NoSpeechDetected',
        words: [],
        error: 'No se detectó voz para evaluar.',
        errorCode: 'NO_SPEECH_DETECTED',
        guidance: 'No se detectó voz. Habla claro cerca del micrófono e inténtalo de nuevo.'
      };
    }
    return createOfflineApproximationResult(referenceText, validTranscriptFallback, locale);
  }

  if (!referenceText || referenceText.trim().length === 0) {
    return {
      success: false,
      provider: 'offline_approximation',
      isRealAzure: false,
      locale,
      recognitionStatus: 'InvalidInput',
      words: [],
      error: 'La frase de referencia no puede estar vacía.',
      errorCode: 'MISSING_REFERENCE_TEXT'
    };
  }

  // Convert browser recording (WebM, OGG, or non-compliant WAV) to verified 16kHz mono 16-bit PCM WAV
  const { wavBlob, mimeType, isConverted } = await convertAudioBlobToWav(audioBlob, 16000);

  // If conversion failed, never send unsupported audio to Azure or claim Azure assessment succeeded
  if (!isConverted) {
    if (validTranscriptFallback) {
      return createOfflineApproximationResult(
        referenceText,
        validTranscriptFallback,
        locale,
        'La conversión de audio a WAV 16kHz mono falló. Se muestra una aproximación local basada en texto.'
      );
    }
    return {
      success: false,
      provider: 'offline_approximation',
      isRealAzure: false,
      locale,
      recognitionStatus: 'AudioConversionFailed',
      words: [],
      error: 'No se pudo convertir la grabación a un formato WAV 16kHz mono compatible y no se detectó texto transcrito.',
      errorCode: 'AUDIO_CONVERSION_FAILED',
      guidance: 'Verifica tu micrófono y asegúrate de permitir la grabación de audio en el navegador.'
    };
  }

  const { url, headers } = getAssessmentEndpoint(options.endpointUrl);
  const formData = new FormData();
  formData.append('audio', wavBlob, mimeType === 'audio/wav' ? 'recording.wav' : 'recording.webm');
  formData.append('referenceText', referenceText.trim());
  formData.append('locale', locale);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        Accept: 'application/json'
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // If endpoint is unconfigured or not found, fall back gracefully to local approximation ONLY if speech exists
    if (response.status === 503 || response.status === 404) {
      const errJson = await response.json().catch(() => ({}));
      if (validTranscriptFallback) {
        return createOfflineApproximationResult(
          referenceText,
          validTranscriptFallback,
          locale,
          errJson.error || 'Servidor Azure no configurado. Mostrando aproximación de texto.'
        );
      }
      return {
        success: false,
        provider: 'offline_approximation',
        isRealAzure: false,
        locale,
        recognitionStatus: 'NoSpeechDetected',
        words: [],
        error: errJson.error || 'Servidor Azure no configurado y no se detectó voz.',
        errorCode: 'NO_SPEECH_DETECTED',
        guidance: 'No se detectó voz para evaluar. Habla claro cerca del micrófono e inténtalo de nuevo.'
      };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        provider: 'azure',
        isRealAzure: false,
        locale,
        recognitionStatus: 'Error',
        words: [],
        error: errorData.error || `Error del servidor HTTP ${response.status}`,
        errorCode: errorData.errorCode || 'BACKEND_ERROR',
        guidance: errorData.guidance || 'Inténtalo de nuevo o comprueba la conexión.'
      };
    }

    const data = await response.json();

    if (!data.success) {
      if (data.errorCode === 'AZURE_NOT_CONFIGURED' && validTranscriptFallback) {
        return createOfflineApproximationResult(
          referenceText,
          validTranscriptFallback,
          locale,
          data.error
        );
      }
      return {
        success: false,
        provider: data.provider || 'azure',
        isRealAzure: false,
        locale: data.locale || locale,
        recognitionStatus: data.recognitionStatus || 'Error',
        words: [],
        error: data.error || 'La evaluación no fue exitosa.',
        errorCode: data.errorCode || 'ASSESSMENT_FAILED',
        guidance: data.guidance || 'Inténtalo de nuevo.'
      };
    }

    return {
      success: true,
      provider: data.provider || 'azure',
      isRealAzure: data.provider === 'azure' && data.scores !== undefined,
      locale: data.locale || locale,
      recognitionStatus: data.recognitionStatus || 'Success',
      displayText: data.displayText,
      scores: {
        pronunciationScore: typeof data.scores?.pronunciationScore === 'number' ? data.scores.pronunciationScore : 0,
        accuracyScore: typeof data.scores?.accuracyScore === 'number' ? data.scores.accuracyScore : 0,
        fluencyScore: typeof data.scores?.fluencyScore === 'number' ? data.scores.fluencyScore : null,
        completenessScore: typeof data.scores?.completenessScore === 'number' ? data.scores.completenessScore : null
      },
      words: data.words || [],
      error: data.error,
      errorCode: data.errorCode,
      guidance: data.guidance
    };

  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = (err as { name?: string })?.name === 'AbortError';

    if (validTranscriptFallback) {
      return createOfflineApproximationResult(
        referenceText,
        validTranscriptFallback,
        locale,
        isTimeout ? 'Tiempo de espera agotado al conectar con Azure. Mostrando aproximación de texto.' : 'No se pudo conectar con el servidor Azure. Mostrando aproximación de texto.'
      );
    }

    return {
      success: false,
      provider: 'offline_approximation',
      isRealAzure: false,
      locale,
      recognitionStatus: isTimeout ? 'Timeout' : 'NetworkError',
      words: [],
      error: isTimeout ? 'Tiempo de espera agotado al conectar con Azure.' : 'No se pudo conectar con el servidor de evaluación Azure.',
      errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      guidance: 'Comprueba tu conexión e inténtalo de nuevo en unos segundos.'
    };
  }
}
