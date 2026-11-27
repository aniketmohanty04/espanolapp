import { PlayerProgress, PlayerProfile } from '../types';
import { INITIAL_PROGRESS, DEFAULT_PROFILE, DEFAULT_CHARACTER } from './storageService';
import { supabaseService } from './supabaseClient';
import { reconcileProgression } from '../data/citiesData';
import { sanitizeEmail, sanitizeUsername, sanitizePassword } from '../utils/securitySanitizer';

export interface DatabaseUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthResult {
  user: DatabaseUser;
  progress: PlayerProgress;
  source?: 'cloud' | 'local';
}

const DB_USERS_KEY = 'aventura_db_users_v1';
const DB_PROGRESS_PREFIX = 'aventura_db_progress_v1_';
const DB_SESSION_KEY = 'aventura_db_session_v1';

// Brute-force login attempt tracker (defense against password spraying)
interface LoginAttemptTracker {
  attempts: number;
  lockoutUntil: number | null;
}
const loginAttemptMap = new Map<string, LoginAttemptTracker>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

export function checkLoginLockout(email: string): { locked: boolean; remainingSeconds: number } {
  const norm = email.trim().toLowerCase();
  const record = loginAttemptMap.get(norm);
  if (!record || !record.lockoutUntil) return { locked: false, remainingSeconds: 0 };
  const now = Date.now();
  if (now > record.lockoutUntil) {
    loginAttemptMap.delete(norm);
    return { locked: false, remainingSeconds: 0 };
  }
  const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
  return { locked: true, remainingSeconds };
}

export function recordFailedLogin(email: string): { locked: boolean; remainingSeconds: number } {
  const norm = email.trim().toLowerCase();
  const now = Date.now();
  let record = loginAttemptMap.get(norm);
  if (!record) {
    record = { attempts: 1, lockoutUntil: null };
    loginAttemptMap.set(norm, record);
    return { locked: false, remainingSeconds: 0 };
  }

  record.attempts += 1;
  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    record.lockoutUntil = now + LOGIN_LOCKOUT_MS;
    const remainingSeconds = Math.ceil(LOGIN_LOCKOUT_MS / 1000);
    return { locked: true, remainingSeconds };
  }
  return { locked: false, remainingSeconds: 0 };
}

export function clearLoginAttempts(email: string): void {
  loginAttemptMap.delete(email.trim().toLowerCase());
}

/**
 * Constant-time string equality to prevent timing analysis attacks on hashes.
 */
function timingSafeHashEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    result |= ca ^ cb;
  }
  return result === 0;
}

// In-memory fallback for test and non-browser environments
const memoryUsers: Record<string, DatabaseUser> = {};
const memoryProgress: Record<string, PlayerProgress> = {};
let memoryCurrentEmail: string | null = null;

const PBKDF2_ITERATIONS = 600_000;
const MIN_PBKDF2_ITERATIONS = 10_000;
const MAX_PBKDF2_ITERATIONS = 2_000_000;
const PBKDF2_PREFIX = 'pbkdf2_sha256';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('Invalid hex string');
  }
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function getWebCrypto(): Crypto | null {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto;
  }
  return null;
}

async function derivePbkdf2Hex(password: string, saltBytes: Uint8Array, iterations: number): Promise<string> {
  const webCrypto = getWebCrypto();
  if (!webCrypto) {
    throw new Error('Web Crypto API is unavailable for secure password hashing.');
  }
  const encoder = new TextEncoder();
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await webCrypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer.slice(saltBytes.byteOffset, saltBytes.byteOffset + saltBytes.byteLength) as ArrayBuffer,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

async function computeLegacyHash(password: string): Promise<string> {
  const normalized = password.trim();
  const webCrypto = getWebCrypto();
  if (webCrypto) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized + '_salt_aventura_2026');
      const hashBuffer = await webCrypto.subtle.digest('SHA-256', data);
      return bytesToHex(new Uint8Array(hashBuffer));
    } catch {
      // fallback
    }
  }

  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  return 'h_' + (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(16);
}

/**
 * Hashes a password using PBKDF2-HMAC-SHA256 (600,000 iterations) with a unique
 * cryptographically random 16-byte per-user salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  const webCrypto = getWebCrypto();
  if (!webCrypto) {
    throw new Error('Web Crypto API is required for secure password hashing.');
  }
  const salt = new Uint8Array(16);
  webCrypto.getRandomValues(salt);
  const hashHex = await derivePbkdf2Hex(normalized, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 or legacy hash in constant time.
 * Signals `needsRehash` when a legacy or lower-iteration hash succeeds so callers can upgrade it transparently.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const normalized = password.trim();
  if (!storedHash || typeof storedHash !== 'string') {
    return { valid: false, needsRehash: false };
  }

  if (storedHash.startsWith(`${PBKDF2_PREFIX}$`)) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return { valid: false, needsRehash: false };
    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHex = parts[3];
    if (
      !Number.isFinite(iterations) ||
      iterations < MIN_PBKDF2_ITERATIONS ||
      iterations > MAX_PBKDF2_ITERATIONS ||
      !saltHex ||
      !expectedHex
    ) {
      return { valid: false, needsRehash: false };
    }
    try {
      const derivedHex = await derivePbkdf2Hex(normalized, hexToBytes(saltHex), iterations);
      const valid = timingSafeHashEqual(derivedHex, expectedHex);
      return { valid, needsRehash: valid && iterations < PBKDF2_ITERATIONS };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy SHA-256 or fallback verification
  const legacyCandidate = await computeLegacyHash(normalized);
  const valid = timingSafeHashEqual(legacyCandidate, storedHash);
  return { valid, needsRehash: valid };
}

function getStoredUsers(): Record<string, DatabaseUser> {
  if (supabaseService.getConfig().isConfigured) {
    return memoryUsers;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(DB_USERS_KEY);
      if (data) return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  return memoryUsers;
}

function saveStoredUsers(users: Record<string, DatabaseUser>): void {
  Object.assign(memoryUsers, users);
  if (supabaseService.getConfig().isConfigured) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(DB_USERS_KEY);
      }
    } catch {
      // fallback
    }
    return;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    }
  } catch {
    // fallback
  }
}

function getStoredProgress(email: string): PlayerProgress | null {
  const normEmail = email.trim().toLowerCase();
  if (supabaseService.getConfig().isConfigured) {
    const localMem = memoryProgress[normEmail]; return localMem ? reconcileProgression(localMem) : null;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(DB_PROGRESS_PREFIX + normEmail);
      if (data) return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  return memoryProgress[normEmail] || null;
}

function saveStoredProgress(email: string, progress: PlayerProgress): void {
  const normEmail = email.trim().toLowerCase();
  memoryProgress[normEmail] = progress;

  if (supabaseService.getConfig().isConfigured) {
    // Supabase stores player progress in remote table player_progress - purge from localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(DB_PROGRESS_PREFIX + normEmail);
      }
    } catch {
      // fallback
    }
    return;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DB_PROGRESS_PREFIX + normEmail, JSON.stringify(progress));
    }
  } catch {
    // fallback
  }
}

export const authDatabaseService = {
  /**
   * Initialize database and seed a demo account if database is empty
   */
  async init(): Promise<void> {
    const users = getStoredUsers();
    const demoEmail = 'viajero@aventura.es';
    if (!users[demoEmail]) {
      const demoHash = await hashPassword('espana123');
      const demoUser: DatabaseUser = {
        id: 'usr_demo_viajero',
        email: demoEmail,
        passwordHash: demoHash,
        displayName: 'Elena la Viajera',
        createdAt: '2026-10-18T10:00:00.000Z',
        lastLoginAt: '2026-10-18T12:00:00.000Z'
      };

      const demoProgress: PlayerProgress = {
        ...INITIAL_PROGRESS,
        stats: {
          coins: 850,
          xp: 320,
          level: 2,
          streak: 4,
          lastActiveDate: new Date().toISOString().split('T')[0],
          lives: 3,
          maxLives: 3
        },
        profile: {
          id: demoUser.id,
          email: demoEmail,
          displayName: 'Elena la Viajera',
          character: {
            ...DEFAULT_CHARACTER,
            name: 'Elena',
            hairStyle: 'curly',
            hairColor: 'brown',
            skinTone: 'medium',
            outfit: 'traveler'
          },
          createdAt: demoUser.createdAt,
          isGuest: false,
          tutorialCompleted: true,
          onboardingStep: 5
        },
        unlockedCityIds: ['madrid'],
        completedLevels: {
          'madrid-1': { stars: 3, scorePercent: 100, firstTryPerfect: true, completedAt: '2026-10-18T10:30:00.000Z' },
          'madrid-2': { stars: 3, scorePercent: 95, firstTryPerfect: true, completedAt: '2026-10-18T11:00:00.000Z' },
          'madrid-3': { stars: 2, scorePercent: 88, firstTryPerfect: false, completedAt: '2026-10-18T11:30:00.000Z' }
        },
        completedBosses: {},
        achievements: {
          first_steps: '2026-10-18T10:30:00.000Z'
        }
      };

      users[demoEmail] = demoUser;
      saveStoredUsers(users);
      saveStoredProgress(demoEmail, demoProgress);
    }
  },

  /**
   * Register a new user account with email, password, and optional initial progress
   */
  async register(
    email: string,
    password: string,
    displayName: string,
    currentGuestProgress?: PlayerProgress
  ): Promise<AuthResult> {
    const emailCheck = sanitizeEmail(email);
    if (!emailCheck.isValid) {
      throw new Error(emailCheck.error);
    }
    const normEmail = emailCheck.value;

    const passCheck = sanitizePassword(password, 6, 128);
    if (!passCheck.isValid) {
      throw new Error(passCheck.error);
    }

    const nameCheck = sanitizeUsername(displayName, 50);
    const cleanedName = nameCheck.value.trim().replace(/^years$/i, '').replace(/^viajero$/i, '');
    const finalName = cleanedName || normEmail.split('@')[0] || 'Aventurero';

    // Check remote cloud first if configured
    if (supabaseService.getConfig().isConfigured) {
      try {
        const remoteExisting = await supabaseService.fetchRemoteUser(normEmail);
        if (remoteExisting) {
          throw new Error('Ya existe una cuenta registrada con este correo electrónico en la nube. Por favor, inicia sesión.');
        }
      } catch (err: any) {
        if (err.message?.includes('Ya existe una cuenta')) throw err;
        // Non-blocking network error, proceed with local check
      }
    }

    const users = getStoredUsers();
    if (users[normEmail]) {
      throw new Error('Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.');
    }

    const passwordHash = await hashPassword(passCheck.value);
    const now = new Date().toISOString();
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newUser: DatabaseUser = {
      id: userId,
      email: normEmail,
      passwordHash,
      displayName: finalName,
      createdAt: now,
      lastLoginAt: now
    };

    // Build initial progress: attach user's profile to their progress (standard game character, ready to play)
    const userProgress: PlayerProgress = currentGuestProgress
      ? {
          ...currentGuestProgress,
          profile: {
            ...currentGuestProgress.profile,
            id: userId,
            email: normEmail,
            displayName: finalName,
            character: {
              ...(currentGuestProgress.profile?.character || DEFAULT_CHARACTER),
              name: finalName
            },
            isGuest: false,
            onboardingStep: 5,
            tutorialCompleted: true
          }
        }
      : {
          ...INITIAL_PROGRESS,
          profile: {
            ...DEFAULT_PROFILE,
            id: userId,
            email: normEmail,
            displayName: finalName,
            character: { ...DEFAULT_CHARACTER, name: finalName },
            isGuest: false,
            onboardingStep: 5,
            tutorialCompleted: true,
            createdAt: now
          }
        };

    users[normEmail] = newUser;
    saveStoredUsers(users);
    saveStoredProgress(normEmail, userProgress);
    this.setCurrentSession(normEmail);

    // Sync to Supabase cloud in background if configured
    if (supabaseService.getConfig().isConfigured) {
      supabaseService.saveRemoteUser(newUser, userProgress).catch(err => {
        console.warn('Failed to sync new user to Supabase cloud:', err);
      });
    }

    return { user: newUser, progress: userProgress, source: 'local' };
  },

  /**
   * Log in with email and password, returning their saved progress from where they left off
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const emailCheck = sanitizeEmail(email);
    if (!emailCheck.isValid) {
      throw new Error(emailCheck.error);
    }
    const normEmail = emailCheck.value;

    const passCheck = sanitizePassword(password, 1, 128);
    if (!passCheck.isValid) {
      throw new Error(passCheck.error);
    }

    // Check brute-force lockout
    const lockout = checkLoginLockout(normEmail);
    if (lockout.locked) {
      throw new Error(`Demasiados intentos fallidos. Acceso bloqueado temporalmente por ${Math.ceil(lockout.remainingSeconds / 60)} min.`);
    }

    // Ensure database is initialized with demo data
    await this.init();

    // 1. Try remote cloud lookup first if Supabase is connected
    if (supabaseService.getConfig().isConfigured) {
      try {
        const remoteData = await supabaseService.fetchRemoteUser(normEmail);
        if (remoteData) {
          const check = await verifyPassword(passCheck.value, remoteData.user.passwordHash);
          if (!check.valid) {
            const fail = recordFailedLogin(normEmail);
            if (fail.locked) {
              throw new Error(`Demasiados intentos fallidos. Cuenta bloqueada por 10 minutos.`);
            }
            throw new Error('Contraseña incorrecta. Por favor, verifica tus datos e inténtalo de nuevo.');
          }

          clearLoginAttempts(normEmail);

          // Transparently upgrade legacy SHA-256 hash to PBKDF2-SHA256 on successful login
          if (check.needsRehash) {
            remoteData.user.passwordHash = await hashPassword(passCheck.value);
            supabaseService.saveRemoteUser(remoteData.user, remoteData.progress).catch(() => {});
          }

          // Cache in local storage for offline resilience, preserving whichever has more progress
          const users = getStoredUsers();
          remoteData.user.lastLoginAt = new Date().toISOString();
          users[normEmail] = remoteData.user;
          saveStoredUsers(users);

          let resolvedProgress = remoteData.progress;

          // Ensure player's registered displayName is preserved on profile and character
          const effectiveName = (remoteData.user.displayName && remoteData.user.displayName !== 'Viajero' && remoteData.user.displayName !== 'years')
            ? remoteData.user.displayName
            : (resolvedProgress.profile?.displayName && resolvedProgress.profile.displayName !== 'Viajero' && resolvedProgress.profile.displayName !== 'years')
            ? resolvedProgress.profile.displayName
            : remoteData.user.displayName || normEmail.split('@')[0] || 'Aventurero';

          resolvedProgress = {
            ...resolvedProgress,
            profile: {
              ...resolvedProgress.profile,
              displayName: effectiveName,
              character: {
                ...(resolvedProgress.profile?.character || DEFAULT_CHARACTER),
                name: (!resolvedProgress.profile?.character?.name || resolvedProgress.profile.character.name === 'Alex' || resolvedProgress.profile.character.name === 'Viajero' || resolvedProgress.profile.character.name === 'years')
                  ? effectiveName
                  : resolvedProgress.profile.character.name
              }
            }
          };

          saveStoredProgress(normEmail, resolvedProgress);
          this.setCurrentSession(normEmail);

          return { user: remoteData.user, progress: resolvedProgress, source: 'cloud' };
        }
      } catch (err: any) {
        if (err.message?.includes('Contraseña incorrecta')) throw err;
        // Non-blocking network failure: fall back to local DB
        console.warn('Supabase remote login unavailable, checking local database:', err);
      }
    }

    // 2. Check local database
    const users = getStoredUsers();
    const user = users[normEmail];
    if (!user) {
      throw new Error('No existe ninguna cuenta con este correo electrónico. Por favor, regístrate.');
    }

    const localCheck = await verifyPassword(passCheck.value, user.passwordHash);
    if (!localCheck.valid) {
      const fail = recordFailedLogin(normEmail);
      if (fail.locked) {
        throw new Error(`Demasiados intentos fallidos. Cuenta bloqueada por 10 minutos.`);
      }
      throw new Error('Contraseña incorrecta. Por favor, verifica tus datos e inténtalo de nuevo.');
    }

    clearLoginAttempts(normEmail);

    // Transparently upgrade legacy hash to PBKDF2-SHA256
    if (localCheck.needsRehash) {
      user.passwordHash = await hashPassword(passCheck.value);
    }

    // Update last login timestamp
    user.lastLoginAt = new Date().toISOString();
    users[normEmail] = user;
    saveStoredUsers(users);
    this.setCurrentSession(normEmail);

    // Retrieve saved progress where the user left off
    let userProgress = getStoredProgress(normEmail);
    if (!userProgress) {
      userProgress = {
        ...INITIAL_PROGRESS,
        profile: {
          ...DEFAULT_PROFILE,
          id: user.id,
          email: normEmail,
          displayName: user.displayName,
          character: {
            ...DEFAULT_CHARACTER,
            name: user.displayName
          },
          isGuest: false,
          onboardingStep: 5
        }
      };
      saveStoredProgress(normEmail, userProgress);
    } else {
      // Ensure player's registered displayName is applied to profile and character
      if (user.displayName) {
        userProgress = {
          ...userProgress,
          profile: {
            ...userProgress.profile,
            displayName: user.displayName,
            character: {
              ...(userProgress.profile?.character || DEFAULT_CHARACTER),
              name: (!userProgress.profile?.character?.name || userProgress.profile.character.name === 'Alex' || userProgress.profile.character.name === 'Viajero')
                ? user.displayName
                : userProgress.profile.character.name
            }
          }
        };
        saveStoredProgress(normEmail, userProgress);
      }
    }

    // If Supabase is connected and had no cloud record yet, push local account to cloud
    if (supabaseService.getConfig().isConfigured) {
      supabaseService.saveRemoteUser(user, userProgress).catch(err => {
        console.warn('Background sync to Supabase cloud failed:', err);
      });
    }

    return { user, progress: userProgress, source: 'local' };
  },

  /**
   * Forgot password: reset password to a new one, reset all game values to zero, and restart adventure
   */
  async resetPasswordAndRestart(email: string, newPassword: string): Promise<AuthResult> {
    const normEmail = email.trim().toLowerCase();
    if (!normEmail) {
      throw new Error('Por favor, introduce tu correo electrónico.');
    }
    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
    }

    await this.init();

    // 1. Check if user exists in Supabase or local DB
    let existingUser: DatabaseUser | null = null;
    let existingDisplayName = normEmail.split('@')[0] || 'Aventurero';

    if (supabaseService.getConfig().isConfigured) {
      try {
        const remote = await supabaseService.fetchRemoteUser(normEmail);
        if (remote) {
          existingUser = remote.user;
          if (remote.user.displayName && remote.user.displayName !== 'Viajero' && remote.user.displayName !== 'years') {
            existingDisplayName = remote.user.displayName;
          }
        }
      } catch (err) {
        console.warn('Supabase fetchRemoteUser error in resetPassword:', err);
      }
    }

    if (!existingUser) {
      const users = getStoredUsers();
      if (users[normEmail]) {
        existingUser = users[normEmail];
        if (existingUser.displayName && existingUser.displayName !== 'Viajero' && existingUser.displayName !== 'years') {
          existingDisplayName = existingUser.displayName;
        }
      }
    }

    if (!existingUser) {
      throw new Error('No se encontró ninguna cuenta registrada con este correo electrónico. Por favor, regístrate.');
    }

    const newPasswordHash = await hashPassword(newPassword);
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Reset game values to zero and start again
    const resetProgress: PlayerProgress = {
      ...INITIAL_PROGRESS,
      stats: {
        coins: 0,
        xp: 0,
        level: 1,
        streak: 1,
        lastActiveDate: today,
        lives: 3,
        maxLives: 3,
        lastLifeLostAt: undefined
      },
      profile: {
        ...DEFAULT_PROFILE,
        id: existingUser.id,
        email: normEmail,
        displayName: existingDisplayName,
        character: {
          ...DEFAULT_CHARACTER,
          name: existingDisplayName
        },
        isGuest: false,
        onboardingStep: 5,
        tutorialCompleted: true,
        createdAt: existingUser.createdAt || now
      },
      unlockedCityIds: ['madrid'],
      completedLevels: {},
      completedBosses: {},
      purchasedTranslations: [],
      rewardedQuestionFirstTries: [],
      rewardedDialogueIds: [],
      rewardedCityCompletionIds: [],
      incorrectQuestions: {},
      festivalVisitedStalls: [],
      achievements: {
        first_steps: now
      }
    };

    const updatedUser: DatabaseUser = {
      ...existingUser,
      passwordHash: newPasswordHash,
      displayName: existingDisplayName,
      lastLoginAt: now
    };

    // Update in memory and local storage
    const users = getStoredUsers();
    users[normEmail] = updatedUser;
    saveStoredUsers(users);
    saveStoredProgress(normEmail, resetProgress);
    this.setCurrentSession(normEmail);

    // Save directly to Supabase cloud
    if (supabaseService.getConfig().isConfigured) {
      try {
        await supabaseService.saveRemoteUser(updatedUser, resetProgress);
      } catch (err) {
        console.warn('Failed to save reset user to Supabase:', err);
      }
    }

    return { 
      user: updatedUser, 
      progress: resetProgress, 
      source: supabaseService.getConfig().isConfigured ? 'cloud' : 'local' 
    };
  },

  /**
   * Save user progress to database under their account email (syncs to both local and cloud)
   */
  saveUserProgress(email: string, progress: PlayerProgress): void {
    if (!email) return;
    const normEmail = email.trim().toLowerCase();
    saveStoredProgress(normEmail, progress);

    // Asynchronously push to Supabase cloud if connected
    if (supabaseService.getConfig().isConfigured) {
      const users = getStoredUsers();
      const user = users[normEmail];
      const validDisplayName = (progress.profile?.displayName && progress.profile.displayName !== 'Viajero' && progress.profile.displayName !== 'years')
        ? progress.profile.displayName
        : (user?.displayName && user.displayName !== 'Viajero' && user.displayName !== 'years')
        ? user.displayName
        : (progress.profile?.character?.name && progress.profile.character.name !== 'Alex' && progress.profile.character.name !== 'years')
        ? progress.profile.character.name
        : undefined;

      // CRITICAL: saveRemoteProgress updates ONLY progress and displayName. It NEVER touches password_hash!
      supabaseService.saveRemoteProgress(normEmail, progress, validDisplayName).then(res => {
        // Fallback: If record does not exist yet (e.g. initial offline sync), only upsert if we have a valid user
        if (!res.success && user && user.passwordHash) {
          supabaseService.saveRemoteUser(user, progress).catch(err => {
            console.warn('Fallback saveRemoteUser error:', err);
          });
        }
      }).catch(err => {
        console.warn('Async cloud save error:', err);
      });
    }
  },

  /**
   * Load user progress from memory / active session
   */
  loadUserProgress(email: string): PlayerProgress | null {
    if (!email) return null;
    const prog = getStoredProgress(email); return prog ? reconcileProgression(prog) : null;
  },

  /**
   * Load user progress directly from Supabase Cloud (authoritative remote store)
   */
  async loadUserProgressAsync(email: string): Promise<PlayerProgress | null> {
    if (!email) return null;
    const normEmail = email.trim().toLowerCase();
    if (supabaseService.getConfig().isConfigured) {
      try {
        const remote = await supabaseService.fetchRemoteUser(normEmail);
        if (remote) {
          // CRITICAL: Cache remote user (including passwordHash & registered displayName) in memory
          const users = getStoredUsers();
          users[normEmail] = remote.user;
          saveStoredUsers(users);

          let resolvedProg = remote.progress;
          // Ensure player's registered displayName is preserved on profile and character
          const effectiveName = (remote.user.displayName && remote.user.displayName !== 'Viajero' && remote.user.displayName !== 'years')
            ? remote.user.displayName
            : (resolvedProg.profile?.displayName && resolvedProg.profile.displayName !== 'Viajero' && resolvedProg.profile.displayName !== 'years')
            ? resolvedProg.profile.displayName
            : remote.user.displayName || normEmail.split('@')[0] || 'Aventurero';

          resolvedProg = {
            ...resolvedProg,
            profile: {
              ...resolvedProg.profile,
              displayName: effectiveName,
              character: {
                ...(resolvedProg.profile?.character || DEFAULT_CHARACTER),
                name: (!resolvedProg.profile?.character?.name || resolvedProg.profile.character.name === 'Alex' || resolvedProg.profile.character.name === 'Viajero' || resolvedProg.profile.character.name === 'years')
                  ? effectiveName
                  : resolvedProg.profile.character.name
              }
            }
          };

          memoryProgress[normEmail] = resolvedProg;
          const reconciled = reconcileProgression(resolvedProg);
          memoryProgress[normEmail] = reconciled;
          return reconciled;
        }
      } catch (err) {
        console.warn('Failed to load user progress from Supabase:', err);
      }
    }
    return memoryProgress[normEmail] || null;
  },

  /**
   * Set active session
   */
  setCurrentSession(email: string | null): void {
    memoryCurrentEmail = email;
    try {
      if (typeof localStorage !== 'undefined') {
        if (email) {
          localStorage.setItem(DB_SESSION_KEY, email);
        } else {
          localStorage.removeItem(DB_SESSION_KEY);
        }
      }
    } catch {
      // fallback
    }
  },

  /**
   * Get active session email
   */
  getCurrentSessionEmail(): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(DB_SESSION_KEY);
        if (stored) return stored;
      }
    } catch {
      // fallback
    }
    return memoryCurrentEmail;
  },

  /**
   * Get all registered accounts (for info/debug/testing)
   */
  getRegisteredUsers(): DatabaseUser[] {
    return Object.values(getStoredUsers());
  },

  /**
   * Check if cloud remote database is configured and connected
   */
  isCloudConfigured(): boolean {
    return supabaseService.getConfig().isConfigured;
  },

  /**
   * Sync all local player accounts and progress records to Supabase Cloud
   */
  async syncAllToCloud(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    const users = this.getRegisteredUsers();
    return supabaseService.syncLocalToRemote(users, email => this.loadUserProgress(email));
  },

  /**
   * Log out current user
   */
  logout(): void {
    this.setCurrentSession(null);
  },

  /**
   * Clear all accounts (for test resets)
   */
  clearAll(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('aventura_db_') || k === DB_USERS_KEY || k === DB_SESSION_KEY)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch {
      // fallback
    }
    for (const k of Object.keys(memoryUsers)) delete memoryUsers[k];
    for (const k of Object.keys(memoryProgress)) delete memoryProgress[k];
    memoryCurrentEmail = null;
  }
};
