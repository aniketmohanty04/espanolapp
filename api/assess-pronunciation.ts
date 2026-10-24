// Serverless Function: /api/assess-pronunciation
// Node / Vercel compatible endpoint for Azure AI Speech Pronunciation Assessment.
// Reads AZURE_SPEECH_KEY and AZURE_SPEECH_REGION strictly from server environment secrets.

export const config = {
  api: {
    bodyParser: false, // Handle raw multipart streams
  },
};

const ALLOWED_LOCALES = new Set(['es-ES', 'es-MX']);
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500;
const TIMEOUT_MS = 12000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req: any, res?: any) {
  // Support both standard Fetch Request/Response and Node IncomingMessage/ServerResponse
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
    // Read body chunks
    const chunks: Uint8Array[] = [];
    if (req.body && typeof req.body.getReader === 'function') {
      const reader = req.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } else if (req[Symbol.asyncIterator]) {
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
    } else if (req.body && Buffer.isBuffer(req.body)) {
      chunks.push(req.body);
    }

    const totalBuffer = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] || req.headers?.get?.('content-type') || '';

    // Create a temporary Request object to parse FormData cleanly
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
    if (audioBytes.length === 0) {
      const err = { success: false, error: 'Audio recording is empty (0 bytes).', errorCode: 'EMPTY_AUDIO', guidance: 'No se detectó audio.' };
      return res?.status ? res.status(400).json(err) : new Response(JSON.stringify(err), { status: 400, headers: CORS_HEADERS });
    }

    if (audioBytes.length > MAX_AUDIO_BYTES) {
      const err = { success: false, error: `Audio size exceeds limit of ${MAX_AUDIO_BYTES / 1024 / 1024}MB.`, errorCode: 'AUDIO_TOO_LARGE' };
      return res?.status ? res.status(413).json(err) : new Response(JSON.stringify(err), { status: 413, headers: CORS_HEADERS });
    }

    const assessmentConfig = {
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
      EnableMiscue: true,
      ScenarioId: 'espanolapp-v1'
    };

    const configBase64 = Buffer.from(JSON.stringify(assessmentConfig)).toString('base64');
    const azureEndpoint = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}`;

    let audioContentType = audioEntry.type || 'audio/wav';
    if (!audioContentType || audioContentType === 'application/octet-stream') {
      audioContentType = 'audio/wav; codecs=audio/pcm; samplerate=16000';
    }

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
      }

      const err = { success: false, error: errorMsg, errorCode, guidance };
      const code = azureRes.status >= 500 ? 502 : azureRes.status;
      return res?.status ? res.status(code).json(err) : new Response(JSON.stringify(err), { status: code, headers: CORS_HEADERS });
    }

    const azureData = (await azureRes.json()) as any;
    const recognitionStatus = (azureData?.RecognitionStatus as string) || 'Unknown';

    if (recognitionStatus === 'InitialSilenceTimeout' || recognitionStatus === 'NoMatch' || recognitionStatus === 'BabbleTimeout') {
      const guidance = recognitionStatus === 'InitialSilenceTimeout'
        ? 'No se detectó voz al inicio de la grabación. Habla inmediatamente tras pulsar el botón.'
        : 'Se detectó ruido o voz poco clara. Acércate al micrófono e inténtalo de nuevo.';

      const payload = {
        success: true,
        provider: 'azure',
        locale,
        recognitionStatus,
        guidance,
        scores: { pronunciationScore: 0, accuracyScore: 0, fluencyScore: 0, completenessScore: 0 },
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
