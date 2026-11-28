// Serverless Function: /api/admin/logout
// Clears the admin session HttpOnly cookie and records logout in audit_log.

import { requireAdmin, applyAdminCors } from './requireAdmin.js';

declare const process: any;

async function recordAuditLog(actorId: string, action: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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
  try {
    applyAdminCors(req, res, 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    await recordAuditLog(admin.userId, 'admin_logout');

    // Clear HttpOnly Cookie
    const isSecure =
      process.env.VERCEL === '1' ||
      process.env.NODE_ENV === 'production' ||
      req.headers?.['x-forwarded-proto'] === 'https';
    const cookieFlags = [
      'aventura_admin_token=',
      'HttpOnly',
      'SameSite=Strict',
      'Path=/',
      'Max-Age=0'
    ];
    if (isSecure) {
      cookieFlags.push('Secure');
    }

    res.setHeader('Set-Cookie', cookieFlags.join('; '));

    return res.status(200).json({
      success: true,
      redirect: '/admin/login'
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
