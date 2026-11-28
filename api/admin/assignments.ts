// Serverless Function: /api/admin/assignments
// Public GET for published assignments/worksheets; Admin-only (requireAdmin) PUT/POST to save live in Supabase.

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

const VALID_TYPES = new Set(['written', 'mcq', 'fill', 'surprise-test']);

export default async function handler(req: any, res: any) {
  try {
    applyAdminCors(req, res, 'GET, POST, PUT, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const { url, serviceKey, anonKey } = getSupabaseEnv();

    // 1. PUBLIC READ: Fetch published assignments for students
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const readKey = serviceKey || anonKey;
      if (!url || !readKey) {
        return res.status(200).json({ success: true, assignments: [] });
      }

      try {
        const response = await fetch(
          `${url}/rest/v1/curriculum_content?id=eq.active_assignments&select=data,updated_at`,
          {
            headers: {
              'apikey': readKey,
              'Authorization': `Bearer ${readKey}`
            }
          }
        );

        if (!response.ok) {
          return res.status(200).json({ success: true, assignments: [] });
        }

        const rows = await response.json();
        const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        const assignments = Array.isArray(row?.data) ? row.data : [];

        return res.status(200).json({
          success: true,
          assignments,
          updatedAt: row?.updated_at || null
        });
      } catch {
        return res.status(200).json({ success: true, assignments: [] });
      }
    }

    // 2. ADMIN WRITE: Enforce server-side admin authentication
    if (req.method === 'PUT' || req.method === 'POST') {
      const admin = await requireAdmin(req, res);
      if (!admin) {
        return;
      }

      if (!url || !serviceKey) {
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Cloud assignments sync requires SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.'
        });
      }

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

      if (!body || typeof body !== 'object' || !Array.isArray(body.assignments) || body.assignments.length > 200) {
        return res.status(400).json({ error: 'Invalid payload: assignments array required.' });
      }

      for (const item of body.assignments) {
        if (
          !item ||
          typeof item !== 'object' ||
          typeof item.id !== 'string' ||
          typeof item.title !== 'string' ||
          !VALID_TYPES.has(item.type) ||
          typeof item.startDate !== 'string' ||
          typeof item.deadline !== 'string' ||
          !Array.isArray(item.questions)
        ) {
          return res.status(400).json({ error: 'Invalid assignment schema in payload.' });
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
          id: 'active_assignments',
          curriculum_version: 1,
          data: body.assignments,
          modified_by: admin.email,
          updated_at: new Date().toISOString()
        })
      });

      if (!upsertRes.ok) {
        const errText = await upsertRes.text().catch(() => '');
        return res.status(502).json({
          error: 'Database Error',
          message: `Failed to save assignments (HTTP ${upsertRes.status}). ${errText.slice(0, 120)}`
        });
      }

      await recordAuditLog(admin.userId, 'assignments_updated', {
        email: admin.email,
        count: body.assignments.length
      });

      return res.status(200).json({
        success: true,
        count: body.assignments.length,
        updatedAt: new Date().toISOString()
      });
    }

    res.setHeader('Allow', 'GET, POST, PUT, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
