// Serverless Function: /api/camino-chat
// Secure server-side proxy for Google Gemini AI in ¡Aventura Española!
// Keeps GEMINI_API_KEY 100% private on the server, never exposing it to the client browser.

declare const Buffer: any;
declare const process: any;

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];

async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
      // Cap at 10 MB payload
      if (raw.length > 10 * 1024 * 1024) {
        try {
          if (typeof req.destroy === 'function') req.destroy();
        } catch {
          // ignore
        }
        resolve({});
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return;
  }

  // 2. HTTP Method restriction
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseJsonBody(req);
    const action = body.action || 'chat';

    // 3. API Key resolution (Server-side environment secrets)
    const apiKey = (
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
      body.apiKeyOverride ||
      ''
    ).trim();

    if (!apiKey) {
      return sendJson(res, 500, {
        error: 'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in your server environment.'
      });
    }

    // 4. Action: Audio Transcription
    if (action === 'transcribe') {
      const { audioBase64, mimeType, promptText } = body;
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        return sendJson(res, 400, { error: 'audioBase64 string is required for transcription.' });
      }

      for (const model of CANDIDATE_MODELS) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 9500);

          const upstreamRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType || 'audio/webm',
                        data: audioBase64
                      }
                    },
                    {
                      text:
                        promptText ||
                        'You are an expert Spanish speech recognition transcriber. Listen carefully and output JSON: {"transcript": "Spanish words spoken", "confidence": 0.95}'
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                maxOutputTokens: 250
              }
            })
          });

          clearTimeout(timeoutId);

          if (!upstreamRes.ok) continue;

          const data: any = await upstreamRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) continue;

          const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          const parsed = JSON.parse(cleaned);

          if (parsed.transcript && typeof parsed.transcript === 'string') {
            return sendJson(res, 200, {
              success: true,
              transcript: parsed.transcript.trim(),
              confidence: parsed.confidence || 0.9
            });
          }
        } catch {
          continue;
        }
      }

      return sendJson(res, 502, { error: 'All Gemini candidate models failed to transcribe audio.' });
    }

    // 5. Action: Camino AI Chat Tutor
    const { prompt, systemInstruction } = body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return sendJson(res, 400, { error: 'prompt is required.' });
    }

    const defaultSystemInstruction = `You are Camino (🤖), the dedicated Spanish Teacher for English speakers in "¡Aventura Española!".
The student is an English speaker learning beginner A1 Spanish.
CRITICAL PEDAGOGICAL MANDATE:
- All pedagogical explanations, grammar rules, feedback, and answers MUST be written primarily in clear, simple ENGLISH.
- NEVER speak exclusively in advanced Spanish paragraphs. If you answer in pure Spanish, the student cannot understand your lesson!
- Use ENGLISH for the teacher explanation ("text"), pedagogical breakdown ("englishText"), and error explanation ("correctionNotice").
- Use SPANISH strictly for the target vocabulary, phrases, examples, and practice exercises ("spanishText").
- Output strictly a JSON object with: { "text", "spanishText", "pronunciation", "englishText", "correctionNotice", "practicePrompt" }.`;

    const effectiveSystemInstruction = systemInstruction
      ? `${systemInstruction}\n\nCRITICAL PEDAGOGICAL MANDATE: The student is an English speaker learning A1 Spanish. All pedagogical explanations ("text", "englishText") MUST be written primarily in clear ENGLISH with Spanish examples and target vocabulary highlighted. NEVER speak exclusively in advanced Spanish paragraphs.`
      : defaultSystemInstruction;

    for (const model of CANDIDATE_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8500);

        const upstreamRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt.trim() }]
              }
            ],
            systemInstruction: {
              parts: [{ text: effectiveSystemInstruction }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
              maxOutputTokens: 1200
            }
          })
        });

        clearTimeout(timeoutId);

        if (!upstreamRes.ok) {
          continue;
        }

        const data: any = await upstreamRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        try {
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          const parsed = JSON.parse(cleaned);

          let mainText = parsed.text || parsed.explanation || parsed.response || parsed.message;
          if (!mainText && typeof parsed === 'object') {
            const values = Object.values(parsed).filter((v: any) => typeof v === 'string');
            if (values.length > 0) mainText = values[0] as string;
          }

          return sendJson(res, 200, {
            text: mainText || 'Here is the explanation for your Spanish practice:',
            spanishText: parsed.spanishText || parsed.spanish || parsed.translation || undefined,
            pronunciation: parsed.pronunciation || undefined,
            englishText: parsed.englishText || parsed.english || undefined,
            correctionNotice:
              parsed.correctionNotice && parsed.correctionNotice !== 'null'
                ? parsed.correctionNotice
                : undefined,
            practicePrompt: parsed.practicePrompt || undefined,
            source: 'gemini'
          });
        } catch {
          return sendJson(res, 200, {
            text: rawText,
            source: 'gemini'
          });
        }
      } catch {
        continue;
      }
    }

    return sendJson(res, 502, { error: 'All Gemini candidate models failed to generate response.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return sendJson(res, 500, { error: 'Internal server error processing Camino request', details: message });
  }
}
