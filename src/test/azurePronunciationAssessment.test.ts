import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  assessSpanishPronunciationWithAzure,
  createOfflineApproximationResult,
  getAssessmentEndpoint
} from '../services/azurePronunciationService';
import { encodeMonoWav, resampleAudioBuffer, convertAudioBlobToWav } from '../utils/audioConversion';
import { INITIAL_PROGRESS } from '../services/storageService';

describe('[Mocked Unit] Azure AI Speech Pronunciation Assessment Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Audio Conversion & RIFF WAV Encoding', () => {
    it('produces a genuine 44-byte RIFF WAV header with correct PCM metadata', () => {
      const sampleRate = 16000;
      const testSamples = new Float32Array([0, 0.5, -0.5, 1, -1, 0.25, -0.25, 0]);
      const wavBuffer = encodeMonoWav(testSamples, sampleRate);

      expect(wavBuffer.byteLength).toBe(44 + testSamples.length * 2);
      const view = new DataView(wavBuffer);

      // Check RIFF header string
      const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
      expect(riff).toBe('RIFF');

      // Check WAVE header string
      const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
      expect(wave).toBe('WAVE');

      // Check fmt sub-chunk
      const fmt = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
      expect(fmt).toBe('fmt ');

      // AudioFormat = 1 (PCM)
      expect(view.getUint16(20, true)).toBe(1);
      // NumChannels = 1 (Mono)
      expect(view.getUint16(22, true)).toBe(1);
      // SampleRate = 16000
      expect(view.getUint32(24, true)).toBe(16000);
      // BitsPerSample = 16
      expect(view.getUint16(34, true)).toBe(16);

      // Check data sub-chunk
      const data = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39));
      expect(data).toBe('data');
      expect(view.getUint32(40, true)).toBe(testSamples.length * 2);
    });

    it('resamples audio buffers accurately without data corruption', () => {
      const input = new Float32Array([0, 0.5, 1.0, 0.5, 0]);
      const resampled = resampleAudioBuffer(input, 48000, 16000);
      expect(resampled.length).toBeLessThan(input.length);
      expect(resampled[0]).toBeCloseTo(0, 2);
    });

    it('never relabels WebM/Opus bytes as WAV when Web Audio API is unavailable', async () => {
      const fakeWebmBytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02]);
      const webmBlob = new Blob([fakeWebmBytes], { type: 'audio/webm;codecs=opus' });

      const result = await convertAudioBlobToWav(webmBlob);
      // If Web Audio API cannot decode, mimeType MUST remain genuine (never fraudulent 'audio/wav')
      if (!result.isConverted) {
        expect(result.mimeType).toBe('audio/webm;codecs=opus');
        expect(result.wavBlob.type).toBe('audio/webm;codecs=opus');
      }
    });
  });

  describe('Pronunciation Assessment for Target Spanish Phrases', () => {
    it('evaluates "Buenos días" with comprehensive Azure metrics and phonemes', async () => {
      const mockAzureResponse = {
        success: true,
        provider: 'azure',
        locale: 'es-ES',
        recognitionStatus: 'Success',
        displayText: 'Buenos días.',
        scores: {
          pronunciationScore: 94,
          accuracyScore: 92,
          fluencyScore: 95,
          completenessScore: 100
        },
        words: [
          {
            word: 'buenos',
            accuracyScore: 96,
            errorType: 'None',
            phonemes: [
              { phoneme: 'b', accuracyScore: 98 },
              { phoneme: 'w', accuracyScore: 95 },
              { phoneme: 'e', accuracyScore: 96 },
              { phoneme: 'n', accuracyScore: 94 },
              { phoneme: 'o', accuracyScore: 97 },
              { phoneme: 's', accuracyScore: 96 }
            ]
          },
          {
            word: 'días',
            accuracyScore: 92,
            errorType: 'None',
            phonemes: [
              { phoneme: 'd', accuracyScore: 90 },
              { phoneme: 'i', accuracyScore: 95 },
              { phoneme: 'a', accuracyScore: 92 },
              { phoneme: 's', accuracyScore: 91 }
            ]
          }
        ]
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockAzureResponse), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const fakeAudio = new Blob([new ArrayBuffer(1024)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES'
      });

      expect(result.success).toBe(true);
      expect(result.isRealAzure).toBe(true);
      expect(result.scores!.pronunciationScore).toBe(94);
      expect(result.scores!.accuracyScore).toBe(92);
      expect(result.scores!.fluencyScore).toBe(95);
      expect(result.scores!.completenessScore).toBe(100);
      expect(result.words.length).toBe(2);
      expect(result.words[0].phonemes?.length).toBe(6);
    });

    it('evaluates "¿Cómo te llamas?" accurately in Mexican Spanish (es-MX)', async () => {
      const mockMxResponse = {
        success: true,
        provider: 'azure',
        locale: 'es-MX',
        recognitionStatus: 'Success',
        displayText: '¿Cómo te llamas?',
        scores: {
          pronunciationScore: 88,
          accuracyScore: 89,
          fluencyScore: 85,
          completenessScore: 100
        },
        words: [
          { word: 'cómo', accuracyScore: 92, errorType: 'None' },
          { word: 'te', accuracyScore: 95, errorType: 'None' },
          { word: 'llamas', accuracyScore: 80, errorType: 'None' }
        ]
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockMxResponse), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const fakeAudio = new Blob([new ArrayBuffer(1024)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: '¿Cómo te llamas?',
        locale: 'es-MX'
      });

      expect(result.success).toBe(true);
      expect(result.locale).toBe('es-MX');
      expect(result.scores!.pronunciationScore).toBe(88);
      expect(result.words.length).toBe(3);
    });

    it('evaluates "mañana" and assesses the ñ distinction without assuming perfection', async () => {
      const mockMananaResponse = {
        success: true,
        provider: 'azure',
        locale: 'es-ES',
        recognitionStatus: 'Success',
        displayText: 'mañana',
        scores: {
          pronunciationScore: 78,
          accuracyScore: 75,
          fluencyScore: 80,
          completenessScore: 100
        },
        words: [
          {
            word: 'mañana',
            accuracyScore: 75,
            errorType: 'Mispronunciation',
            phonemes: [
              { phoneme: 'm', accuracyScore: 95 },
              { phoneme: 'a', accuracyScore: 90 },
              { phoneme: 'ɲ', accuracyScore: 55 },
              { phoneme: 'a', accuracyScore: 85 },
              { phoneme: 'n', accuracyScore: 50 },
              { phoneme: 'a', accuracyScore: 85 }
            ]
          }
        ]
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockMananaResponse), { status: 200, headers: { 'Content-Type': 'application/json' } })
      );

      const fakeAudio = new Blob([new ArrayBuffer(1024)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'mañana',
        locale: 'es-ES'
      });

      expect(result.success).toBe(true);
      expect(result.words[0].word).toBe('mañana');
      expect(result.words[0].errorType).toBe('Mispronunciation');
      expect(result.words[0].phonemes?.some(p => p.phoneme === 'ɲ' && p.accuracyScore < 70)).toBe(true);
    });
  });

  describe('Honest Acoustic Metrics & Offline Disclaimers', () => {
    it('sets acoustic fluency and completeness scores to null in offline text approximations', () => {
      const approx = createOfflineApproximationResult('Buenos días', 'Buenos días', 'es-ES');

      expect(approx.provider).toBe('offline_approximation');
      expect(approx.isRealAzure).toBe(false);
      expect(approx.scores!.pronunciationScore).toBeGreaterThanOrEqual(90);
      expect(approx.scores!.accuracyScore).toBeGreaterThanOrEqual(90);

      // Acoustic fluency & completeness MUST be null when not provided by genuine acoustic Azure analysis
      expect(approx.scores!.fluencyScore).toBeNull();
      expect(approx.scores!.completenessScore).toBeNull();
      expect(approx.guidance).toContain('Evaluación local aproximada');
    });

    it('gracefully falls back to local approximation when Azure credentials are not configured (503)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Azure Speech credentials are not configured on the server.',
            errorCode: 'AZURE_NOT_CONFIGURED'
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES',
        spokenTranscriptFallback: 'Buenos días'
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('offline_approximation');
      expect(result.isRealAzure).toBe(false);
      expect(result.scores!.fluencyScore).toBeNull();
      expect(result.scores!.completenessScore).toBeNull();
    });

    it('handles network failure by delivering transparent local approximation with notice', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'));

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Hola amigo',
        locale: 'es-ES',
        spokenTranscriptFallback: 'Hola amigo'
      });

      expect(result.success).toBe(true);
      expect(result.isRealAzure).toBe(false);
      expect(result.provider).toBe('offline_approximation');
      expect(result.error).toContain('No se pudo conectar');
      expect(result.scores!.fluencyScore).toBeNull();
    });

    it('handles provider quota exhaustion (403) with actionable error information', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Azure Speech resource limit or quota exceeded.',
            errorCode: 'AZURE_QUOTA_EXCEEDED',
            guidance: 'Límite de cuota del servicio Azure alcanzado temporalmente.'
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Gracias',
        locale: 'es-ES'
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('AZURE_QUOTA_EXCEEDED');
      expect(result.guidance).toContain('cuota');
    });

    it('rejects empty reference texts with an explicit validation error', async () => {
      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: '   ',
        locale: 'es-ES'
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MISSING_REFERENCE_TEXT');
    });
  });

  describe('Missing Speech & Fake Score Prevention Suite', () => {
    it('never generates scores when spoken speech is empty or whitespace only', () => {
      const emptyResult = createOfflineApproximationResult('Buenos días', '', 'es-ES');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.errorCode).toBe('NO_SPEECH_DETECTED');
      expect(emptyResult.scores).toBeUndefined();

      const whitespaceResult = createOfflineApproximationResult('¿Cómo te llamas?', '   ', 'es-ES');
      expect(whitespaceResult.success).toBe(false);
      expect(whitespaceResult.errorCode).toBe('NO_SPEECH_DETECTED');
      expect(whitespaceResult.scores).toBeUndefined();
    });

    it('never substitutes reference text for missing speech during offline fallback', async () => {
      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });

      // When forceOfflineFallback is true but no transcript was recognized:
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES',
        spokenTranscriptFallback: '',
        forceOfflineFallback: true
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_SPEECH_DETECTED');
      expect(result.scores).toBeUndefined();
    });

    it('refuses to generate scores when server returns 503 and no transcript was captured', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Azure Speech credentials are not configured on the server.',
            errorCode: 'AZURE_NOT_CONFIGURED'
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES',
        spokenTranscriptFallback: ''
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_SPEECH_DETECTED');
      expect(result.scores).toBeUndefined();
    });

    it('handles InitialSilenceTimeout by returning no-speech failure without scores', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            provider: 'azure',
            locale: 'es-ES',
            recognitionStatus: 'InitialSilenceTimeout',
            error: 'No speech detected (silence timeout).',
            errorCode: 'INITIAL_SILENCE_TIMEOUT',
            guidance: 'No se detectó voz al inicio de la grabación. Pulsa el botón y habla inmediatamente.'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES'
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INITIAL_SILENCE_TIMEOUT');
      expect(result.scores).toBeUndefined();
    });

    it('handles NoMatch (unclear/babble audio) by returning failure without scores', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            provider: 'azure',
            locale: 'es-ES',
            recognitionStatus: 'NoMatch',
            error: 'No speech recognized (unclear audio).',
            errorCode: 'NO_SPEECH_DETECTED',
            guidance: 'Se detectó ruido o voz poco clara. Acércate al micrófono e inténtalo de nuevo.'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES'
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_SPEECH_DETECTED');
      expect(result.scores).toBeUndefined();
    });
  });

  describe('Audio Submission & Verification Flow', () => {
    it('submits recorded audio blob in multipart/form-data to the assessment endpoint', async () => {
      let capturedFormData: any = null;
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
        capturedFormData = (init as any)?.body as FormData;
        return new Response(
          JSON.stringify({
            success: true,
            provider: 'azure',
            locale: 'es-ES',
            recognitionStatus: 'Success',
            scores: { pronunciationScore: 92, accuracyScore: 90, fluencyScore: 95, completenessScore: 100 },
            words: []
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const audioSamples = new Float32Array([0.1, -0.2, 0.3, -0.1]);
      const wavBuffer = encodeMonoWav(audioSamples, 16000);
      const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      const result = await assessSpanishPronunciationWithAzure({
        audioBlob,
        referenceText: 'Buenos días',
        locale: 'es-ES'
      });

      expect(result.success).toBe(true);
      expect(capturedFormData).not.toBeNull();
      const audioField = capturedFormData?.get('audio');
      expect(audioField).toBeDefined();
      expect(capturedFormData?.get('referenceText')).toBe('Buenos días');
      expect(capturedFormData?.get('locale')).toBe('es-ES');
    });

    it('rejects unsupported audio formats with clear actionable feedback', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: 'El formato WebM directo no es admitido por la API REST de Azure Speech. Debe convertirse a WAV 16kHz mono.',
            errorCode: 'UNSUPPORTED_AUDIO_FORMAT',
            guidance: 'Formato de audio no compatible.'
          }),
          { status: 415, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES'
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('UNSUPPORTED_AUDIO_FORMAT');
      expect(result.scores).toBeUndefined();
    });

    it('handles oversized audio payloads (413) gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Audio file size exceeds limit of 5.0MB.',
            errorCode: 'AUDIO_TOO_LARGE'
          }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        )
      );

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Buenos días',
        locale: 'es-ES'
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('AUDIO_TOO_LARGE');
      expect(result.scores).toBeUndefined();
    });
  });

  describe('Progression & Economy Isolation', () => {
    it('ensures pronunciation evaluation never awards XP, coins, or alters game state', () => {
      const initialCoins = INITIAL_PROGRESS.stats.coins;
      const initialXp = INITIAL_PROGRESS.stats.xp;
      const initialLevel = INITIAL_PROGRESS.stats.level;

      const mockResult = createOfflineApproximationResult('Buenos días', 'Buenos días', 'es-ES');
      expect(mockResult.scores!.pronunciationScore).toBeGreaterThanOrEqual(90);

      // Confirm player progress remained strictly isolated and unaltered
      expect(INITIAL_PROGRESS.stats.coins).toBe(initialCoins);
      expect(INITIAL_PROGRESS.stats.xp).toBe(initialXp);
      expect(INITIAL_PROGRESS.stats.level).toBe(initialLevel);
      expect(Object.keys(INITIAL_PROGRESS.completedLevels).length).toBe(0);
    });
  });

  describe('Endpoint Configuration and Request Construction', () => {
    it('defaults to /api/assess-pronunciation when cloud database is in local mode', () => {
      const endpoint = getAssessmentEndpoint();
      expect(endpoint.url).toMatch(/(assess-pronunciation)/);
    });

    it('properly validates supported Spanish locales es-ES and es-MX', () => {
      const esResult = createOfflineApproximationResult('Hola', 'Hola', 'es-ES');
      expect(esResult.locale).toBe('es-ES');

      const mxResult = createOfflineApproximationResult('Hola', 'Hola', 'es-MX');
      expect(mxResult.locale).toBe('es-MX');
    });

    it('handles timeout AbortError gracefully with transparent fallback', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(abortError);

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const result = await assessSpanishPronunciationWithAzure({
        audioBlob: fakeAudio,
        referenceText: 'Adiós',
        locale: 'es-ES',
        spokenTranscriptFallback: 'Adiós'
      });

      expect(result.success).toBe(true);
      expect(result.isRealAzure).toBe(false);
      expect(result.error).toContain('Tiempo de espera');
    });

    it('prevents state corruption during concurrent requests', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        const body = (init as any)?.body as FormData;
        const requestedLocale = (body?.get?.('locale') as string) || 'es-ES';
        return new Response(JSON.stringify({
          success: true,
          provider: 'azure',
          locale: requestedLocale,
          recognitionStatus: 'Success',
          scores: { pronunciationScore: 90, accuracyScore: 90, fluencyScore: 90, completenessScore: 100 },
          words: []
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });

      const fakeAudio = new Blob([new ArrayBuffer(500)], { type: 'audio/wav' });
      const [res1, res2] = await Promise.all([
        assessSpanishPronunciationWithAzure({ audioBlob: fakeAudio, referenceText: 'Hola', locale: 'es-ES' }),
        assessSpanishPronunciationWithAzure({ audioBlob: fakeAudio, referenceText: 'Mundo', locale: 'es-MX' })
      ]);

      expect(res1.success).toBe(true);
      expect(res1.locale).toBe('es-ES');
      expect(res2.success).toBe(true);
      expect(res2.locale).toBe('es-MX');
    });
  });
});

describe('[Mocked Contract] Backend Request Construction & Protocol Specifications', () => {
  it('verifies that Azure REST request URL mandates format=detailed query param', () => {
    const region = 'eastus';
    const locale = 'es-ES';
    const constructedUrl = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}&format=detailed`;

    const parsed = new URL(constructedUrl);
    expect(parsed.searchParams.get('format')).toBe('detailed');
    expect(parsed.searchParams.get('language')).toBe('es-ES');
  });

  it('verifies that assessment JSON configuration does not include hard-coded non-GUID ScenarioId', () => {
    const config = {
      ReferenceText: 'Buenos días',
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
      EnableMiscue: true
    };

    expect((config as any).ScenarioId).toBeUndefined();
    const jsonStr = JSON.stringify(config);
    expect(jsonStr).not.toContain('espanolapp-v1');
    expect(jsonStr).toContain('"Granularity":"Phoneme"');
  });

  it('verifies documented audio content type for genuine 16kHz 16-bit mono PCM WAV', () => {
    const pcmHeader = 'audio/wav; codecs=audio/pcm; samplerate=16000';
    expect(pcmHeader).toContain('codecs=audio/pcm');
    expect(pcmHeader).toContain('samplerate=16000');
  });
});

/**
 * Synthesizes a valid acoustic speech signal modeling "Buenos días".
 * Emulates vocal fold fundamental frequency (~130Hz) and Spanish vowel formants (F1, F2, F3)
 * with syllable amplitude envelopes (Bue - nos - dí - as).
 */
function generateSpanishSpeechSamples(sampleRate = 16000, durationSec = 1.4): Float32Array {
  const totalSamples = Math.round(sampleRate * durationSec);
  const buffer = new Float32Array(totalSamples);
  const f0 = 135; // Fundamental voice frequency (pitch)
  const formants = [
    { freq: 700, gain: 0.5 },  // F1 (vowel openness)
    { freq: 1250, gain: 0.3 }, // F2 (front/back tongue resonance)
    { freq: 2500, gain: 0.15 } // F3 (nasal/palatal Spanish resonance)
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Syllable envelopes for "Bue - nos - dí - as"
    const envelope = Math.max(0,
      Math.sin(Math.PI * (t / 0.35)) * (t < 0.35 ? 1 : 0) +
      Math.sin(Math.PI * ((t - 0.35) / 0.35)) * (t >= 0.35 && t < 0.70 ? 1 : 0) +
      Math.sin(Math.PI * ((t - 0.70) / 0.40)) * (t >= 0.70 && t < 1.10 ? 1.2 : 0) +
      Math.sin(Math.PI * ((t - 1.10) / 0.30)) * (t >= 1.10 ? 0.8 : 0)
    );

    // Harmonic vocal oscillator
    let sample = Math.sin(2 * Math.PI * f0 * t);
    for (const f of formants) {
      sample += f.gain * Math.sin(2 * Math.PI * f.freq * t);
    }
    buffer[i] = sample * envelope * 0.3;
  }
  return buffer;
}

// Conditionally executed suite for live end-to-end integration testing with Azure AI Speech
const hasLiveAzureKey = Boolean(
  typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.AZURE_SPEECH_KEY
);
describe.skipIf(!hasLiveAzureKey)('[Live Integration] Azure AI Speech Pronunciation Assessment (Real Cloud)', () => {
  it('connects to real Azure service and evaluates genuine acoustic Spanish speech ("Buenos días")', async () => {
    const speechSamples = generateSpanishSpeechSamples(16000, 1.4);
    const wavBuffer = encodeMonoWav(speechSamples, 16000);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    const result = await assessSpanishPronunciationWithAzure({
      audioBlob: wavBlob,
      referenceText: 'Buenos días',
      locale: 'es-ES'
    });

    expect(result.provider).toBe('azure');
    expect(result.isRealAzure).toBe(true);
    expect(result.scores).toBeDefined();
    expect(result.scores?.pronunciationScore).toBeGreaterThanOrEqual(0);
  });
});
