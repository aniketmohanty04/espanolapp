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

async function getAllRosters(url: string, serviceKey: string): Promise<Record<string, string[]>> {
  try {
    const response = await fetch(
      `${url}/rest/v1/curriculum_content?id=eq.admin_teachership_rosters&select=data`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );
    if (!response.ok) return {};
    const rows = await response.json();
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return row?.data && typeof row.data === 'object' ? row.data : {};
  } catch {
    return {};
  }
}

async function getAdminsForStudent(url: string, serviceKey: string, studentEmail: string): Promise<Set<string>> {
  const cleanEmail = studentEmail.trim().toLowerCase();
  if (!cleanEmail || cleanEmail === 'guest') return new Set();
  const rosters = await getAllRosters(url, serviceKey);
  const admins = new Set<string>();
  for (const [adminEmail, students] of Object.entries(rosters)) {
    if (Array.isArray(students) && students.some(s => String(s).trim().toLowerCase() === cleanEmail)) {
      admins.add(adminEmail.trim().toLowerCase());
    }
  }
  return admins;
}

async function findUnregisteredEmails(url: string, serviceKey: string, emails: string[]): Promise<string[]> {
  if (emails.length === 0) return [];
  try {
    const response = await fetch(
      `${url}/rest/v1/player_progress?select=email`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        }
      }
    );
    if (!response.ok) return emails;
    const rows = await response.json();
    const registered = new Set<string>(
      Array.isArray(rows)
        ? rows.map((r: any) => String(r?.email || '').trim().toLowerCase()).filter(Boolean)
        : []
    );
    return emails.filter(e => !registered.has(e.trim().toLowerCase()));
  } catch {
    return emails;
  }
}

export default async function handler(req: any, res: any) {
  try {
    applyAdminCors(req, res, 'GET, POST, PUT, OPTIONS');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const { url, serviceKey, anonKey } = getSupabaseEnv();

    // 1. READ: Public assignments OR Admin-only submissions / teachership roster
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const mode = String(req.query?.mode || '');

      // Admin-only: fetch this admin's own assignments
      if (mode === 'admin_manage') {
        const admin = await requireAdmin(req, res);
        if (!admin) return;
        const adminKey = String(admin.email || '').trim().toLowerCase();
        if (!url || !serviceKey) {
          return res.status(200).json({ success: true, assignments: [] });
        }
        try {
          const response = await fetch(
            `${url}/rest/v1/curriculum_content?id=eq.active_assignments&select=data,updated_at`,
            {
              headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
              }
            }
          );
          if (!response.ok) return res.status(200).json({ success: true, assignments: [] });
          const rows = await response.json();
          const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
          const allAssignments = Array.isArray(row?.data) ? row.data : [];
          const mine = allAssignments.filter(
            (a: any) => !a?.createdBy || String(a.createdBy).trim().toLowerCase() === adminKey
          );
          return res.status(200).json({ success: true, assignments: mine, updatedAt: row?.updated_at || null });
        } catch {
          return res.status(200).json({ success: true, assignments: [] });
        }
      }

      // Admin-only: fetch student submissions for this admin's assignments
      if (mode === 'admin_submissions') {
        const admin = await requireAdmin(req, res);
        if (!admin) return;
        const adminKey = String(admin.email || '').trim().toLowerCase();
        if (!url || !serviceKey) {
          return res.status(200).json({ success: true, submissions: {} });
        }
        try {
          const [subRes, asgRes] = await Promise.all([
            fetch(`${url}/rest/v1/curriculum_content?id=eq.assignment_submissions&select=data`, {
              headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
            }),
            fetch(`${url}/rest/v1/curriculum_content?id=eq.active_assignments&select=data`, {
              headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
            })
          ]);
          const subRows = subRes.ok ? await subRes.json() : [];
          const asgRows = asgRes.ok ? await asgRes.json() : [];
          const allSubs = (Array.isArray(subRows) && subRows[0]?.data && typeof subRows[0].data === 'object') ? subRows[0].data : {};
          const allAsgs = (Array.isArray(asgRows) && Array.isArray(asgRows[0]?.data)) ? asgRows[0].data : [];
          const myAsgIds = new Set(
            allAsgs
              .filter((a: any) => !a?.createdBy || String(a.createdBy).trim().toLowerCase() === adminKey)
              .map((a: any) => a.id)
          );
          const filteredSubs: Record<string, any> = {};
          for (const [asgId, subsByStudent] of Object.entries(allSubs)) {
            if (myAsgIds.has(asgId)) {
              filteredSubs[asgId] = subsByStudent;
            }
          }
          return res.status(200).json({ success: true, submissions: filteredSubs });
        } catch {
          return res.status(200).json({ success: true, submissions: {} });
        }
      }

      // Admin-only: fetch this admin's own teachership student roster
      if (mode === 'roster') {
        const admin = await requireAdmin(req, res);
        if (!admin) return;
        if (!url || !serviceKey) {
          return res.status(200).json({ success: true, students: [] });
        }
        const rosters = await getAllRosters(url, serviceKey);
        const adminKey = String(admin.email || '').trim().toLowerCase();
        const students = Array.isArray(rosters[adminKey]) ? rosters[adminKey] : [];
        return res.status(200).json({ success: true, students });
      }

      // Student read: ONLY return assignments created by an admin whose roster includes this studentEmail
      const studentEmail = String(req.query?.studentEmail || '').trim().toLowerCase();
      const readKey = serviceKey || anonKey;
      if (!url || !readKey || !studentEmail || studentEmail === 'guest') {
        return res.status(200).json({ success: true, assignments: [] });
      }

      try {
        const allowedAdmins = serviceKey ? await getAdminsForStudent(url, serviceKey, studentEmail) : new Set<string>();
        if (allowedAdmins.size === 0) {
          return res.status(200).json({ success: true, assignments: [] });
        }

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
        const allAssignments = Array.isArray(row?.data) ? row.data : [];
        const visibleAssignments = allAssignments.filter((a: any) => {
          const creator = String(a?.createdBy || '').trim().toLowerCase();
          return creator && allowedAdmins.has(creator);
        });

        return res.status(200).json({
          success: true,
          assignments: visibleAssignments,
          updatedAt: row?.updated_at || null
        });
      } catch {
        return res.status(200).json({ success: true, assignments: [] });
      }
    }

    // 2. WRITE: Student submission OR Admin write (assignments / teachership roster)
    if (req.method === 'PUT' || req.method === 'POST') {
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

      // 2a. STUDENT SUBMISSION (no admin cookie required)
      if (req.method === 'POST' && body && typeof body === 'object' && body.action === 'submit') {
        const sub = body.submission;
        if (
          !sub ||
          typeof sub !== 'object' ||
          typeof sub.assignmentId !== 'string' ||
          !sub.assignmentId.trim() ||
          typeof sub.answers !== 'object'
        ) {
          return res.status(400).json({ error: 'Invalid submission payload.' });
        }
        if (!url || !serviceKey) {
          return res.status(200).json({ success: true, localOnly: true });
        }

        const studentEmail = String(sub.studentEmail || 'guest').trim().toLowerCase().slice(0, 160);
        const assignmentId = String(sub.assignmentId).trim().slice(0, 80);

        if (!studentEmail || studentEmail === 'guest') {
          return res.status(403).json({ error: 'Registered student login required to submit assignments.' });
        }

        // Verify student is in the assignment creator's teachership roster
        const [asgRes, allowedAdmins] = await Promise.all([
          fetch(`${url}/rest/v1/curriculum_content?id=eq.active_assignments&select=data`, {
            headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
          }),
          getAdminsForStudent(url, serviceKey, studentEmail)
        ]);
        const asgRows = asgRes.ok ? await asgRes.json().catch(() => []) : [];
        const asgList = Array.isArray(asgRows) && Array.isArray(asgRows[0]?.data) ? asgRows[0].data : [];
        const targetAsg = asgList.find((a: any) => a?.id === assignmentId);
        if (targetAsg?.createdBy && !allowedAdmins.has(String(targetAsg.createdBy).trim().toLowerCase())) {
          return res.status(403).json({ error: 'You are not enrolled in this instructor’s roster.' });
        }

        const existingRes = await fetch(
          `${url}/rest/v1/curriculum_content?id=eq.assignment_submissions&select=data`,
          {
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`
            }
          }
        );
        let allSubs: Record<string, Record<string, any>> = {};
        if (existingRes.ok) {
          const rows = await existingRes.json().catch(() => []);
          const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
          if (row?.data && typeof row.data === 'object') {
            allSubs = row.data;
          }
        }

        if (!allSubs[assignmentId] || typeof allSubs[assignmentId] !== 'object') {
          allSubs[assignmentId] = {};
        }
        allSubs[assignmentId][studentEmail] = {
          assignmentId,
          studentEmail,
          studentName: String(sub.studentName || studentEmail).slice(0, 120),
          submittedAt: String(sub.submittedAt || new Date().toISOString()).slice(0, 40),
          answers: sub.answers,
          questionResults: sub.questionResults || {},
          autoScore: typeof sub.autoScore === 'number' ? sub.autoScore : undefined,
          autoTotal: typeof sub.autoTotal === 'number' ? sub.autoTotal : undefined
        };

        const upsertSub = await fetch(`${url}/rest/v1/curriculum_content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify({
            id: 'assignment_submissions',
            curriculum_version: 1,
            data: allSubs,
            modified_by: studentEmail,
            updated_at: new Date().toISOString()
          })
        });

        if (!upsertSub.ok) {
          return res.status(502).json({ error: 'Failed to store submission in cloud.' });
        }
        return res.status(200).json({ success: true });
      }

      // 2b. ADMIN WRITE: Enforce server-side admin authentication
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

      // Admin saving their own teachership student email roster
      if (body && typeof body === 'object' && body.action === 'save_roster') {
        if (!Array.isArray(body.students) || body.students.length > 500) {
          return res.status(400).json({ error: 'Invalid students array.' });
        }
        const cleanedStudents = Array.from(
          new Set(
            body.students
              .map((s: any) => String(s || '').trim().toLowerCase())
              .filter((s: string) => s.includes('@') && s.length <= 160)
          )
        ) as string[];

        // Verify all added emails are already registered in the portal (player_progress)
        const unregistered = await findUnregisteredEmails(url, serviceKey, cleanedStudents);
        if (unregistered.length > 0) {
          return res.status(400).json({
            error: 'Unregistered Student(s)',
            unregistered,
            message: `Students must register in the portal first before being added to your roster: ${unregistered.join(', ')}`
          });
        }

        const rosters = await getAllRosters(url, serviceKey);
        const adminKey = String(admin.email || '').trim().toLowerCase();
        rosters[adminKey] = cleanedStudents;

        const upsertRoster = await fetch(`${url}/rest/v1/curriculum_content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify({
            id: 'admin_teachership_rosters',
            curriculum_version: 1,
            data: rosters,
            modified_by: adminKey,
            updated_at: new Date().toISOString()
          })
        });

        if (!upsertRoster.ok) {
          return res.status(502).json({ error: 'Failed to save teachership roster.' });
        }
        await recordAuditLog(adminKey, 'update_teachership_roster', { count: cleanedStudents.length });
        return res.status(200).json({ success: true, students: cleanedStudents });
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

      // Merge only this admin's assignments into active_assignments, preserving other admins' assignments
      const adminKey = String(admin.email || '').trim().toLowerCase();
      const taggedMine = body.assignments.map((item: any) => ({
        ...item,
        createdBy: adminKey
      }));

      let otherAdminsAssignments: any[] = [];
      try {
        const existingRes = await fetch(
          `${url}/rest/v1/curriculum_content?id=eq.active_assignments&select=data`,
          {
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`
            }
          }
        );
        if (existingRes.ok) {
          const rows = await existingRes.json().catch(() => []);
          const existingList = Array.isArray(rows) && Array.isArray(rows[0]?.data) ? rows[0].data : [];
          otherAdminsAssignments = existingList.filter(
            (a: any) => a?.createdBy && String(a.createdBy).trim().toLowerCase() !== adminKey
          );
        }
      } catch {
        // ignore
      }

      const mergedAssignments = [...taggedMine, ...otherAdminsAssignments];

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
          data: mergedAssignments,
          modified_by: adminKey,
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
