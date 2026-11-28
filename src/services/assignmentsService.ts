/**
 * Assignments & Worksheets Service
 * Manages admin-created Written, MCQ, Fill-in-the-Blank, and Surprise Tests
 * with start dates, deadlines, local caching, and live cloud sync.
 */

import { sanitizeText } from '../utils/securitySanitizer';

export type AssignmentType = 'written' | 'mcq' | 'fill' | 'surprise-test';

export interface AssignmentQuestion {
  id: string;
  prompt: string;
  type: 'written' | 'mcq' | 'fill';
  options?: string[];
  correctAnswer?: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  startDate: string;
  deadline: string;
  questions: AssignmentQuestion[];
  createdAt: string;
}

export interface QuestionResult {
  answer: string;
  isCorrect: boolean | null;
  expectedAnswer?: string;
}

export interface AssignmentSubmission {
  assignmentId: string;
  studentEmail?: string;
  studentName?: string;
  submittedAt: string;
  answers: Record<string, string>;
  questionResults?: Record<string, QuestionResult>;
  autoScore?: number;
  autoTotal?: number;
}

const STORAGE_ASSIGNMENTS_KEY = 'aventura_assignments_v1';
const STORAGE_SUBMISSIONS_KEY = 'aventura_assignment_submissions_v1';

let lastCloudUpdatedAt: string | null = null;

function notifyAssignmentsUpdated(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('aventura-assignments-updated'));
  }
}

export function getLocalAssignments(): AssignmentItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_ASSIGNMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw, (k, v) =>
      k === '__proto__' || k === 'constructor' || k === 'prototype' ? undefined : v
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalAssignments(items: AssignmentItem[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_ASSIGNMENTS_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }
  notifyAssignmentsUpdated();
}

export function sanitizeAssignment(raw: AssignmentItem): AssignmentItem {
  return {
    id: sanitizeText(raw.id, 80) || `asg-${Date.now()}`,
    title: sanitizeText(raw.title, 200),
    description: sanitizeText(raw.description, 1000),
    type: (['written', 'mcq', 'fill', 'surprise-test'].includes(raw.type) ? raw.type : 'written') as AssignmentType,
    startDate: sanitizeText(raw.startDate, 40),
    deadline: sanitizeText(raw.deadline, 40),
    createdAt: raw.createdAt || new Date().toISOString(),
    questions: (raw.questions || []).map((q, idx) => ({
      id: sanitizeText(q.id, 80) || `q-${idx + 1}`,
      prompt: sanitizeText(q.prompt, 1000),
      type: (['written', 'mcq', 'fill'].includes(q.type) ? q.type : 'written') as 'written' | 'mcq' | 'fill',
      options: Array.isArray(q.options) ? q.options.map(o => sanitizeText(o, 300)).filter(Boolean) : undefined,
      correctAnswer: q.correctAnswer ? sanitizeText(q.correctAnswer, 300) : undefined
    }))
  };
}

export async function syncAssignmentsToCloud(
  assignments: AssignmentItem[]
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return { success: false, error: 'Fetch unavailable' };
  }
  try {
    const res = await fetch('/api/admin/assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ assignments })
    });
    if (res.ok) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.message || data.error || `HTTP ${res.status}` };
  } catch {
    return { success: false, error: 'Network error syncing assignments' };
  }
}

export async function loadCloudAssignments(): Promise<AssignmentItem[]> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return getLocalAssignments();
  }
  try {
    const res = await fetch('/api/admin/assignments', { method: 'GET', cache: 'no-store' });
    if (!res.ok) return getLocalAssignments();
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return getLocalAssignments();

    const text = await res.text();
    const data = JSON.parse(text, (k, v) =>
      k === '__proto__' || k === 'constructor' || k === 'prototype' ? undefined : v
    );
    if (data?.success && Array.isArray(data.assignments)) {
      if (!data.updatedAt || data.updatedAt !== lastCloudUpdatedAt) {
        lastCloudUpdatedAt = data.updatedAt || String(Date.now());
        saveLocalAssignments(data.assignments);
      }
      return data.assignments;
    }
  } catch {
    // fallback to local cache
  }
  return getLocalAssignments();
}

export function getStudentSubmissions(userKey: string): Record<string, AssignmentSubmission> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(`${STORAGE_SUBMISSIONS_KEY}_${userKey || 'guest'}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw, (k, v) =>
      k === '__proto__' || k === 'constructor' || k === 'prototype' ? undefined : v
    );
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStudentSubmission(userKey: string, submission: AssignmentSubmission): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const current = getStudentSubmissions(userKey);
    current[submission.assignmentId] = submission;
    window.localStorage.setItem(`${STORAGE_SUBMISSIONS_KEY}_${userKey || 'guest'}`, JSON.stringify(current));
  } catch {
    // ignore quota errors
  }
}

export async function submitAssignmentToCloud(
  submission: AssignmentSubmission
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return { success: false, error: 'Fetch unavailable' };
  }
  try {
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit', submission })
    });
    if (res.ok) return { success: true };
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || `HTTP ${res.status}` };
  } catch {
    return { success: false, error: 'Network error submitting assignment' };
  }
}

export async function loadAdminSubmissions(): Promise<Record<string, Record<string, AssignmentSubmission>>> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return {};
  try {
    const res = await fetch('/api/admin/assignments?mode=admin_submissions', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) return {};
    const data = await res.json().catch(() => ({}));
    if (data?.success && data.submissions && typeof data.submissions === 'object') {
      return data.submissions;
    }
  } catch {
    // ignore
  }
  return {};
}

const STORAGE_ROSTER_PREFIX = 'aventura_admin_roster_v1_';

export async function loadAdminRoster(adminEmail: string): Promise<string[]> {
  const key = `${STORAGE_ROSTER_PREFIX}${(adminEmail || 'admin').toLowerCase()}`;
  const getLocal = (): string[] => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  if (typeof window === 'undefined' || typeof fetch !== 'function') return [];
  try {
    const res = await fetch('/api/admin/assignments?mode=roster', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    if (!res.ok) return getLocal();
    const data = await res.json().catch(() => ({}));
    if (data?.success && Array.isArray(data.students)) {
      try {
        window.localStorage.setItem(key, JSON.stringify(data.students));
      } catch {
        // ignore
      }
      return data.students;
    }
  } catch {
    // ignore
  }
  return getLocal();
}

export async function saveAdminRoster(
  adminEmail: string,
  students: string[]
): Promise<{ success: boolean; students: string[]; error?: string }> {
  const cleaned = Array.from(
    new Set(
      students
        .map(s => String(s || '').trim().toLowerCase())
        .filter(s => s.includes('@'))
    )
  );
  const key = `${STORAGE_ROSTER_PREFIX}${(adminEmail || 'admin').toLowerCase()}`;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(cleaned));
    } catch {
      // ignore
    }
  }
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return { success: false, students: cleaned, error: 'Fetch unavailable' };
  }
  try {
    const res = await fetch('/api/admin/assignments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'save_roster', students: cleaned })
    });
    if (res.ok) return { success: true, students: cleaned };
    const data = await res.json().catch(() => ({}));
    return { success: false, students: cleaned, error: data.error || `HTTP ${res.status}` };
  } catch {
    return { success: false, students: cleaned, error: 'Network error saving roster' };
  }
}
