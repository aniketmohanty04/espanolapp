// Serverless Function: /api/admin/session
// Verifies active admin session using the server-side requireAdmin guard.

import { requireAdmin, applyAdminCors } from './requireAdmin.ts';

export default async function handler(req: any, res: any) {
  try {
    applyAdminCors(req, res, 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
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
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
