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
  scores: {
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
}

/**
 * Resolves the backend endpoint for pronunciation assessment.
 * Priority:
 * 1. Custom endpoint from VITE_AZURE_ASSESSMENT_URL (if specified)
 * 2. Supabase Edge Function URL (${supabaseUrl}/functions/v1/assess-pronunciation) if Supabase is configured
 * 3. Local / serverless endpoint (/api/assess-pronunciation)
 */
export function getAssessmentEndpoint(): { url: string; headers: Record<string, string> } {
  const customUrl = (import.meta.env.VITE_AZURE_ASSESSMENT_URL || '').trim();
  if (customUrl) {
    return { url: customUrl, headers: {} };
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
 */
export function createOfflineApproximationResult(
  referenceText: string,
  spokenText: string,
  locale: AzurePronunciationLocale = 'es-ES',
  errorNotice?: string
): AzureAssessmentResult {
  const localEval = evaluateSpanishPronunciation(referenceText, spokenText);

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
    displayText: spokenText,
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

  if (forceOfflineFallback) {
    return createOfflineApproximationResult(referenceText, spokenTranscriptFallback, locale);
  }

  if (!referenceText || referenceText.trim().length === 0) {
    return {
      success: false,
      provider: 'offline_approximation',
      isRealAzure: false,
      locale,
      recognitionStatus: 'InvalidInput',
      scores: { pronunciationScore: 0, accuracyScore: 0, fluencyScore: 0, completenessScore: 0 },
      words: [],
      error: 'La frase de referencia no puede estar vacía.',
      errorCode: 'MISSING_REFERENCE_TEXT'
    };
  }

  // Convert browser recording (WebM/Opus) to genuine 16kHz mono 16-bit PCM WAV
  const { wavBlob, mimeType } = await convertAudioBlobToWav(audioBlob, 16000);

  const { url, headers } = getAssessmentEndpoint();
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

    // If endpoint is unconfigured or not found, fall back gracefully to local approximation
    if (response.status === 503 || response.status === 404) {
      const errJson = await response.json().catch(() => ({}));
      return createOfflineApproximationResult(
        referenceText,
        spokenTranscriptFallback || referenceText,
        locale,
        errJson.error || 'Servidor Azure no configurado.'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        provider: 'azure',
        isRealAzure: false,
        locale,
        recognitionStatus: 'Error',
        scores: { pronunciationScore: 0, accuracyScore: 0, fluencyScore: 0, completenessScore: 0 },
        words: [],
        error: errorData.error || `Error del servidor HTTP ${response.status}`,
        errorCode: errorData.errorCode || 'BACKEND_ERROR',
        guidance: errorData.guidance || 'Inténtalo de nuevo o comprueba la conexión.'
      };
    }

    const data = await response.json();

    if (!data.success && data.errorCode === 'AZURE_NOT_CONFIGURED') {
      return createOfflineApproximationResult(
        referenceText,
        spokenTranscriptFallback || referenceText,
        locale,
        data.error
      );
    }

    return {
      success: Boolean(data.success),
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

    // On network failure or timeout, provide local approximation fallback with clear notice
    return createOfflineApproximationResult(
      referenceText,
      spokenTranscriptFallback || referenceText,
      locale,
      isTimeout ? 'Tiempo de espera agotado al conectar con Azure.' : 'No se pudo conectar con el servidor de evaluación Azure.'
    );
  }
}
