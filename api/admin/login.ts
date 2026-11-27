// Serverless Function: /api/admin/login
// Dedicated server-side Admin Login endpoint with RBAC, rate-limiting, and HttpOnly session cookies.

declare const process: any;
declare const Buffer: any;
declare const require: any;

let cryptoModule: any;
try {
  cryptoModule = require('crypto');
} catch {
  // fallback
}
const crypto = cryptoModule || (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null);
import { signAdminToken, applyAdminCors, type AdminTokenPayload } from './requireAdmin.ts';

// In-memory rate limiting map (IP and IP+Email based)
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 10;
const MAX_RATE_LIMIT_ENTRIES = 5000;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_LIFETIME_MS = 2 * 60 * 60 * 1000; // 2 hours

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now - v.firstAttemptAt > WINDOW_MS) {
        rateLimitStore.delete(k);
      }
    }
    if (rateLimitStore.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldestKey = rateLimitStore.keys().next().value;
      if (oldestKey) rateLimitStore.delete(oldestKey);
    }
  }
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { attempts: 1, firstAttemptAt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetSeconds: Math.ceil(WINDOW_MS / 1000) };
  }

  // Check if window expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.set(key, { attempts: 1, firstAttemptAt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetSeconds: Math.ceil(WINDOW_MS / 1000) };
  }

  // Inside window
  record.attempts += 1;
  const resetSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - record.firstAttemptAt)) / 1000));

  if (record.attempts > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetSeconds };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - record.attempts, resetSeconds };
}

function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Write to Supabase audit_log table if configured
async function recordAuditLog(actorId: string, action: string, metadata: Record<string, any> = {}): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          actor_id: actorId,
          action,
          target_table: 'auth',
          timestamp: new Date().toISOString(),
          metadata
        })
      });
    } catch {
      // Non-blocking fallback
    }
  }
}

export default async function handler(req: any, res: any) {
  try {
    applyAdminCors(req, res, 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    // Enforce POST method
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Enforce JSON Content-Type to prevent CORS simple-request CSRF
    const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('application/json')) {
      return res.status(415).json({ error: 'Unsupported Media Type. Content-Type must be application/json.' });
    }

    // Parse Body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    // Input Validation
    if (!email || !password || email.length > 254 || password.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }

    // Rate Limiting by trusted IP and (IP, Email) pair to prevent global email lockout DoS
    const rawIp =
      req.headers?.['x-vercel-forwarded-for'] ||
      req.headers?.['x-vercel-ip'] ||
      req.headers?.['x-real-ip'] ||
      req.socket?.remoteAddress ||
      req.headers?.['x-forwarded-for'] ||
      'unknown';
    const clientIp = rawIp.toString().split(',')[0].trim();

    const ipLimit = checkRateLimit(`ip:${clientIp}`);
    const emailLimit = checkRateLimit(`ip_email:${clientIp}:${email}`);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const reset = Math.max(ipLimit.resetSeconds, emailLimit.resetSeconds);
      res.setHeader('Retry-After', reset.toString());
      await recordAuditLog(email, 'admin_login_rate_limited', { ip: clientIp, resetSeconds: reset });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Too many login attempts. Please wait ${reset} seconds before trying again.`
      });
    }

  // Fetch admin credentials from Supabase or server environment
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let userRecord: { id: string; email: string; password_hash: string; role: string } | null = null;

  if (supabaseUrl && serviceKey) {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/player_progress?email=eq.${encodeURIComponent(email)}&select=id,email,password_hash,role`,
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
          }
        }
      );
      if (response.ok) {
        const users = await response.json();
        if (Array.isArray(users) && users.length > 0) {
          userRecord = users[0];
        }
      }
    } catch (err) {
      console.warn('Database lookup error in admin login:', err);
    }
  }

  // Administrative email from server env (or default 'admin@aventura.es'); secret strictly from server env
  const expectedAdminEmail = (process.env.ADMIN_EMAIL || 'admin@aventura.es').trim().toLowerCase();
  const expectedAdminSecret = process.env.ADMIN_SECRET_KEY;

  let isAuthenticated = false;
  let authenticatedUserId = 'admin-root';
  let authenticatedRole = 'user';

function safeConstantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyStoredPassword(password: string, storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (storedHash.startsWith('pbkdf2_sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHex = parts[3];
    if (!Number.isFinite(iterations) || iterations < 10000 || !saltHex || !expectedHex) return false;
    const derived = crypto.pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), iterations, 32, 'sha256').toString('hex');
    return safeConstantTimeEqual(derived, expectedHex);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_salt_aventura_2026');
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return safeConstantTimeEqual(hash, storedHash);
}

  if (userRecord) {
    if (verifyStoredPassword(password, userRecord.password_hash)) {
      isAuthenticated = true;
      authenticatedUserId = userRecord.id;
      authenticatedRole = userRecord.role || 'user';
    }
  } else if (email === expectedAdminEmail && expectedAdminSecret) {
    // Environment configured administrative check (constant-time via SHA-256 digest)
    const providedDigest = crypto.createHash('sha256').update(password).digest('hex');
    const expectedDigest = crypto.createHash('sha256').update(expectedAdminSecret).digest('hex');
    if (safeConstantTimeEqual(providedDigest, expectedDigest)) {
      isAuthenticated = true;
      authenticatedUserId = 'env-admin-01';
      authenticatedRole = 'admin';
    }
  }

  // CRITICAL SECURITY REQUIREMENT:
  // Both authentication AND role == 'admin' must succeed.
  // If role != 'admin' (e.g. regular user logging in on /admin/login), REJECT with generic error.
  // Never reveal whether the account exists or whether only the role failed.
  if (!isAuthenticated || authenticatedRole !== 'admin') {
    await recordAuditLog(email, 'admin_login_rejected', {
      ip: clientIp,
      reason: !isAuthenticated ? 'bad_credentials' : 'insufficient_privileges'
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid credentials or insufficient privileges.'
    });
  }

  // SUCCESS: Reset rate limit for this IP+email
  clearRateLimit(`ip_email:${clientIp}:${email}`);

  // Regenerate Session ID to prevent Session Fixation
  const sessionId = crypto.randomUUID();
  const now = Date.now();

  const tokenPayload: AdminTokenPayload = {
    sessionId,
    userId: authenticatedUserId,
    email,
    role: 'admin',
    issuedAt: now,
    expiresAt: now + SESSION_LIFETIME_MS
  };

  const signedToken = signAdminToken(tokenPayload);

  // Set-Cookie: HttpOnly, Secure, SameSite=Strict, Path=/
  const isSecure =
    process.env.VERCEL === '1' ||
    process.env.NODE_ENV === 'production' ||
    req.headers?.['x-forwarded-proto'] === 'https';
  const cookieFlags = [
    `aventura_admin_token=${encodeURIComponent(signedToken)}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${Math.floor(SESSION_LIFETIME_MS / 1000)}`
  ];
  if (isSecure) {
    cookieFlags.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieFlags.join('; '));

  // Write success to immutable audit_log
  await recordAuditLog(authenticatedUserId, 'admin_login_success', {
    email,
    sessionId,
    ip: clientIp
  });

  // Return success without leaking any sensitive fields (password_hash, tokens)
  return res.status(200).json({
    success: true,
    redirect: '/admin/dashboard',
    user: {
      email,
      role: 'admin'
    }
  });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
