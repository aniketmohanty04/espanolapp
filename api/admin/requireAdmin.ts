/**
 * Server-Side Admin Authorization Guard
 * 
 * Enforces strict role-based access control (RBAC) on the server:
 * 1. Inspects HttpOnly cookies or Authorization Bearer header.
 * 2. Cryptographically verifies the HMAC-SHA256 signature using SERVER_JWT_SECRET.
 * 3. Enforces expiration and role === 'admin'.
 * 4. Rejects non-admin or unauthenticated requests with HTTP 401 / 403.
 * 5. Frontend UI hiding is never relied upon for security.
 */

// Server-Side Admin Authorization Guard
declare const process: any;
declare const Buffer: any;
declare const require: any;

let cryptoModule: any;
try {
  cryptoModule = require('crypto');
} catch {
  // fallback if global crypto available
}
const crypto = cryptoModule || (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null);

export interface AdminTokenPayload {
  sessionId: string;
  userId: string;
  email: string;
  role: 'admin';
  issuedAt: number;
  expiresAt: number;
}

// Server-side secret key (never exposed to client browser)
// CRITICAL: ADMIN_JWT_SECRET MUST be set in Vercel environment variables.
// Without it, the server refuses to sign or verify admin tokens.
export function getJwtSecret(): string {
  const secret = typeof process !== 'undefined' ? process.env?.ADMIN_JWT_SECRET : undefined;
  if (secret && typeof secret === 'string' && secret.trim().length >= 16) {
    return secret.trim();
  }
  // FAIL CLOSED: refuse to operate without a proper secret
  throw new Error('ADMIN_JWT_SECRET environment variable is not set or too short. Admin authentication is disabled for security.');
}

/**
 * Strict exact-origin allowlist check for admin endpoints.
 */
export function applyAdminCors(req: any, res: any, methods: string): void {
  const origin = req?.headers?.origin || '';
  const host = req?.headers?.host || '';
  res.setHeader('Vary', 'Origin');
  if (!origin || typeof origin !== 'string') return;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return;
    const exactOrigin = parsed.origin;
    const allowed = new Set<string>([
      'https://espanolapp.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ]);
    if (typeof process !== 'undefined' && process.env?.VERCEL_URL) {
      allowed.add(`https://${process.env.VERCEL_URL}`);
    }
    let isAllowed = allowed.has(exactOrigin);
    if (!isAllowed && host && /^[a-zA-Z0-9.-]+(:\d+)?$/.test(host)) {
      if (exactOrigin === `https://${host}`) isAllowed = true;
      if ((host.startsWith('localhost') || host.startsWith('127.0.0.1')) && exactOrigin === `http://${host}`) isAllowed = true;
    }
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', exactOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', methods);
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  } catch {
    // Invalid origin URL; omit CORS headers
  }
}

/**
 * Creates a signed JWT-like token using HMAC-SHA256.
 */
export function signAdminToken(payload: AdminTokenPayload): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a signed admin token. Returns the decoded payload or null if invalid or expired.
 */
export function verifyAdminToken(token: string): AdminTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const secret = getJwtSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null;
  }

  try {
    const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    if (!decodedHeader || decodedHeader.alg !== 'HS256' || decodedHeader.typ !== 'JWT') {
      return null;
    }
    const payload: AdminTokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || payload.role !== 'admin') return null;
    if (typeof payload.expiresAt !== 'number' || !Number.isFinite(payload.expiresAt)) return null;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts the admin token from either the HttpOnly cookie or Authorization header.
 */
export function extractTokenFromRequest(req: any): string | null {
  // 1. Try Cookie header (HttpOnly cookie)
  const cookieHeader = req.headers?.cookie || req.headers?.Cookie;
  if (cookieHeader && typeof cookieHeader === 'string') {
    const cookies = cookieHeader.split(';').map((c: string) => c.trim());
    for (const c of cookies) {
      if (c.startsWith('aventura_admin_token=')) {
        return decodeURIComponent(c.substring('aventura_admin_token='.length));
      }
    }
  }

  // 2. Try Authorization: Bearer <token>
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * REUSABLE SERVER GUARD: requireAdmin()
 * 
 * Use inside any /api/admin/* endpoint to enforce that the caller has role == 'admin'.
 * Returns the verified AdminTokenPayload, or sends an HTTP 401/403 response and returns null.
 */
export async function requireAdmin(
  req: any,
  res?: any
): Promise<AdminTokenPayload | null> {
  const token = extractTokenFromRequest(req);
  if (!token) {
    if (res) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No admin session token provided. Access denied.'
      });
    }
    return null;
  }

  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    if (res) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient privileges. Admin role required.'
      });
    }
    return null;
  }

  return payload;
}
