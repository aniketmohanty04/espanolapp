// Serverless Function: /api/camino-chat
// Secure server-side proxy for Google Gemini AI in ¡Aventura Española!
// Keeps GEMINI_API_KEY 100% private on the server, never exposing it to the client browser.

declare const Buffer: any;
declare const process: any;

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview'
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

          let upstreamRes: Response;
          try {
            upstreamRes = await fetch(endpoint, {
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
          } finally {
            clearTimeout(timeoutId);
          }

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
    const { prompt, systemInstruction, chatHistory } = body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return sendJson(res, 400, { error: 'prompt is required.' });
    }

    // Build multi-turn conversational contents for Gemini with role alternation
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      // Keep up to 6 most recent turns for conversational continuity
      const recent = chatHistory.slice(-6);
      for (const item of recent) {
        if (!item || typeof item !== 'object' || !item.text || typeof item.text !== 'string') continue;
        const text = item.text.trim();
        if (!text) continue;
        const role = item.role === 'model' || item.role === 'assistant' || item.role === 'tutor' ? 'model' : 'user';

        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${text}`;
        } else {
          contents.push({ role, parts: [{ text }] });
        }
      }
    }

    // Gemini requirement: first content turn must be 'user'
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    // Ensure the latest user turn is appended
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n${prompt.trim()}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: prompt.trim() }]
      });
    }

    const defaultSystemInstruction = `You are Camino (🤖), the intelligent, friendly, and expert Spanish Teacher (Profesor de Español) for English speakers in "¡Aventura Española!".
The student is an English speaker learning beginner A1 Spanish.

CORE PEDAGOGICAL & INTENT DISCIPLINE:
1. PRECISE INTENT UNDERSTANDING:
- Always understand the exact intent of the user's latest message before generating your response.
- Answer the specific question directly before providing any additional explanation.
- Distinguish accurately between:
  * Sentence generation: When asked to write or create a sentence using a specific word or phrase, generate a natural, grammatically correct Spanish sentence using that exact word or phrase.
  * Feeling descriptions: When asked to describe a feeling (e.g. using 'muy bien', 'estoy feliz', 'cansado'), produce a sentence that directly expresses that feeling (e.g. 'Me siento muy bien.', 'Estoy muy bien.').
  * Translation: Translate the exact target word or phrase into authentic Spanish.
  * Grammar explanations: Explain rules (ser vs estar, verb conjugation, gender agreement) clearly and simply in English.
  * Vocabulary questions: Provide the exact word with its gender article (el/la).
  * Pronunciation guidance: Provide intuitive phonetic pronunciation guides.
  * Conversation practice: Engage naturally at an A1 level.

2. SENTENCE GENERATION DISCIPLINE:
- When the user asks to write a sentence using a particular Spanish word or phrase, you MUST generate a grammatically correct sentence that uses that EXACT word or phrase.
- When asked to describe a feeling using 'muy bien', produce "Me siento muy bien." (or "Estoy muy bien.") and explain that "Me siento" means "I feel" and "muy bien" means "very well".
- When asked to write a sentence saying I am happy using 'estoy feliz', produce a sentence using "estoy feliz" (e.g. "Estoy feliz hoy." or "Estoy feliz.") and explain that 'estar' is used for temporary emotions/moods.
- When asked to write a sentence describing feeling bad (e.g. 'write a sentence where you are feeling bad'), produce "Me siento mal." (or "Estoy mal.") and explain that 'sentirse' or 'estar' is used to express how you are currently feeling.
- Do NOT answer sentence-generation requests with unrelated translation instructions or canned generic phrases.
- NEVER ignore the required word or phrase supplied by the learner.

3. RELEVANT, CLEAN PERSONA:
- NEVER introduce fabricated locations, personal experiences, or unnecessary personas (e.g., NEVER claim to be a teacher in Toledo, Madrid, or any specific city).
- Do NOT append generic educational instructions (e.g. "To ask how to say any word use...", "Ask me to conjugate any verb...") to every response unless specifically requested.
- Avoid unnecessary lengthy responses. Keep explanations concise, relevant, encouraging, and focused directly on the user's question.
- Keep all explanations and examples firmly within the A1 Spanish curriculum (strictly present tense).

4. BILINGUAL STRUCTURE:
Output strictly a JSON object with:
{
  "text": "Clear, concise explanation in English answering the question and explaining the words used in 1-2 sentences. If the user asks for a comprehensive list, format each item on its own line starting with '• '.",
  "spanishText": "The target Spanish sentence, phrase, or vocabulary with proper Spanish punctuation (¡ !, ¿ ?, á, é, í, ó, ú, ñ).",
  "pronunciation": "Phonetic pronunciation guide for English speakers (e.g. 'meh SYEN-toh mwee byen').",
  "englishText": "Direct English translation of the Spanish sentence or vocabulary.",
  "correctionNotice": "Specific explanation in English if the student made a grammar/spelling mistake, otherwise null.",
  "practicePrompt": "An optional, short follow-up practice challenge or null if not needed."
}`;

    const effectiveSystemInstruction = systemInstruction || defaultSystemInstruction;

    for (const model of CANDIDATE_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        let upstreamRes: Response;
        try {
          upstreamRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: contents.length > 0 ? contents : [{ parts: [{ text: prompt.trim() }] }],
              systemInstruction: {
                parts: [{ text: effectiveSystemInstruction }]
              },
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.3,
                maxOutputTokens: 2500
              }
            })
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!upstreamRes.ok) {
          continue;
        }

        const data: any = await upstreamRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        let parsed: any = null;
        try {
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          // Attempt robust repair of unclosed JSON or extract fields
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          const textMatch = cleaned.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const spanishMatch = cleaned.match(/"spanishText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const pronunciationMatch = cleaned.match(/"pronunciation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const englishMatch = cleaned.match(/"englishText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const correctionMatch = cleaned.match(/"correctionNotice"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const practiceMatch = cleaned.match(/"practicePrompt"\s*:\s*"((?:[^"\\]|\\.)*)"/);

          if (textMatch || spanishMatch) {
            try {
              parsed = {
                text: textMatch ? JSON.parse(`"${textMatch[1]}"`) : undefined,
                spanishText: spanishMatch ? JSON.parse(`"${spanishMatch[1]}"`) : undefined,
                pronunciation: pronunciationMatch ? JSON.parse(`"${pronunciationMatch[1]}"`) : undefined,
                englishText: englishMatch ? JSON.parse(`"${englishMatch[1]}"`) : undefined,
                correctionNotice: correctionMatch ? JSON.parse(`"${correctionMatch[1]}"`) : undefined,
                practicePrompt: practiceMatch ? JSON.parse(`"${practiceMatch[1]}"`) : undefined
              };
            } catch {
              // fallback
            }
          }
        }

        if (parsed) {
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
        }

        return sendJson(res, 200, {
          text: rawText,
          source: 'gemini'
        });
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
