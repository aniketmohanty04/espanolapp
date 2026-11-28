/**
 * SuperAdminScreen – Secret master super-admin dashboard.
 *
 * Access ONLY via direct URL: /superadmin
 * NOT linked anywhere in the normal app UI.
 *
 * Shows:
 *  - Login form (credential: admin@aventura.es / AventuraEspanola2026!)
 *  - Per-sub-admin overview: roster, assignments, submissions, curriculum edits
 *  - Unrostered student list
 *  - Drilldown per admin
 */

import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignmentSummary {
  id: string;
  title: string;
  type: string;
  startDate?: string;
  deadline?: string;
  questionCount: number;
  submissionCount: number;
}

interface AdminSummary {
  email: string;
  displayName: string;
  createdAt: string;
  rosterCount: number;
  roster: string[];
  assignments: AssignmentSummary[];
  submissions: Record<string, Record<string, any>>;
  curriculumEditCount: number;
}

interface DashboardData {
  generatedAt: string;
  totalAdmins: number;
  totalPlayers: number;
  unrosteredStudents: { email: string; displayName: string; createdAt: string }[];
  admins: AdminSummary[];
  raw: {
    rosters: Record<string, string[]>;
    allAssignments: any[];
    allSubmissions: Record<string, Record<string, any>>;
    curriculumByAdmin: Record<string, any[]>;
  };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const BASE = '/api/admin/superadmin';

async function saLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok && data.success) return { success: true };
  return { success: false, error: data.message || data.error || 'Login failed' };
}

async function saSession(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/session`, { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

async function saLogout(): Promise<void> {
  await fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' });
}

async function saDashboard(): Promise<DashboardData | null> {
  try {
    const res = await fetch(`${BASE}/dashboard`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SuperAdminScreenProps {
  onExit: () => void;
}

export const SuperAdminScreen: React.FC<SuperAdminScreenProps> = ({ onExit }) => {
  const [phase, setPhase] = useState<'checking' | 'login' | 'dashboard'>('checking');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<AdminSummary | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    saSession().then(ok => setPhase(ok ? 'dashboard' : 'login'));
  }, []);

  // Load dashboard data when entering dashboard phase
  const loadDashboard = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    const d = await saDashboard();
    if (d) {
      setData(d);
    } else {
      setDataError('Failed to load dashboard data. Session may have expired.');
      setPhase('login');
    }
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (phase === 'dashboard') loadDashboard();
  }, [phase, loadDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const result = await saLogin(loginUsername.trim(), loginPassword);
    setLoginLoading(false);
    if (result.success) {
      setPhase('dashboard');
    } else {
      setLoginError(result.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await saLogout();
    setData(null);
    setSelectedAdmin(null);
    setPhase('login');
  };

  // ── Checking ───────────────────────────────────────────────────────────────
  if (phase === 'checking') {
    return (
      <div style={styles.root}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span style={{ color: '#EADFCF', marginTop: 12 }}>Verificando sesión…</span>
        </div>
      </div>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (phase === 'login') {
    return (
      <div style={styles.root}>
        <div style={styles.loginCard}>
          {/* Header */}
          <div style={styles.saHeader}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <div>
              <div style={styles.saTitle}>Panel de Control Maestro</div>
              <div style={styles.saSubtitle}>Super-Admin • Acceso Restringido</div>
            </div>
          </div>

          {/* Back link */}
          <button onClick={onExit} style={styles.backBtn}>
            ← Volver al inicio
          </button>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={styles.label}>
              Nombre de usuario (Username)
              <input
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                style={styles.input}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                placeholder=""
              />
            </label>
            <label style={styles.label}>
              Contraseña (Password)
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                style={styles.input}
                autoComplete="current-password"
                required
                placeholder=""
              />
            </label>
            {loginError && <div style={styles.errorBox}>{loginError}</div>}
            <button type="submit" style={styles.primaryBtn} disabled={loginLoading}>
              {loginLoading ? 'Iniciando sesión…' : '🔐 Iniciar Sesión — Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Panel Maestro — Master Dashboard</div>
            <div style={{ fontSize: 11, color: '#a0b4c8' }}>TEAMAVENTURAESPANOLA · Super-Admin</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadDashboard} style={styles.refreshBtn} disabled={dataLoading}>
            {dataLoading ? '⟳ Cargando…' : '⟳ Refresh'}
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
          <button onClick={onExit} style={styles.exitBtn}>✕ Salir</button>
        </div>
      </div>

      <div style={styles.dashContent}>
        {dataError && <div style={{ ...styles.errorBox, marginBottom: 16 }}>{dataError}</div>}

        {dataLoading && !data && (
          <div style={{ textAlign: 'center', padding: 60, color: '#7A6B60' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
            Cargando datos del sistema…
          </div>
        )}

        {data && !selectedAdmin && (
          <>
            {/* Summary Cards */}
            <div style={styles.cardRow}>
              <div style={styles.statCard}>
                <div style={styles.statNum}>{data.totalAdmins}</div>
                <div style={styles.statLabel}>Sub-Admins (Profesores)</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNum}>{data.totalPlayers}</div>
                <div style={styles.statLabel}>Registered Students (Alumnos)</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNum}>{data.unrosteredStudents.length}</div>
                <div style={styles.statLabel}>Unrostered Students (Sin Clase)</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNum}>{data.admins.reduce((s, a) => s + a.assignments.length, 0)}</div>
                <div style={styles.statLabel}>Total Assignments (Tareas)</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNum}>{new Date(data.generatedAt).toLocaleTimeString()}</div>
                <div style={styles.statLabel}>Last Updated (Actualizado)</div>
              </div>
            </div>

            {/* Sub-Admin Table */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📋 Sub-Admins (Profesores) — Activity Overview</div>
              {data.admins.length === 0 ? (
                <div style={styles.emptyMsg}>No sub-admins registered yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Profesor (Email)</th>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}>Alumnos Roster</th>
                        <th style={styles.th}>Tareas (Assignments)</th>
                        <th style={styles.th}>Curriculum Edits</th>
                        <th style={styles.th}>Total Submissions</th>
                        <th style={styles.th}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.admins.map(admin => (
                        <tr key={admin.email} style={styles.tr}>
                          <td style={styles.td}><code style={{ fontSize: 12 }}>{admin.email}</code></td>
                          <td style={styles.td}>{admin.displayName}</td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={styles.badge}>{admin.rosterCount}</span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={styles.badge}>{admin.assignments.length}</span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={{ ...styles.badge, background: admin.curriculumEditCount > 0 ? '#E05615' : '#EADFCF', color: admin.curriculumEditCount > 0 ? '#fff' : '#7A6B60' }}>{admin.curriculumEditCount}</span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <span style={styles.badge}>
                              {admin.assignments.reduce((s, a) => s + a.submissionCount, 0)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button onClick={() => setSelectedAdmin(admin)} style={styles.drillBtn}>
                              Ver Detalles →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Unrostered Students */}
            {data.unrosteredStudents.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>👤 Alumnos Sin Clase — Unrostered Students</div>
                <div style={{ fontSize: 12, color: '#7A6B60', marginBottom: 8 }}>
                  These students registered but are not under any teacher's roster. They can see factory-default questions only.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {data.unrosteredStudents.map(s => (
                    <div key={s.email} style={styles.playerChip}>
                      <strong>{s.displayName || s.email}</strong>
                      <span style={{ fontSize: 11, color: '#7A6B60', marginLeft: 4 }}>{s.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON toggle */}
            <div style={styles.section}>
              <button onClick={() => setShowRaw(r => !r)} style={styles.rawBtn}>
                {showRaw ? '▲ Hide' : '▼ Show'} Raw Data (JSON)
              </button>
              {showRaw && (
                <pre style={styles.rawPre}>
                  {JSON.stringify(data.raw, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}

        {/* Admin Drilldown */}
        {data && selectedAdmin && (
          <div>
            <button onClick={() => setSelectedAdmin(null)} style={{ ...styles.backBtn, marginBottom: 16, background: '#EADFCF' }}>
              ← Volver — Back to Overview
            </button>

            <div style={styles.drillHeader}>
              <span style={{ fontSize: 24 }}>👩‍🏫</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#24140E' }}>{selectedAdmin.displayName}</div>
                <div style={{ fontSize: 12, color: '#7A6B60' }}>{selectedAdmin.email}</div>
              </div>
            </div>

            {/* Roster */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📌 Roster de Alumnos ({selectedAdmin.rosterCount} students)</div>
              {selectedAdmin.roster.length === 0 ? (
                <div style={styles.emptyMsg}>No students added yet.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedAdmin.roster.map(email => (
                    <span key={email} style={styles.emailChip}>{email}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Assignments */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📝 Tareas y Exámenes — Assignments ({selectedAdmin.assignments.length})</div>
              {selectedAdmin.assignments.length === 0 ? (
                <div style={styles.emptyMsg}>No assignments created by this admin.</div>
              ) : (
                selectedAdmin.assignments.map(a => {
                  const subs = selectedAdmin.submissions[a.id] || {};
                  const submittedEmails = Object.keys(subs);
                  const notSubmitted = selectedAdmin.roster.filter(e => !subs[e]);
                  return (
                    <div key={a.id} style={styles.assignCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#24140E' }}>{a.title}</div>
                          <div style={{ fontSize: 12, color: '#7A6B60' }}>
                            Type: <strong>{a.type}</strong> · Questions: <strong>{a.questionCount}</strong>
                            {a.startDate && ` · Start: ${new Date(a.startDate).toLocaleDateString()}`}
                            {a.deadline && ` · Due: ${new Date(a.deadline).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ ...styles.badge, background: '#22c55e', color: '#fff' }}>{a.submissionCount} submitted</span>
                          <span style={{ ...styles.badge, background: notSubmitted.length > 0 ? '#f97316' : '#EADFCF', color: notSubmitted.length > 0 ? '#fff' : '#7A6B60' }}>
                            {notSubmitted.length} pending
                          </span>
                        </div>
                      </div>

                      {/* Submissions detail */}
                      {submittedEmails.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#24140E', marginBottom: 6 }}>Respuestas (Submissions):</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {submittedEmails.map(studentEmail => {
                              const sub = subs[studentEmail];
                              const results: any[] = sub?.questionResults || [];
                              const correct = results.filter((r: any) => r.isCorrect).length;
                              const total = results.length;
                              return (
                                <div key={studentEmail} style={styles.subRow}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#24140E' }}>{studentEmail}</span>
                                  <span style={{ fontSize: 11, color: '#7A6B60', marginLeft: 8 }}>
                                    Submitted: {sub?.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'unknown'}
                                  </span>
                                  {total > 0 && (
                                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: correct === total ? '#16a34a' : '#dc2626' }}>
                                      Score: {correct}/{total}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {notSubmitted.length > 0 && selectedAdmin.rosterCount > 0 && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#7A6B60' }}>
                          Not submitted: {notSubmitted.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Curriculum edits */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>✏️ Ediciones del Currículo — Curriculum Edits ({selectedAdmin.curriculumEditCount} cities modified)</div>
              {selectedAdmin.curriculumEditCount === 0 ? (
                <div style={styles.emptyMsg}>This admin has not modified any curriculum questions.</div>
              ) : (
                <pre style={{ ...styles.rawPre, maxHeight: 300 }}>
                  {JSON.stringify(data!.raw.curriculumByAdmin[selectedAdmin.email], null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
// Warm editorial theme with dark navy super-admin banner to distinguish from sub-admin portal.

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  },
  loadingBox: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#EADFCF'
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #334155',
    borderTop: '4px solid #E05615',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loginCard: {
    margin: 'auto',
    marginTop: '10vh',
    background: '#FAF7F2',
    borderRadius: 16,
    padding: '32px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  saHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottom: '2px solid #E05615'
  },
  saTitle: {
    fontWeight: 800,
    fontSize: 18,
    color: '#24140E'
  },
  saSubtitle: {
    fontSize: 12,
    color: '#7A6B60',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#E05615',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'left',
    padding: 0
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#24140E'
  },
  input: {
    padding: '10px 12px',
    border: '1.5px solid #EADFCF',
    borderRadius: 8,
    fontSize: 14,
    color: '#24140E',
    background: '#fff',
    outline: 'none'
  },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 500
  },
  primaryBtn: {
    background: '#1e3a5f',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer'
  },
  topBar: {
    background: '#0f172a',
    borderBottom: '2px solid #1e3a5f',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  refreshBtn: {
    background: '#1e3a5f',
    color: '#a0b4c8',
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600
  },
  logoutBtn: {
    background: 'transparent',
    color: '#f97316',
    border: '1.5px solid #f97316',
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600
  },
  exitBtn: {
    background: '#334155',
    color: '#94a3b8',
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600
  },
  dashContent: {
    flex: 1,
    padding: '24px',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%'
  },
  cardRow: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 24
  },
  statCard: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: '16px 20px',
    flex: '1 1 140px',
    minWidth: 130
  },
  statNum: {
    fontSize: 24,
    fontWeight: 800,
    color: '#E05615'
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: 500
  },
  section: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20
  },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: '#e2e8f0',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid #334155'
  },
  emptyMsg: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    color: '#e2e8f0'
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    background: '#0f172a',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #334155'
  },
  tr: {
    borderBottom: '1px solid #334155'
  },
  td: {
    padding: '10px 12px',
    verticalAlign: 'middle'
  },
  badge: {
    display: 'inline-block',
    background: '#EADFCF',
    color: '#24140E',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 700
  },
  drillBtn: {
    background: '#1e3a5f',
    color: '#7dd3fc',
    border: 'none',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600
  },
  playerChip: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 20,
    padding: '5px 14px',
    fontSize: 12,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  emailChip: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    color: '#94a3b8'
  },
  rawBtn: {
    background: '#334155',
    color: '#94a3b8',
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 600
  },
  rawPre: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: 16,
    fontSize: 11,
    color: '#94a3b8',
    overflowX: 'auto',
    maxHeight: 400,
    marginTop: 10
  },
  drillHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16
  },
  assignCard: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 10
  },
  subRow: {
    background: '#1e293b',
    borderRadius: 6,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4
  }
};

export default SuperAdminScreen;
