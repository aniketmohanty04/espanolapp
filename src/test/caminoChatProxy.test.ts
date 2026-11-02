import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/camino-chat';

declare const process: any;

describe('Serverless /api/camino-chat Proxy Endpoint', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  function createMockRes() {
    const res: any = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      setHeader: (key: string, val: string) => {
        res.headers[key.toLowerCase()] = val;
      },
      end: vi.fn(),
      jsonBody: null as any
    };
    res.end.mockImplementation((data?: any) => {
      if (data) {
        try {
          res.jsonBody = JSON.parse(data);
        } catch {
          res.jsonBody = data;
        }
      }
    });
    return res;
  }

  it('handles OPTIONS preflight with 204 status and CORS headers', async () => {
    const req = { method: 'OPTIONS' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('rejects non-POST methods with 405 Method Not Allowed', async () => {
    const req = { method: 'GET' };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.jsonBody?.error).toContain('Method not allowed');
  });

  it('returns 500 error if no Gemini API key is configured on server', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.VITE_GEMINI_API_KEY;

    const req = {
      method: 'POST',
      body: { prompt: '¿Cómo estás?' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody?.error).toContain('Gemini API key is not configured');
  });

  it('returns 400 error if prompt is missing in chat action', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';

    const req = {
      method: 'POST',
      body: { action: 'chat' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody?.error).toContain('prompt is required');
  });

  it('proxies chat query to Google Gemini and returns structured response', async () => {
    process.env.GEMINI_API_KEY = 'mock-secret-server-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    text: '¡Hola! En español decimos buenas noches.',
                    spanishText: 'Buenas noches',
                    englishText: 'Good evening / good night'
                  })
                }
              ]
            }
          }
        ]
      })
    }));

    const req = {
      method: 'POST',
      body: { prompt: 'How to say good night?' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody?.spanishText).toBe('Buenas noches');
    expect(res.jsonBody?.englishText).toBe('Good evening / good night');
    expect(res.jsonBody?.source).toBe('gemini');
  });

  it('handles audio transcription action successfully', async () => {
    process.env.GEMINI_API_KEY = 'mock-secret-server-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    transcript: 'por favor',
                    confidence: 0.98
                  })
                }
              ]
            }
          }
        ]
      })
    }));

    const req = {
      method: 'POST',
      body: {
        action: 'transcribe',
        audioBase64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
        mimeType: 'audio/wav'
      }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody?.transcript).toBe('por favor');
    expect(res.jsonBody?.confidence).toBe(0.98);
  });
});
