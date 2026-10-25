// Serverless Function: /api/assess-pronunciation
// Node / Vercel compatible endpoint for Azure AI Speech Pronunciation Assessment.
// Reads AZURE_SPEECH_KEY and AZURE_SPEECH_REGION strictly from server environment secrets.

declare const Buffer: any;
declare const process: any;

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_LOCALES = new Set(['es-ES', 'es-MX']);
const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_AUDIO_BYTES = 200;
const MAX_TEXT_LENGTH = 500;
const TIMEOUT_MS = 12000;
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 15;

/**
 * Rate Limiting Architecture Note:
 * This in-memory sliding-window limiter provides instance-local protection against rapid burst requests
 * on a single warm serverless instance.
 *
 * IMPORTANT ARCHITECTURAL LIMITATION:
 * Rate limiting is instance-local unless shared infrastructure actually enforces it.
 * Because serverless execution instances are ephemeral, independently scaled, and do not share memory,
 * this in-memory Map does NOT provide distributed rate limiting across concurrent serverless instances.
 * In production deployments, dependable cross-instance abuse prevention should be configured at the
 * hosting platform or gateway layer (e.g. Vercel Web Application Firewall / Edge Firewall rate-limiting rules,
 * or API gateway rate limiting), which protects all instances without requiring extra paid infrastructure.
 */
interface RateLimitEntry {
  timestamps: number[];
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIdentifier(req: any): string {
  const authHeader = req.headers?.authorization || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ') && authHeader.length > 20) {
    let hash = 0;
    for (let i = 0; i < Math.min(authHeader.length, 64); i++) {
      hash = (hash << 5) - hash + authHeader.charCodeAt(i);
      hash |= 0;
    }
    return `auth_${hash}`;
  }

  const vercelIp = req.headers?.['x-vercel-ip'] || req.headers?.get?.('x-vercel-ip');
  if (vercelIp) return `vercel_${String(vercelIp).trim()}`;

  const realIp = req.headers?.['x-real-ip'] || req.headers?.get?.('x-real-ip');
  if (realIp) return `real_${String(realIp).trim()}`;

  const forwarded = req.headers?.['x-forwarded-for'] || req.headers?.get?.('x-forwarded-for');
  if (forwarded) {
    const firstIp = String(forwarded).split(',')[0].trim();
    if (/^[a-fA-F0-9:.]+$/.test(firstIp)) {
      return `fwd_${firstIp}`;
    }
  }

  return 'anonymous_client';
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export interface WavValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
  numChannels?: number;
  sampleRate?: number;
  bitsPerSample?: number;
  audioFormat?: number;
  dataSize?: number;
}

/**
 * Validates the binary RIFF/WAVE header and all sub-chunks of incoming audio bytes.
 * Strictly verifies uncompressed PCM (format 1), mono (1 channel), 16000 Hz, 16-bit depth,
 * and rejects truncated or malformed chunks before declaring genuine PCM WAV.
 */
export function validateWavHeader(bytes: Uint8Array): WavValidationResult {
  if (bytes.length < 44) {
    return {
      isValid: false,
      error: 'El archivo WAV está incompleto o truncado (menos de 44 bytes).',
      errorCode: 'TRUNCATED_WAV_HEADER'
    };
  }

  const readAscii = (offset: number, length: number): string => {
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(bytes[offset + i]);
    }
    return str;
  };

  const riff = readAscii(0, 4);
  const wave = readAscii(8, 4);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    return {
      isValid: false,
      error: 'Encabezado RIFF/WAVE no válido.',
      errorCode: 'INVALID_WAV_CONTAINER'
    };
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffLength = view.getUint32(4, true);
  if (bytes.length < riffLength + 8) {
    return {
      isValid: false,
      error: `Archivo WAV truncado: el contenedor RIFF declara ${riffLength + 8} bytes pero solo se recibieron ${bytes.length} bytes.`,
      errorCode: 'TRUNCATED_WAV_FILE'
    };
  }

  let offset = 12;
  let hasFmt = false;
  let isPcm = false;
  let numChannels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let hasData = false;
  let dataSize = 0;

  while (offset + 8 <= bytes.length) {
    const chunkId = readAscii(offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);

    if (offset + 8 + chunkSize > bytes.length) {
      return {
        isValid: false,
        error: `Archivo WAV truncado: el subfragmento "${chunkId}" declara ${chunkSize} bytes pero solo quedan ${bytes.length - offset - 8} bytes.`,
        errorCode: 'TRUNCATED_WAV_CHUNK'
      };
    }

    if (chunkId === 'fmt ') {
      hasFmt = true;
      if (chunkSize < 16) {
        return {
          isValid: false,
          error: 'Subfragmento "fmt " de WAV demasiado corto (menos de 16 bytes).',
          errorCode: 'MALFORMED_WAV_HEADER'
        };
      }
      const audioFormat = view.getUint16(offset + 8, true);
      isPcm = audioFormat === 1; // 1 = WAVE_FORMAT_PCM
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);

      if (!isPcm) {
        return {
          isValid: false,
          error: `Formato de audio WAV no compatible (etiqueta: ${audioFormat}). Azure Pronunciation Assessment requiere PCM lineal (formato 1).`,
          errorCode: 'UNSUPPORTED_WAV_ENCODING',
          audioFormat,
          numChannels,
          sampleRate,
          bitsPerSample
        };
      }

      if (numChannels !== 1) {
        return {
          isValid: false,
          error: `Número de canales WAV no admitido (${numChannels}). Azure Pronunciation Assessment requiere audio mono (1 canal).`,
          errorCode: 'UNSUPPORTED_CHANNEL_COUNT',
          numChannels,
          sampleRate,
          bitsPerSample
        };
      }

      if (sampleRate !== 16000) {
        return {
          isValid: false,
          error: `Frecuencia de muestreo WAV no admitida (${sampleRate} Hz). Azure Pronunciation Assessment requiere exactamente 16000 Hz.`,
          errorCode: 'UNSUPPORTED_SAMPLE_RATE',
          numChannels,
          sampleRate,
          bitsPerSample
        };
      }

      if (bitsPerSample !== 16) {
        return {
          isValid: false,
          error: `Profundidad de bits WAV no admitida (${bitsPerSample}-bit). Azure Pronunciation Assessment requiere exactamente PCM de 16 bits.`,
          errorCode: 'UNSUPPORTED_BIT_DEPTH',
          numChannels,
          sampleRate,
          bitsPerSample
        };
      }
    } else if (chunkId === 'data') {
      hasData = true;
      dataSize = chunkSize;

      if (dataSize <= 0) {
        return {
          isValid: false,
          error: 'El subfragmento de datos WAV está vacío (0 muestras de audio).',
          errorCode: 'EMPTY_AUDIO'
        };
      }

      if (bitsPerSample === 16 && dataSize % 2 !== 0) {
        return {
          isValid: false,
          error: 'Tamaño de subfragmento de datos WAV incongruente para audio de 16 bits (número impar de bytes).',
          errorCode: 'MALFORMED_WAV_DATA'
        };
      }
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) {
      offset += 1; // 16-bit word alignment
    }
  }

  if (!hasFmt || !hasData) {
    return {
      isValid: false,
      error: 'Estructura WAV incompleta: falta el subfragmento "fmt " o "data".',
      errorCode: 'MALFORMED_WAV_HEADER'
    };
  }

  return {
    isValid: true,
    numChannels,
    sampleRate,
    bitsPerSample,
    dataSize
  };
}

export default async function handler(req: any, res?: any) {
  if (req.method === 'OPTIONS') {
    if (res?.status) {
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(204).end();
    }
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    const errObj = { success: false, error: 'Method not allowed. Use POST.', errorCode: 'METHOD_NOT_ALLOWED' };
    if (res?.status) {
      return res.status(405).json(errObj);
    }
    return new Response(JSON.stringify(errObj), { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  // Early content-length check
  const rawContentLength = req.headers?.['content-length'] || req.headers?.get?.('content-length');
  if (rawContentLength) {
    const contentLength = parseInt(rawContentLength, 10);
    if (!isNaN(contentLength) && contentLength > MAX_AUDIO_BYTES + 8192) {
      const err = {
        success: false,
        error: `Request payload (${(contentLength / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
        errorCode: 'PAYLOAD_TOO_LARGE'
      };
      return res?.status ? res.status(413).json(err) : new Response(JSON.stringify(err), { status: 413, headers: CORS_HEADERS });
    }
  }

  const clientId = getClientIdentifier(req);
  if (!checkRateLimit(clientId)) {
    const err = {
      success: false,
      error: 'Rate limit exceeded. Please wait a minute before retrying.',
      errorCode: 'RATE_LIMITED',
      guidance: 'Has realizado demasiadas solicitudes seguidas. Espera un momento antes de volver a intentarlo.'
    };
    return res?.status ? res.status(429).json(err) : new Response(JSON.stringify(err), { status: 429, headers: CORS_HEADERS });
  }

  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION || 'eastus';

  if (!azureKey) {
    const errObj = {
      success: false,
      error: 'Azure Speech credentials are not configured on the server.',
      errorCode: 'AZURE_NOT_CONFIGURED',
      guidance: 'El servicio de evaluación Azure Speech no está configurado en el servidor. Usa el modo local aproximado.'
    };
    if (res?.status) {
      return res.status(503).json(errObj);
    }
    return new Response(JSON.stringify(errObj), { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }

  try {
    let totalBytes = 0;
    const chunks: Uint8Array[] = [];
    if (req.body && typeof req.body.getReader === 'function') {
      const reader = req.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > MAX_AUDIO_BYTES + 8192) {
            reader.cancel();
            try { if (typeof req.destroy === 'function') req.destroy(); } catch { /* ignore */ }
            const err = {
              success: false,
              error: `Request stream exceeded maximum size limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
              errorCode: 'PAYLOAD_TOO_LARGE'
            };
            return res?.status ? res.status(413).json(err) : new Response(JSON.stringify(err), { status: 413, headers: CORS_HEADERS });
          }
          chunks.push(value);
        }
      }
    } else if (req[Symbol.asyncIterator]) {
      for await (const chunk of req) {
        const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        totalBytes += buf.length;
        if (totalBytes > MAX_AUDIO_BYTES + 8192) {
          try { if (typeof req.destroy === 'function') req.destroy(); } catch { /* ignore */ }
          const err = {
            success: false,
            error: `Request stream exceeded maximum size limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
            errorCode: 'PAYLOAD_TOO_LARGE'
          };
          return res?.status ? res.status(413).json(err) : new Response(JSON.stringify(err), { status: 413, headers: CORS_HEADERS });
        }
        chunks.push(buf);
      }
    } else if (req.body && Buffer.isBuffer(req.body)) {
      if (req.body.length > MAX_AUDIO_BYTES + 8192) {
        try { if (typeof req.destroy === 'function') req.destroy(); } catch { /* ignore */ }
        const err = {
          success: false,
          error: `Request payload exceeded maximum size limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`,
          errorCode: 'PAYLOAD_TOO_LARGE'
        };
        return res?.status ? res.status(413).json(err) : new Response(JSON.stringify(err), { status: 413, headers: CORS_HEADERS });
      }
      chunks.push(req.body);
    }

    const totalBuffer = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || req.headers?.get?.('content-type') || '';

    const fakeReq = new Request('http://localhost/api/assess-pronunciation', {
      method: 'POST',
      headers: {
        'content-type': contentType
      },
      body: totalBuffer
    });

    const formData = await fakeReq.formData();
    const audioEntry = formData.get('audio') as File | null;
    const referenceTextRaw = formData.get('referenceText') as string | null;
    const localeRaw = formData.get('locale') as string | null;

    if (!audioEntry) {
      const err = { success: false, error: "Missing 'audio' file in form data.", errorCode: 'MISSING_AUDIO' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
    }

    if (!referenceTextRaw || referenceTextRaw.trim().length === 0) {
      const err = { success: false, error: "Missing 'referenceText' parameter.", errorCode: 'MISSING_REFERENCE_TEXT' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
    }

    const referenceText = referenceTextRaw.trim();
    if (referenceText.length > MAX_TEXT_LENGTH) {
      const err = { success: false, error: `Reference text exceeds maximum length of ${MAX_TEXT_LENGTH} chars.`, errorCode: 'TEXT_TOO_LONG' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
    }

    const locale = (localeRaw?.trim() || 'es-ES') as 'es-ES' | 'es-MX';
    if (!ALLOWED_LOCALES.has(locale)) {
      const err = { success: false, error: `Unsupported locale '${locale}'. Supported: 'es-ES' and 'es-MX'.`, errorCode: 'INVALID_LOCALE' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
    }

    const audioBytes = Buffer.from(await audioEntry.arrayBuffer());
    if (audioBytes.length < MIN_AUDIO_BYTES) {
      const err = { success: false, error: 'Audio recording is empty or too short.', errorCode: 'EMPTY_AUDIO', guidance: 'No se detectó audio suficiente.' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
    }

    if (audioBytes.length > MAX_AUDIO_BYTES) {
      const err = { success: false, error: `Audio size exceeds limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`, errorCode: 'AUDIO_TOO_LARGE' };
      return res?.status ? res.status(413).json(err) : new Response(JSON.stringify(err), { status: 413, headers: CORS_HEADERS });
    }

    // Inspect magic bytes to prevent mislabeling audio
    const isRiffWav = audioBytes.length >= 12 &&
      audioBytes[0] === 0x52 && audioBytes[1] === 0x49 && audioBytes[2] === 0x46 && audioBytes[3] === 0x46 &&
      audioBytes[8] === 0x57 && audioBytes[9] === 0x41 && audioBytes[10] === 0x56 && audioBytes[11] === 0x45;

    const isOggOpus = audioBytes.length >= 4 &&
      audioBytes[0] === 0x4f && audioBytes[1] === 0x67 && audioBytes[2] === 0x67 && audioBytes[3] === 0x53;

    const isWebm = audioBytes.length >= 4 &&
      audioBytes[0] === 0x1a && audioBytes[1] === 0x45 && audioBytes[2] === 0xdf && audioBytes[3] === 0xa3;

    let audioContentType = '';
    if (isRiffWav) {
      const wavValidation = validateWavHeader(audioBytes);
      if (!wavValidation.isValid) {
        const err = {
          success: false,
          error: wavValidation.error || 'Archivo WAV no compatible o malformado.',
          errorCode: wavValidation.errorCode || 'INVALID_WAV_FORMAT',
          guidance: 'El archivo WAV debe ser PCM lineal de 16-bit, 16000 Hz y mono (1 canal).'
        };
        return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
      }
      audioContentType = 'audio/wav; codecs=audio/pcm; samplerate=16000';
    } else if (isOggOpus) {
      audioContentType = 'audio/ogg; codecs=opus';
    } else if (isWebm) {
      const err = {
        success: false,
        error: 'El formato WebM directo no es admitido por la API REST de Azure Speech. Debe convertirse a WAV 16kHz mono.',
        errorCode: 'UNSUPPORTED_AUDIO_FORMAT',
        guidance: 'Formato de audio no compatible. Asegúrate de que el conversor a WAV esté activo.'
      };
      return res?.status ? res.status(415).json(err) : new Response(JSON.stringify(err), { status: 415, headers: CORS_HEADERS });
    } else {
      const err = {
        success: false,
        error: 'Formato de audio no reconocido o dañado. Se requiere WAV PCM o OGG Opus genuino.',
        errorCode: 'INVALID_AUDIO_FORMAT'
      };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
    }

    // Assessment config without non-GUID ScenarioId
    const assessmentConfig = {
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
      EnableMiscue: true
    };

    const configBase64 = Buffer.from(JSON.stringify(assessmentConfig)).toString('base64');
    // Azure Speech Pronunciation Assessment REST endpoint with format=detailed
    const azureEndpoint = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}&format=detailed`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let azureRes: Response;
    try {
      azureRes = await fetch(azureEndpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Pronunciation-Assessment': configBase64,
          'Content-Type': audioContentType,
          'Accept': 'application/json',
        },
        body: audioBytes,
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = (fetchErr as { name?: string })?.name === 'AbortError';
      const err = {
        success: false,
        error: isAbort ? 'Azure Speech request timed out.' : 'Network failure contacting Azure Speech service.',
        errorCode: isAbort ? 'TIMEOUT' : 'PROVIDER_NETWORK_ERROR',
        guidance: 'Tiempo de espera agotado o error de conexión con Azure.'
      };
      const code = isAbort ? 504 : 502;
      return res?.status ? res.status(code).json(err) : new Response(JSON.stringify(err), { status: code, headers: CORS_HEADERS });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!azureRes.ok) {
      let errorCode = 'AZURE_ERROR';
      let errorMsg = `Azure Speech returned HTTP ${azureRes.status}`;
      let guidance = 'Ocurrió un error en el proveedor de evaluación de voz.';

      if (azureRes.status === 401) {
        errorCode = 'AZURE_UNAUTHORIZED';
        errorMsg = 'Invalid or expired Azure Speech key.';
        guidance = 'Clave de Azure Speech inválida o expirada en el servidor.';
      } else if (azureRes.status === 403) {
        errorCode = 'AZURE_QUOTA_EXCEEDED';
        errorMsg = 'Azure Speech resource limit or quota exceeded.';
        guidance = 'Límite de cuota del servicio Azure alcanzado temporalmente.';
      } else if (azureRes.status === 429) {
        errorCode = 'AZURE_RATE_LIMITED';
        errorMsg = 'Azure Speech rate limit exceeded.';
        guidance = 'Demasiadas peticiones simultáneas a Azure. Espera un momento.';
      } else if (azureRes.status === 400) {
        errorCode = 'AZURE_BAD_AUDIO';
        errorMsg = 'Azure rejected the audio format.';
        guidance = 'Formato de audio no reconocido por Azure. Habla claro y prueba de nuevo.';
      }

      const err = { success: false, error: errorMsg, errorCode, guidance };
      const code = azureRes.status >= 500 ? 502 : azureRes.status;
      return res?.status ? res.status(code).json(err) : new Response(JSON.stringify(err), { status: code, headers: CORS_HEADERS });
    }

    const azureData = (await azureRes.json()) as any;
    const recognitionStatus = (azureData?.RecognitionStatus as string) || 'Unknown';

    if (recognitionStatus === 'InitialSilenceTimeout' || recognitionStatus === 'NoMatch' || recognitionStatus === 'BabbleTimeout') {
      const isSilence = recognitionStatus === 'InitialSilenceTimeout';
      const guidance = isSilence
        ? 'No se detectó voz al inicio de la grabación. Habla inmediatamente tras pulsar el botón.'
        : 'Se detectó ruido o voz poco clara. Acércate al micrófono e inténtalo de nuevo.';

      const payload = {
        success: false,
        provider: 'azure',
        locale,
        recognitionStatus,
        error: isSilence ? 'No speech detected (silence timeout).' : 'No speech recognized (unclear audio).',
        errorCode: isSilence ? 'INITIAL_SILENCE_TIMEOUT' : 'NO_SPEECH_DETECTED',
        guidance,
        words: []
      };
      return res?.status ? res.status(200).json(payload) : new Response(JSON.stringify(payload), { status: 200, headers: CORS_HEADERS });
    }

    const bestResult = azureData.NBest?.[0];
    const assessment = bestResult?.PronunciationAssessment;

    if (!assessment) {
      const err = {
        success: false,
        error: 'Azure recognized speech but did not return pronunciation assessment metrics.',
        errorCode: 'NO_ASSESSMENT_METRICS',
        recognitionStatus,
        displayText: azureData.DisplayText
      };
      return res?.status ? res.status(502).json(err) : new Response(JSON.stringify(err), { status: 502, headers: CORS_HEADERS });
    }

    const words = (bestResult.Words || []).map((w: any) => {
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
        errorType: wAssessment.ErrorType || 'None',
        phonemes: phonemes.length > 0 ? phonemes : undefined,
        syllables: syllables.length > 0 ? syllables : undefined
      };
    });

    const responsePayload = {
      success: true,
      provider: 'azure',
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

    return res?.status
      ? res.status(200).json(responsePayload)
      : new Response(JSON.stringify(responsePayload), { status: 200, headers: CORS_HEADERS });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errObj = { success: false, error: `Server error: ${errorMsg}`, errorCode: 'INTERNAL_SERVER_ERROR' };
    return res?.status ? res.status(500).json(errObj) : new Response(JSON.stringify(errObj), { status: 500, headers: CORS_HEADERS });
  }
}
