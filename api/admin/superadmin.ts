/**
 * Secret Super-Admin API Endpoint
 * Route: /api/admin/superadmin
 *
 * This endpoint powers the hidden master super-admin dashboard.
 * It is NOT linked from anywhere in the normal app UI.
 * Access is ONLY via direct URL: /superadmin
 *
 * Super-admin credentials are NEVER stored in Supabase or any client-side code.
 * They live exclusively in Vercel environment variables:
 *   SUPER_ADMIN_EMAIL    (default: admin@aventura.es)
 *   SUPER_ADMIN_PASSWORD (the plaintext secret; compared via constant-time SHA-256)
 *   SUPER_ADMIN_JWT_SECRET (separate signing secret for super-admin tokens)
 *
 * Cookie name: aventura_superadmin_token (separate from regular admin token)
 */

// @ts-ignore Node built-in
import crypto from 'node:crypto';
import { applyAdminCors } from './requireAdmin.js';

declare const process: any;
declare const Buffer: any;

// ─── Super-Admin Token ────────────────────────────────────────────────────────

interface SuperAdminPayload {
  sessionId: string;
  email: string;
  role: 'superadmin';
  issuedAt: number;
  expiresAt: number;
}

const SA_SESSION_MS = 4 * 60 * 60 * 1000; // 4 hours
const COOKIE_NAME = 'aventura_superadmin_token';

function getSuperAdminJwtSecret(): string {
  const s =
    process.env?.SUPER_ADMIN_JWT_SECRET ||
    process.env?.ADMIN_JWT_SECRET;
  if (s && typeof s === 'string' && s.trim().length >= 16) return s.trim();
  throw new Error('SUPER_ADMIN_JWT_SECRET is not configured.');
}

function signSuperAdminToken(payload: SuperAdminPayload): string {
  const secret = getSuperAdminJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifySuperAdminToken(token: string): SuperAdminPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  try {
    const secret = getSuperAdminJwtSecret();
    const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const hdr = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    if (!hdr || hdr.alg !== 'HS256') return null;
    const pl: SuperAdminPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!pl || pl.role !== 'superadmin') return null;
    if (Date.now() > pl.expiresAt) return null;
    return pl;
  } catch {
    return null;
  }
}

function extractSuperAdminToken(req: any): string | null {
  const cookieHeader = req.headers?.cookie || req.headers?.Cookie;
  if (cookieHeader && typeof cookieHeader === 'string') {
    for (const c of cookieHeader.split(';').map((s: string) => s.trim())) {
      if (c.startsWith(`${COOKIE_NAME}=`)) {
        return decodeURIComponent(c.substring(COOKIE_NAME.length + 1));
      }
    }
  }
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.substring(7).trim();
  return null;
}

function requireSuperAdmin(req: any, res: any): SuperAdminPayload | null {
  const token = extractSuperAdminToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'No super-admin session. Access denied.' });
    return null;
  }
  const pl = verifySuperAdminToken(token);
  if (!pl) {
    res.status(403).json({ error: 'Forbidden', message: 'Invalid or expired super-admin token.' });
    return null;
  }
  return pl;
}

// ─── Supabase helper ─────────────────────────────────────────────────────────

async function supabaseGet(path: string): Promise<any> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

interface RLRecord { attempts: number; firstAt: number; }
const rlMap = new Map<string, RLRecord>();
const RL_MAX = 8;
const RL_WIN = 15 * 60 * 1000;

function checkRL(key: string): boolean {
  const now = Date.now();
  const rec = rlMap.get(key);
  if (!rec || now - rec.firstAt > RL_WIN) { rlMap.set(key, { attempts: 1, firstAt: now }); return true; }
  rec.attempts += 1;
  return rec.attempts <= RL_MAX;
}
function clearRL(key: string) { rlMap.delete(key); }

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  try {
    applyAdminCors(req, res, 'GET, POST, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const url: string = req.url || '';

    // ── POST /api/admin/superadmin/login ─────────────────────────────────────
    if (req.method === 'POST' && url.includes('/login')) {
      const ct = String(req.headers?.['content-type'] || '').toLowerCase();
      if (!ct.startsWith('application/json'))
        return res.status(415).json({ error: 'Content-Type must be application/json' });

      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); } }
      if (!body || typeof body !== 'object' || typeof body.email !== 'string' || typeof body.password !== 'string')
        return res.status(400).json({ error: 'Invalid credentials format' });

      const email = body.email.trim().toLowerCase();
      const password = body.password;
      if (!email || !password || email.length > 254 || password.length > 256)
        return res.status(400).json({ error: 'Invalid credentials format' });

      const rawIp =
        req.headers?.['x-vercel-forwarded-for'] ||
        req.headers?.['x-real-ip'] ||
        req.headers?.['x-forwarded-for'] ||
        req.socket?.remoteAddress ||
        'unknown';
      const clientIp = rawIp.toString().split(',')[0].trim();

      if (!checkRL(`sa_ip:${clientIp}`)) {
        res.setHeader('Retry-After', '900');
        return res.status(429).json({ error: 'Too Many Requests', message: 'Too many super-admin login attempts. Wait 15 minutes.' });
      }

      // Credential check — env vars ONLY, never Supabase
      const expectedEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@aventura.es').trim().toLowerCase();
      const expectedPassword = process.env.SUPER_ADMIN_PASSWORD;

      if (!expectedPassword) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Super-admin is not configured on this server (SUPER_ADMIN_PASSWORD missing).' });
      }

      // Constant-time compare via SHA-256 digests (passwords are short so no timing leak from hashing)
      const digestProvided = crypto.createHash('sha256').update(password).digest('hex');
      const digestExpected = crypto.createHash('sha256').update(expectedPassword).digest('hex');

      const bufA = Buffer.from(digestProvided);
      const bufB = Buffer.from(digestExpected);
      const emailMatch = email === expectedEmail;
      const passMatch = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

      if (!emailMatch || !passMatch) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid super-admin credentials.' });
      }

      clearRL(`sa_ip:${clientIp}`);

      const now = Date.now();
      const payload: SuperAdminPayload = {
        sessionId: crypto.randomUUID(),
        email,
        role: 'superadmin',
        issuedAt: now,
        expiresAt: now + SA_SESSION_MS
      };

      let token: string;
      try { token = signSuperAdminToken(payload); }
      catch (e: any) { return res.status(503).json({ error: 'Service Unavailable', message: e.message }); }

      const isSecure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' || req.headers?.['x-forwarded-proto'] === 'https';
      const cookieParts = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        'HttpOnly',
        'SameSite=Strict',
        'Path=/',
        `Max-Age=${Math.floor(SA_SESSION_MS / 1000)}`
      ];
      if (isSecure) cookieParts.push('Secure');
      res.setHeader('Set-Cookie', cookieParts.join('; '));

      return res.status(200).json({ success: true, role: 'superadmin', email });
    }

    // ── POST /api/admin/superadmin/logout ────────────────────────────────────
    if (req.method === 'POST' && url.includes('/logout')) {
      const isSecure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' || req.headers?.['x-forwarded-proto'] === 'https';
      const expireParts = [
        `${COOKIE_NAME}=`,
        'HttpOnly',
        'SameSite=Strict',
        'Path=/',
        'Max-Age=0'
      ];
      if (isSecure) expireParts.push('Secure');
      res.setHeader('Set-Cookie', expireParts.join('; '));
      return res.status(200).json({ success: true });
    }

    // ── GET /api/admin/superadmin/session ────────────────────────────────────
    if (req.method === 'GET' && url.includes('/session')) {
      const pl = requireSuperAdmin(req, res);
      if (!pl) return;
      return res.status(200).json({ authenticated: true, email: pl.email, role: pl.role, expiresAt: pl.expiresAt });
    }

    // ── GET /api/admin/superadmin/dashboard ──────────────────────────────────
    if (req.method === 'GET' && url.includes('/dashboard')) {
      const pl = requireSuperAdmin(req, res);
      if (!pl) return;

      // Fetch all data from Supabase curriculum_content in parallel
      const [
        rostersRow,
        assignmentsRow,
        submissionsRow,
        curriculumRow,
        allAdminsRow,
        allPlayersRow
      ] = await Promise.all([
        supabaseGet('curriculum_content?id=eq.admin_teachership_rosters&select=content'),
        supabaseGet('curriculum_content?id=eq.active_assignments&select=content'),
        supabaseGet('curriculum_content?id=eq.assignment_submissions&select=content'),
        supabaseGet('curriculum_content?id=eq.curriculum_by_admin&select=content'),
        supabaseGet('player_progress?role=eq.admin&select=id,email,display_name,role,created_at'),
        supabaseGet('player_progress?select=id,email,display_name,role,created_at&limit=1000')
      ]);

      const rosters: Record<string, string[]> =
        Array.isArray(rostersRow) && rostersRow[0]?.content ? rostersRow[0].content : {};
      const allAssignments: any[] =
        Array.isArray(assignmentsRow) && assignmentsRow[0]?.content ? assignmentsRow[0].content : [];
      const allSubmissions: Record<string, Record<string, any>> =
        Array.isArray(submissionsRow) && submissionsRow[0]?.content ? submissionsRow[0].content : {};
      const curriculumByAdmin: Record<string, any[]> =
        Array.isArray(curriculumRow) && curriculumRow[0]?.content ? curriculumRow[0].content : {};
      const admins: any[] = Array.isArray(allAdminsRow) ? allAdminsRow : [];
      const allPlayers: any[] = Array.isArray(allPlayersRow) ? allPlayersRow : [];

      // Build per-admin summary
      const adminSummaries = admins.map((admin: any) => {
        const adminEmail: string = admin.email || '';
        const roster: string[] = rosters[adminEmail] || [];
        const myAssignments: any[] = allAssignments.filter(
          (a: any) => a.createdBy === adminEmail
        );
        const mySubmissions: Record<string, any> = {};
        for (const a of myAssignments) {
          mySubmissions[a.id] = allSubmissions[a.id] || {};
        }
        const myCurriculumEdits = curriculumByAdmin[adminEmail] || [];

        return {
          email: adminEmail,
          displayName: admin.display_name || adminEmail,
          createdAt: admin.created_at,
          rosterCount: roster.length,
          roster,
          assignments: myAssignments.map((a: any) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            startDate: a.startDate,
            deadline: a.deadline,
            questionCount: Array.isArray(a.questions) ? a.questions.length : 0,
            submissionCount: Object.keys(allSubmissions[a.id] || {}).length
          })),
          submissions: mySubmissions,
          curriculumEditCount: myCurriculumEdits.length
        };
      });

      // Players not in any roster
      const allRosteredEmails = new Set(Object.values(rosters).flat());
      const unrosteredStudents = allPlayers
        .filter((p: any) => p.role !== 'admin' && !allRosteredEmails.has(p.email))
        .map((p: any) => ({ email: p.email, displayName: p.display_name, createdAt: p.created_at }));

      return res.status(200).json({
        generatedAt: new Date().toISOString(),
        totalAdmins: admins.length,
        totalPlayers: allPlayers.filter((p: any) => p.role !== 'admin').length,
        unrosteredStudents,
        admins: adminSummaries,
        // Raw data for drilldown (super-admin only)
        raw: {
          rosters,
          allAssignments,
          allSubmissions,
          curriculumByAdmin
        }
      });
    }

    return res.status(404).json({ error: 'Not Found' });
  } catch (err: any) {
    console.error('Super-admin handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
