// Supabase Edge Function: assess-pronunciation
// Evaluates Spanish pronunciation using Azure AI Speech Pronunciation Assessment REST API.
// Runs on Deno / Supabase Edge Functions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_LOCALES = new Set(["es-ES", "es-MX"]);
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_LENGTH = 500;
const TIMEOUT_MS = 12000;

// Simple in-memory rate limiter per IP / client token: max 20 requests per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 20) {
    return false;
  }
  entry.count += 1;
  return true;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export interface AzurePronunciationWord {
  word: string;
  accuracyScore: number;
  errorType: "None" | "Mispronunciation" | "Omission" | "Insertion" | string;
  phonemes?: Array<{ phoneme: string; accuracyScore: number }>;
  syllables?: Array<{ syllable: string; accuracyScore: number }>;
}

export interface AssessmentResponse {
  success: boolean;
  provider: "azure";
  locale: "es-ES" | "es-MX";
  recognitionStatus: string;
  displayText?: string;
  scores?: {
    pronunciationScore: number;
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
  };
  words?: AzurePronunciationWord[];
  error?: string;
  errorCode?: string;
  guidance?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed. Use POST.", errorCode: "METHOD_NOT_ALLOWED" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Rate limiting safeguard
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Rate limit exceeded. Please wait a minute before retrying.",
        errorCode: "RATE_LIMITED",
        guidance: "Has realizado demasiadas solicitudes seguidas. Espera un momento antes de volver a intentarlo."
      }),
      { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Check Azure server-side configuration
  const azureKey = Deno.env.get("AZURE_SPEECH_KEY");
  const azureRegion = Deno.env.get("AZURE_SPEECH_REGION") || "eastus";

  if (!azureKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Azure Speech credentials are not configured on the server.",
        errorCode: "AZURE_NOT_CONFIGURED",
        guidance: "El servicio de evaluación Azure Speech no está configurado en el servidor. Usa el modo local aproximado."
      }),
      { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid Content-Type. Expected multipart/form-data.",
          errorCode: "INVALID_CONTENT_TYPE"
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const audioEntry = formData.get("audio");
    const referenceTextRaw = formData.get("referenceText");
    const localeRaw = formData.get("locale");

    if (!audioEntry || !(audioEntry instanceof File || audioEntry instanceof Blob)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid 'audio' file in form data.",
          errorCode: "MISSING_AUDIO"
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (!referenceTextRaw || typeof referenceTextRaw !== "string" || referenceTextRaw.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or empty 'referenceText' parameter.",
          errorCode: "MISSING_REFERENCE_TEXT"
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const referenceText = referenceTextRaw.trim();
    if (referenceText.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Reference text exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`,
          errorCode: "TEXT_TOO_LONG"
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const locale = (typeof localeRaw === "string" ? localeRaw.trim() : "es-ES") as "es-ES" | "es-MX";
    if (!ALLOWED_LOCALES.has(locale)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unsupported locale '${locale}'. Supported Spanish locales are 'es-ES' and 'es-MX'.`,
          errorCode: "INVALID_LOCALE"
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const audioBytes = new Uint8Array(await audioEntry.arrayBuffer());
    if (audioBytes.byteLength === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Audio recording is empty (0 bytes).",
          errorCode: "EMPTY_AUDIO",
          guidance: "El micrófono no capturó audio. Asegúrate de hablar claramente cerca del micrófono."
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (audioBytes.byteLength > MAX_AUDIO_BYTES) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Audio file size (${(audioBytes.byteLength / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
          errorCode: "AUDIO_TOO_LARGE"
        }),
        { status: 413, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Build Azure Pronunciation Assessment configuration
    // Uses official Comprehensive dimension and Phoneme granularity
    const assessmentConfig = {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableMiscue: true,
      ScenarioId: "espanolapp-v1"
    };

    // Base64 encode the JSON config for the HTTP header
    const configJson = JSON.stringify(assessmentConfig);
    const configBase64 = btoa(unescape(encodeURIComponent(configJson)));

    // Azure Speech Pronunciation Assessment REST endpoint
    const azureEndpoint = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}`;

    // Determine Audio Content-Type
    let audioContentType = audioEntry.type || "audio/wav";
    if (!audioContentType || audioContentType === "application/octet-stream") {
      audioContentType = "audio/wav; codecs=audio/pcm; samplerate=16000";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let azureRes: Response;
    try {
      azureRes = await fetch(azureEndpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey,
          "Pronunciation-Assessment": configBase64,
          "Content-Type": audioContentType,
          "Accept": "application/json",
        },
        body: audioBytes,
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (fetchErr as { name?: string })?.name === "AbortError";
      return new Response(
        JSON.stringify({
          success: false,
          error: isAbort ? "Azure Speech request timed out." : "Network failure contacting Azure Speech service.",
          errorCode: isAbort ? "TIMEOUT" : "PROVIDER_NETWORK_ERROR",
          guidance: "Tiempo de espera agotado o error de conexión con Azure. Prueba de nuevo en unos segundos."
        }),
        { status: isAbort ? 504 : 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle provider status errors
    if (!azureRes.ok) {
      const errText = await azureRes.text().catch(() => "");
      let errorCode = "AZURE_ERROR";
      let errorMsg = `Azure Speech returned HTTP ${azureRes.status}`;
      let guidance = "Ocurrió un error en el proveedor de evaluación de voz.";

      if (azureRes.status === 401) {
        errorCode = "AZURE_UNAUTHORIZED";
        errorMsg = "Invalid or expired Azure Speech key.";
        guidance = "Clave de Azure Speech inválida o expirada en el servidor.";
      } else if (azureRes.status === 403) {
        errorCode = "AZURE_QUOTA_EXCEEDED";
        errorMsg = "Azure Speech resource limit or quota exceeded.";
        guidance = "Límite de cuota del servicio Azure alcanzado temporalmente.";
      } else if (azureRes.status === 429) {
        errorCode = "AZURE_RATE_LIMITED";
        errorMsg = "Azure Speech rate limit exceeded.";
        guidance = "Demasiadas peticiones simultáneas a Azure. Espera un momento.";
      } else if (azureRes.status === 400) {
        errorCode = "AZURE_BAD_AUDIO";
        errorMsg = `Azure rejected the audio format: ${errText || 'Bad audio payload'}`;
        guidance = "Formato de audio no reconocido por Azure. Habla claro y prueba grabar de nuevo.";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg,
          errorCode,
          guidance,
          providerStatus: azureRes.status
        }),
        { status: azureRes.status >= 500 ? 502 : azureRes.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const azureData = await azureRes.json();
    const recognitionStatus = azureData.RecognitionStatus || "Unknown";

    // Handle non-success recognition status
    if (recognitionStatus === "InitialSilenceTimeout") {
      return new Response(
        JSON.stringify({
          success: true,
          provider: "azure",
          locale,
          recognitionStatus,
          guidance: "No se detectó voz al inicio de la grabación. Pulsa el botón y habla inmediatamente.",
          scores: { pronunciationScore: 0, accuracyScore: 0, fluencyScore: 0, completenessScore: 0 },
          words: []
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (recognitionStatus === "NoMatch" || recognitionStatus === "BabbleTimeout") {
      return new Response(
        JSON.stringify({
          success: true,
          provider: "azure",
          locale,
          recognitionStatus,
          guidance: "Se detectó ruido o voz poco clara. Acércate al micrófono en un lugar silencioso e inténtalo de nuevo.",
          scores: { pronunciationScore: 0, accuracyScore: 0, fluencyScore: 0, completenessScore: 0 },
          words: []
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Process NBest[0] assessment result
    const bestResult = azureData.NBest?.[0];
    const assessment = bestResult?.PronunciationAssessment;

    if (!assessment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Azure recognized speech but did not return pronunciation assessment metrics.",
          errorCode: "NO_ASSESSMENT_METRICS",
          recognitionStatus,
          displayText: azureData.DisplayText
        }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const words: AzurePronunciationWord[] = (bestResult.Words || []).map((w: any) => {
      const wAssessment = w.PronunciationAssessment || {};
      const phonemes = (w.Phonemes || []).map((p: any) => ({
        phoneme: p.Phoneme,
        accuracyScore: Math.round(p.PronunciationAssessment?.AccuracyScore ?? 0)
      }));
      const syllables = (w.Syllables || []).map((s: any) => ({
        syllable: s.Syllable,
        accuracyScore: Math.round(s.PronunciationAssessment?.AccuracyScore ?? 0)
      }));

      return {
        word: w.Word,
        accuracyScore: Math.round(wAssessment.AccuracyScore ?? 0),
        errorType: wAssessment.ErrorType || "None",
        phonemes: phonemes.length > 0 ? phonemes : undefined,
        syllables: syllables.length > 0 ? syllables : undefined
      };
    });

    const responsePayload: AssessmentResponse = {
      success: true,
      provider: "azure",
      locale,
      recognitionStatus,
      displayText: bestResult.Display || azureData.DisplayText,
      scores: {
        pronunciationScore: Math.round(assessment.PronScore ?? 0),
        accuracyScore: Math.round(assessment.AccuracyScore ?? 0),
        fluencyScore: Math.round(assessment.FluencyScore ?? 0),
        completenessScore: Math.round(assessment.CompletenessScore ?? 0)
      },
      words
    };

    return new Response(
      JSON.stringify(responsePayload),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error processing pronunciation assessment: ${errorMsg}`,
        errorCode: "INTERNAL_SERVER_ERROR"
      }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
