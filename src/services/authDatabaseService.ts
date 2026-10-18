import { PlayerProgress, PlayerProfile } from '../types';
import { INITIAL_PROGRESS, DEFAULT_PROFILE, DEFAULT_CHARACTER } from './storageService';
import { supabaseService } from './supabaseClient';

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

// In-memory fallback for test and non-browser environments
const memoryUsers: Record<string, DatabaseUser> = {};
const memoryProgress: Record<string, PlayerProgress> = {};
let memoryCurrentEmail: string | null = null;

// Simple fast SHA-256 / hashing function with cross-platform support
export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized + '_salt_aventura_2026');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fallback
  }

  // Pure JS string hashing fallback (guaranteed to work in all JS/Node runtimes)
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
    return memoryProgress[normEmail] || null;
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
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !normEmail.includes('@')) {
      throw new Error('Por favor, introduce una dirección de correo electrónico válida.');
    }
    if (!password || password.trim().length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres.');
    }

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

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const finalName = displayName.trim() || normEmail.split('@')[0] || 'Viajero';

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
    const normEmail = email.trim().toLowerCase();
    if (!normEmail) {
      throw new Error('Por favor, introduce tu correo electrónico.');
    }
    if (!password) {
      throw new Error('Por favor, introduce tu contraseña.');
    }

    // Ensure database is initialized with demo data
    await this.init();

    const passwordHash = await hashPassword(password);

    // 1. Try remote cloud lookup first if Supabase is connected
    if (supabaseService.getConfig().isConfigured) {
      try {
        const remoteData = await supabaseService.fetchRemoteUser(normEmail);
        if (remoteData) {
          if (remoteData.user.passwordHash !== passwordHash) {
            throw new Error('Contraseña incorrecta. Por favor, verifica tus datos e inténtalo de nuevo.');
          }

          // Cache in local storage for offline resilience, preserving whichever has more progress
          const users = getStoredUsers();
          remoteData.user.lastLoginAt = new Date().toISOString();
          users[normEmail] = remoteData.user;
          saveStoredUsers(users);

          let resolvedProgress = remoteData.progress;

          // Ensure player's registered displayName is preserved on profile and character
          if (remoteData.user.displayName) {
            resolvedProgress = {
              ...resolvedProgress,
              profile: {
                ...resolvedProgress.profile,
                displayName: remoteData.user.displayName,
                character: {
                  ...(resolvedProgress.profile?.character || DEFAULT_CHARACTER),
                  name: (!resolvedProgress.profile?.character?.name || resolvedProgress.profile.character.name === 'Alex' || resolvedProgress.profile.character.name === 'Viajero')
                    ? remoteData.user.displayName
                    : resolvedProgress.profile.character.name
                }
              }
            };
          }

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

    if (user.passwordHash !== passwordHash) {
      throw new Error('Contraseña incorrecta. Por favor, verifica tus datos e inténtalo de nuevo.');
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
   * Save user progress to database under their account email (syncs to both local and cloud)
   */
  saveUserProgress(email: string, progress: PlayerProgress): void {
    if (!email) return;
    const normEmail = email.trim().toLowerCase();
    saveStoredProgress(normEmail, progress);

    // Asynchronously push to Supabase cloud if connected
    if (supabaseService.getConfig().isConfigured) {
      const users = getStoredUsers();
      const user = users[normEmail] || {
        id: progress.profile?.id || `usr_${normEmail}`,
        email: normEmail,
        displayName: progress.profile?.displayName || 'Viajero',
        passwordHash: '',
        createdAt: progress.profile?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      supabaseService.saveRemoteUser(user, progress).catch(err => {
        console.warn('Async cloud save error:', err);
      });
    }
  },

  /**
   * Load user progress from memory / active session
   */
  loadUserProgress(email: string): PlayerProgress | null {
    if (!email) return null;
    return getStoredProgress(email);
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
        if (remote?.progress) {
          memoryProgress[normEmail] = remote.progress;
          return remote.progress;
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
