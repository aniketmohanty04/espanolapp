// Supabase Edge Function: assess-pronunciation
// Evaluates Spanish pronunciation using Azure AI Speech Pronunciation Assessment REST API.
// Runs on Deno / Supabase Edge Functions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_LOCALES = new Set(["es-ES", "es-MX"]);
const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB maximum audio size
const MIN_AUDIO_BYTES = 200; // Minimum audio byte length
const MAX_TEXT_LENGTH = 500;
const TIMEOUT_MS = 12000;
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 15;

// Rate Limiting Architecture Note:
// The in-memory sliding-window limiter below provides instance-local protection against rapid burst floods
// on an individual warm Edge instance.
//
// IMPORTANT ARCHITECTURAL LIMITATION:
// Because Edge Functions run in isolated, ephemeral Deno runtimes globally distributed across Cloudflare locations,
// this in-memory Map does NOT provide shared distributed rate limiting across instances.
// For production deployments requiring shared abuse prevention across all instances without added paid services,
// dependable rate limiting should be configured at the Supabase API Gateway (Kong) or Cloudflare WAF level.
interface RateLimitEntry {
  timestamps: number[];
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIdentifier(req: Request): string {
  // 1. If authenticated user token is present in Authorization header, use it as primary identity
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ") && authHeader.length > 20) {
    const tokenPart = authHeader.substring(7);
    // Simple fast hash of token
    let hash = 0;
    for (let i = 0; i < Math.min(tokenPart.length, 64); i++) {
      hash = (hash << 5) - hash + tokenPart.charCodeAt(i);
      hash |= 0;
    }
    return `auth_${hash}`;
  }

  // 2. Trust Cloudflare connecting IP in Supabase Edge Functions
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return `cf_${cfIp.trim()}`;

  // 3. Fallback to x-real-ip
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `real_${realIp.trim()}`;

  // 4. Sanitize leftmost client IP from x-forwarded-for
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (/^[a-fA-F0-9:.]+$/.test(firstIp)) {
      return `fwd_${firstIp}`;
    }
  }

  return "anonymous_client";
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Prune expired entries periodically if map grows
  if (rateLimitMap.size > 500) {
    for (const [key, entry] of rateLimitMap.entries()) {
      entry.timestamps = entry.timestamps.filter(t => t > windowStart);
      if (entry.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }

  let entry = rateLimitMap.get(clientId);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitMap.set(clientId, entry);
  }

  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.timestamps.push(now);
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

  // Early content-length check to prevent buffer overflow attacks
  const rawContentLength = req.headers.get("content-length");
  if (rawContentLength) {
    const contentLength = parseInt(rawContentLength, 10);
    if (!isNaN(contentLength) && contentLength > MAX_AUDIO_BYTES + 8192) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Request payload (${(contentLength / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
          errorCode: "PAYLOAD_TOO_LARGE"
        }),
        { status: 413, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
  }

  // Rate limiting safeguard with trusted headers
  const clientId = getClientIdentifier(req);
  if (!checkRateLimit(clientId)) {
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

    // Stream request body with strict size enforcement before full buffering
    let totalBytes = 0;
    const bodyChunks: Uint8Array[] = [];
    if (req.body) {
      const reader = req.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > MAX_AUDIO_BYTES + 8192) {
            reader.cancel();
            return new Response(
              JSON.stringify({
                success: false,
                error: `Request stream exceeded maximum size limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
                errorCode: "PAYLOAD_TOO_LARGE"
              }),
              { status: 413, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
            );
          }
          bodyChunks.push(value);
        }
      }
    }

    const totalBuffer = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of bodyChunks) {
      totalBuffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const bufferedReq = new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: totalBuffer
    });

    const formData = await bufferedReq.formData();
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
    if (audioBytes.byteLength < MIN_AUDIO_BYTES) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Audio recording is empty or too short to contain speech.",
          errorCode: "EMPTY_AUDIO",
          guidance: "El micrófono no capturó audio suficiente. Asegúrate de hablar claramente cerca del micrófono."
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

    // Inspect magic bytes to strictly verify audio container
    // Never claim audio is WAV if it is not genuine RIFF WAV!
    const isRiffWav = audioBytes.byteLength >= 12 &&
      audioBytes[0] === 0x52 && audioBytes[1] === 0x49 && audioBytes[2] === 0x46 && audioBytes[3] === 0x46 && // 'RIFF'
      audioBytes[8] === 0x57 && audioBytes[9] === 0x41 && audioBytes[10] === 0x56 && audioBytes[11] === 0x45;  // 'WAVE'

    const isOggOpus = audioBytes.byteLength >= 4 &&
      audioBytes[0] === 0x4f && audioBytes[1] === 0x67 && audioBytes[2] === 0x67 && audioBytes[3] === 0x53; // 'OggS'

    const isWebm = audioBytes.byteLength >= 4 &&
      audioBytes[0] === 0x1a && audioBytes[1] === 0x45 && audioBytes[2] === 0xdf && audioBytes[3] === 0xa3; // EBML / WebM

    let audioContentType = "";
    if (isRiffWav) {
      // Documented content type for 16 kHz, mono, 16-bit PCM WAV
      audioContentType = "audio/wav; codecs=audio/pcm; samplerate=16000";
    } else if (isOggOpus) {
      audioContentType = "audio/ogg; codecs=opus";
    } else if (isWebm) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "El formato WebM directo no es admitido por la API REST de Azure Speech. Debe convertirse a WAV 16kHz mono.",
          errorCode: "UNSUPPORTED_AUDIO_FORMAT",
          guidance: "Formato de audio no compatible. Asegúrate de que el conversor a WAV esté activo en tu navegador."
        }),
        { status: 415, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Formato de audio no reconocido o dañado. Se requiere WAV PCM o OGG Opus genuino.",
          errorCode: "INVALID_AUDIO_FORMAT"
        }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Build official Azure Pronunciation Assessment configuration
    // (ScenarioId omitted as required by official documentation unless valid GUID is supplied)
    const assessmentConfig = {
      ReferenceText: referenceText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableMiscue: true
    };

    // Base64 encode JSON configuration for header
    const configJson = JSON.stringify(assessmentConfig);
    const configBase64 = btoa(unescape(encodeURIComponent(configJson)));

    // Azure Speech Pronunciation Assessment REST endpoint with format=detailed
    const azureEndpoint = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}&format=detailed`;

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
    if (recognitionStatus === "InitialSilenceTimeout" || recognitionStatus === "NoMatch" || recognitionStatus === "BabbleTimeout") {
      const isSilence = recognitionStatus === "InitialSilenceTimeout";
      const guidance = isSilence
        ? "No se detectó voz al inicio de la grabación. Pulsa el botón y habla inmediatamente."
        : "Se detectó ruido o voz poco clara. Acércate al micrófono en un lugar silencioso e inténtalo de nuevo.";

      return new Response(
        JSON.stringify({
          success: false,
          provider: "azure",
          locale,
          recognitionStatus,
          error: isSilence ? "No speech detected (silence timeout)." : "No speech recognized (unclear audio).",
          errorCode: isSilence ? "INITIAL_SILENCE_TIMEOUT" : "NO_SPEECH_DETECTED",
          guidance,
          words: []
        }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Process NBest[0] assessment result from detailed format
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
