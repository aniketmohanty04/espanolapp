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

    // 1. READ: Per-admin isolated curriculum (base curriculum is built-in for everyone;
    // admin additions/edits are stored per-admin and only returned to that admin or students in their roster)
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const mode = String(req.query?.mode || '');
      const studentEmail = String(req.query?.studentEmail || '').trim().toLowerCase();
      const readKey = serviceKey || anonKey;
      if (!url || !readKey) {
        return res.status(200).json({ success: true, cities: null });
      }

      try {
        // If Admin Portal is requesting its own curriculum
        if (mode === 'admin') {
          const admin = await requireAdmin(req, res);
          if (!admin) return;
          const adminKey = String(admin.email || '').trim().toLowerCase();
          const resByAdmin = await fetch(
            `${url}/rest/v1/curriculum_content?id=eq.curriculum_by_admin&select=data,updated_at`,
            { headers: { 'apikey': serviceKey || readKey, 'Authorization': `Bearer ${serviceKey || readKey}` } }
          );
          if (!resByAdmin.ok) return res.status(200).json({ success: true, cities: null });
          const rows = await resByAdmin.json();
          const byAdmin = (Array.isArray(rows) && rows[0]?.data && typeof rows[0].data === 'object') ? rows[0].data : {};
          const adminCities = Array.isArray(byAdmin[adminKey]) && byAdmin[adminKey].length > 0 ? byAdmin[adminKey] : null;
          return res.status(200).json({
            success: true,
            cities: adminCities,
            version: 1,
            updatedAt: rows[0]?.updated_at || null
          });
        }

        // Student read: check which admin roster(s) include this studentEmail
        if (!studentEmail || studentEmail === 'guest' || !serviceKey) {
          return res.status(200).json({ success: true, cities: null });
        }

        const [rosterRes, currRes] = await Promise.all([
          fetch(`${url}/rest/v1/curriculum_content?id=eq.admin_teachership_rosters&select=data`, {
            headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
          }),
          fetch(`${url}/rest/v1/curriculum_content?id=eq.curriculum_by_admin&select=data,updated_at`, {
            headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
          })
        ]);

        const rosterRows = rosterRes.ok ? await rosterRes.json() : [];
        const rosters = (Array.isArray(rosterRows) && rosterRows[0]?.data && typeof rosterRows[0].data === 'object') ? rosterRows[0].data : {};

        let matchedAdmin: string | null = null;
        for (const [adm, students] of Object.entries(rosters)) {
          if (Array.isArray(students) && students.some(s => String(s).trim().toLowerCase() === studentEmail)) {
            matchedAdmin = adm.trim().toLowerCase();
            break;
          }
        }

        if (!matchedAdmin) {
          // Student is not in any admin's roster -> only factory base questions
          return res.status(200).json({ success: true, cities: null });
        }

        const currRows = currRes.ok ? await currRes.json() : [];
        const byAdmin = (Array.isArray(currRows) && currRows[0]?.data && typeof currRows[0].data === 'object') ? currRows[0].data : {};
        const adminCities = Array.isArray(byAdmin[matchedAdmin]) && byAdmin[matchedAdmin].length > 0 ? byAdmin[matchedAdmin] : null;

        return res.status(200).json({
          success: true,
          cities: adminCities,
          version: 1,
          updatedAt: currRows[0]?.updated_at || null
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

      const adminKey = String(admin.email || '').trim().toLowerCase();

      if (req.method === 'DELETE') {
        const existingRes = await fetch(
          `${url}/rest/v1/curriculum_content?id=eq.curriculum_by_admin&select=data`,
          { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
        );
        const rows = existingRes.ok ? await existingRes.json().catch(() => []) : [];
        const byAdmin = (Array.isArray(rows) && rows[0]?.data && typeof rows[0].data === 'object') ? rows[0].data : {};
        delete byAdmin[adminKey];

        const delRes = await fetch(`${url}/rest/v1/curriculum_content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify({
            id: 'curriculum_by_admin',
            curriculum_version: 1,
            data: byAdmin,
            modified_by: adminKey,
            updated_at: new Date().toISOString()
          })
        });

        if (!delRes.ok) {
          return res.status(502).json({
            error: 'Database Error',
            message: 'Failed to reset cloud curriculum. Ensure curriculum_content table exists in Supabase.'
          });
        }

        await recordAuditLog(admin.userId, 'curriculum_reset', { email: adminKey });
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

      const existingRes = await fetch(
        `${url}/rest/v1/curriculum_content?id=eq.curriculum_by_admin&select=data`,
        { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
      );
      const existingRows = existingRes.ok ? await existingRes.json().catch(() => []) : [];
      const byAdmin = (Array.isArray(existingRows) && existingRows[0]?.data && typeof existingRows[0].data === 'object') ? existingRows[0].data : {};
      byAdmin[adminKey] = body.cities;

      const upsertRes = await fetch(`${url}/rest/v1/curriculum_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          id: 'curriculum_by_admin',
          curriculum_version: 1,
          data: byAdmin,
          modified_by: adminKey,
          updated_at: new Date().toISOString()
        })
      });

      if (!upsertRes.ok) {
        const errText = await upsertRes.text().catch(() => '');
        return res.status(502).json({
          error: 'Database Error',
          message: `Failed to save cloud curriculum (HTTP ${upsertRes.status}). ${errText.slice(0, 120)}`
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
