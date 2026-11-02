// Serverless Function: /api/spanish-tts
// High-fidelity native Spanish text-to-speech audio endpoint.
// Proxies upstream neural Spanish audio with server-side headers, avoiding browser Referer blocks.

export default async function handler(req: any, res: any) {
  // Support CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  // Support HEAD requests for media player pre-checks
  if (req.method === 'HEAD') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed. Use GET or HEAD.' }));
    return;
  }

  try {
    const urlObj = new URL(req.url, 'http://localhost');
    const textParam = urlObj.searchParams.get('text') || '';
    const langParam = urlObj.searchParams.get('lang') || 'es-ES';

    const cleanedText = textParam.trim().replace(/^["']|["']$/g, '').slice(0, 300);
    if (!cleanedText) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Text query parameter is required.' }));
      return;
    }

    const locale = langParam.toLowerCase().startsWith('es-mx') ? 'es-MX' : 'es-ES';

    // Fetch upstream Google Translate TTS without browser Referer header
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${locale}&client=tw-ob&q=${encodeURIComponent(cleanedText)}`;

    const upstreamRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8'
      }
    });

    if (!upstreamRes.ok) {
      throw new Error(`Upstream TTS responded with status: ${upstreamRes.status}`);
    }

    const buffer = await upstreamRes.arrayBuffer();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(Buffer.from(buffer));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Failed to synthesize Spanish speech', details: message }));
  }
}
