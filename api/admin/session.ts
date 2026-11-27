// Serverless Function: /api/admin/session
// Verifies active admin session using the server-side requireAdmin guard.

import { requireAdmin } from './requireAdmin.ts';

export default async function handler(req: any, res: any) {
  // CORS check
  const origin = req.headers?.origin || '';
  const host = req.headers?.host || '';
  if (origin && (origin.includes(host) || origin.includes('localhost') || origin.includes('vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Enforce server-side authorization guard
  const admin = await requireAdmin(req, res);
  if (!admin) {
    // requireAdmin automatically sent 401/403
    return;
  }

  // Return non-sensitive session confirmation
  return res.status(200).json({
    authenticated: true,
    role: admin.role,
    email: admin.email,
    expiresAt: admin.expiresAt
  });
}
