// Serverless Function: /api/admin/curriculum
// Public GET for published curriculum; Admin-only (requireAdmin) PUT/POST/DELETE to persist live curriculum in Supabase.

import { requireAdmin, applyAdminCors } from './requireAdmin.js';

declare const process: any;

function getSupabaseEnv() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, serviceKey, anonKey };
}

async function recordAuditLog(actorId: string, action: string, metadata: Record<string, any> = {}): Promise<void> {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) return;
  try {
    await fetch(`${url}/rest/v1/audit_log`, {
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
        target_table: 'curriculum_content',
        timestamp: new Date().toISOString(),
        metadata
      })
    });
  } catch {
    // Non-blocking
  }
}

export default async function handler(req: any, res: any) {
  try {
    applyAdminCors(req, res, 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const { url, serviceKey, anonKey } = getSupabaseEnv();

    // 1. PUBLIC READ: Fetch published curriculum overrides for all players
    if (req.method === 'GET') {
      const readKey = serviceKey || anonKey;
      if (!url || !readKey) {
        return res.status(200).json({ success: true, cities: null });
      }

      try {
        const response = await fetch(
          `${url}/rest/v1/curriculum_content?id=eq.active_curriculum&select=data,curriculum_version,updated_at`,
          {
            headers: {
              'apikey': readKey,
              'Authorization': `Bearer ${readKey}`
            }
          }
        );

        if (!response.ok) {
          return res.status(200).json({ success: true, cities: null });
        }

        const rows = await response.json();
        const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

        return res.status(200).json({
          success: true,
          cities: Array.isArray(row?.data) && row.data.length > 0 ? row.data : null,
          version: row?.curriculum_version || 1,
          updatedAt: row?.updated_at || null
        });
      } catch {
        return res.status(200).json({ success: true, cities: null });
      }
    }

    // 2. ADMIN WRITE / DELETE: Enforce server-side admin authentication
    if (req.method === 'PUT' || req.method === 'POST' || req.method === 'DELETE') {
      const admin = await requireAdmin(req, res);
      if (!admin) {
        return; // requireAdmin already sent 401/403
      }

      if (!url || !serviceKey) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Cloud curriculum sync requires SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.'
        });
      }

      if (req.method === 'DELETE') {
        const delRes = await fetch(
          `${url}/rest/v1/curriculum_content?id=eq.active_curriculum`,
          {
            method: 'DELETE',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Prefer': 'return=minimal'
            }
          }
        );

        if (!delRes.ok) {
          return res.status(502).json({
            error: 'Database Error',
            message: 'Failed to reset cloud curriculum. Ensure curriculum_content table exists in Supabase.'
          });
        }

        await recordAuditLog(admin.userId, 'curriculum_reset', { email: admin.email });
        return res.status(200).json({ success: true, reset: true });
      }

      // PUT / POST: Save updated curriculum
      const ct = String(req.headers?.['content-type'] || '').toLowerCase();
      if (ct && !ct.startsWith('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type. Expected application/json.' });
      }

      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body, (key, value) =>
            key === '__proto__' || key === 'constructor' || key === 'prototype' ? undefined : value
          );
        } catch {
          return res.status(400).json({ error: 'Invalid JSON payload' });
        }
      }

      if (!body || typeof body !== 'object' || !Array.isArray(body.cities) || body.cities.length === 0 || body.cities.length > 30) {
        return res.status(400).json({ error: 'Invalid curriculum payload: cities array required.' });
      }

      for (const city of body.cities) {
        if (!city || typeof city !== 'object' || typeof city.id !== 'string' || typeof city.name !== 'string' || !Array.isArray(city.levels)) {
          return res.status(400).json({ error: 'Invalid city schema in curriculum payload.' });
        }
      }

      const upsertRes = await fetch(`${url}/rest/v1/curriculum_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          id: 'active_curriculum',
          curriculum_version: 1,
          data: body.cities,
          modified_by: admin.email,
          updated_at: new Date().toISOString()
        })
      });

      if (!upsertRes.ok) {
        return res.status(502).json({
          error: 'Database Error',
          message: 'Failed to save cloud curriculum. Ensure supabase/admin_rls.sql has been run in Supabase SQL Editor.'
        });
      }

      await recordAuditLog(admin.userId, 'curriculum_updated', {
        email: admin.email,
        cityCount: body.cities.length
      });

      return res.status(200).json({
        success: true,
        cityCount: body.cities.length,
        updatedAt: new Date().toISOString()
      });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
