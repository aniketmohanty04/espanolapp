// Serverless Function: /api/admin/logout
// Clears the admin session HttpOnly cookie and records logout in audit_log.

import { requireAdmin } from './requireAdmin.ts';

declare const process: any;

async function recordAuditLog(actorId: string, action: string): Promise<void> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      await fetch(`${supabaseUrl}/rest/v1/audit_log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({
          actor_id: actorId,
          action,
          target_table: 'auth',
          timestamp: new Date().toISOString()
        })
      });
    } catch {
      // non-blocking
    }
  }
}

export default async function handler(req: any, res: any) {
  // CORS check
  const origin = req.headers?.origin || '';
  const host = req.headers?.host || '';
  if (origin && (origin.includes(host) || origin.includes('localhost') || origin.includes('vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const admin = await requireAdmin(req);
  if (admin) {
    await recordAuditLog(admin.userId, 'admin_logout');
  }

  // Clear HttpOnly Cookie
  const isProd = process.env.NODE_ENV === 'production';
  const cookieFlags = [
    'aventura_admin_token=',
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0'
  ];
  if (isProd) {
    cookieFlags.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieFlags.join('; '));

  return res.status(200).json({
    success: true,
    redirect: '/admin/login'
  });
}
