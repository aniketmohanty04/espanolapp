import { describe, it, expect, beforeEach } from 'vitest';
import { 
  escapeHtml, 
  stripHtml, 
  stripControlCharacters, 
  sanitizeText, 
  sanitizeEmail, 
  sanitizeUsername, 
  sanitizePassword,
  isOriginAllowed 
} from '../utils/securitySanitizer';
import { 
  checkLoginLockout, 
  recordFailedLogin, 
  clearLoginAttempts 
} from '../services/authDatabaseService';
import { 
  hasAdminPortalAccess, 
  logoutAdmin 
} from '../services/adminAuthService';

describe('Security & Input Sanitization Suite', () => {
  beforeEach(() => {
    logoutAdmin();
    clearLoginAttempts('target@example.com');
  });

  describe('1. XSS & HTML Entity Escaping', () => {
    it('escapes dangerous HTML characters', () => {
      const input = '<script>alert("xss")</script>&foo=\'bar\'';
      const escaped = escapeHtml(input);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;&amp;foo=&#x27;bar&#x27;');
    });

    it('strips all HTML tags and inline event handlers', () => {
      const payload = '<img src=x onerror=alert(1)> Hola <svg onload=alert(2)>';
      const stripped = stripHtml(payload);
      expect(stripped).not.toContain('<img');
      expect(stripped).not.toContain('<svg');
      expect(stripped).not.toContain('onerror=');
      expect(stripped).toContain('Hola');
    });

    it('strips javascript: and data: pseudo-protocols', () => {
      const payload = 'javascript:alert(1) data:text/html,<script>alert(2)</script>';
      const stripped = stripHtml(payload);
      expect(stripped).not.toContain('javascript:');
      expect(stripped).not.toContain('data:text/html');
    });

    it('removes ASCII null bytes and control characters', () => {
      const payload = 'Admin\0User\x08Tamper\x1FTest';
      const cleaned = stripControlCharacters(payload);
      expect(cleaned).toBe('AdminUserTamperTest');
    });

    it('sanitizes general text and respects maximum length limit', () => {
      const longInput = 'A'.repeat(500);
      const sanitized = sanitizeText(longInput, 100);
      expect(sanitized.length).toBe(100);
    });
  });

  describe('2. Form Validation: Email, Username, Password', () => {
    it('validates and normalizes valid emails', () => {
      const res = sanitizeEmail('  Student.One@Domain.ES  ');
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('student.one@domain.es');
    });

    it('rejects malformed or header-injection emails', () => {
      expect(sanitizeEmail('bad-email').isValid).toBe(false);
      expect(sanitizeEmail('test@bad..domain').isValid).toBe(false);
      expect(sanitizeEmail('user@domain.com\r\nBcc: evil@hacker.com').isValid).toBe(false);
    });

    it('sanitizes usernames and preserves Spanish characters', () => {
      const res = sanitizeUsername('  <script> María de la Peña 99  ', 50);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('María de la Peña 99');
    });

    it('validates passwords and rejects null byte injections', () => {
      expect(sanitizePassword('short', 6).isValid).toBe(false);
      expect(sanitizePassword('validPass123', 6).isValid).toBe(true);
      expect(sanitizePassword('null\0bytePass', 6).isValid).toBe(false);
    });
  });

  describe('3. Brute Force Protection & Lockout', () => {
    it('locks out user after 5 consecutive failed login attempts', () => {
      const testEmail = 'target@example.com';
      clearLoginAttempts(testEmail);

      expect(checkLoginLockout(testEmail).locked).toBe(false);

      for (let i = 0; i < 4; i++) {
        const attempt = recordFailedLogin(testEmail);
        expect(attempt.locked).toBe(false);
      }

      // 5th attempt locks out
      const fifth = recordFailedLogin(testEmail);
      expect(fifth.locked).toBe(true);
      expect(checkLoginLockout(testEmail).locked).toBe(true);

      // Reset upon successful login
      clearLoginAttempts(testEmail);
      expect(checkLoginLockout(testEmail).locked).toBe(false);
    });
  });

  describe('4. CORS Origin Verification', () => {
    it('allows localhost and vercel production domains', () => {
      expect(isOriginAllowed('http://localhost:5173', 'localhost:5173')).toBe(true);
      expect(isOriginAllowed('https://espanolapp.vercel.app', 'espanolapp.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://espanolapp-git-main.vercel.app', 'espanolapp.vercel.app')).toBe(true);
    });

    it('rejects unauthorized external origins', () => {
      expect(isOriginAllowed('https://evil-phishing.com', 'espanolapp.vercel.app')).toBe(false);
      expect(isOriginAllowed('https://attacker.site', 'localhost:5173')).toBe(false);
    });
  });

  describe('5. Admin Route Cloaking Gate', () => {
    it('denies portal access if unauthenticated and no secret access key is present', () => {
      logoutAdmin();
      expect(hasAdminPortalAccess()).toBe(false);
    });

    it('rejects generic or outdated keys like ?key=admin', () => {
      logoutAdmin();
      const mockStorage = new Map<string, string>();
      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        location: { search: '?key=admin' },
        sessionStorage: {
          getItem: (k: string) => mockStorage.get(k) || null,
          setItem: (k: string, v: string) => mockStorage.set(k, v),
          removeItem: (k: string) => mockStorage.delete(k)
        }
      };
      try {
        expect(hasAdminPortalAccess()).toBe(false);
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });

    it('strictly rejects any key that is a letter short, long, or has spaces or wrong casing', () => {
      logoutAdmin();
      const mockStorage = new Map<string, string>();
      const originalWindow = (globalThis as any).window;

      const testInvalidKeys = [
        '?key=espanavit202',      // 1 letter short
        '?key=espanavit20299',    // 1 letter long
        '?key= espanavit2029',    // leading space
        '?key=espanavit2029 ',    // trailing space
        '?key=espanavit 2029',    // internal space
        '?key=Espanavit2029',     // wrong case
        '?key=espanavit_2029',    // typo with underscore
        '?access=espanavit2029',  // wrong param name
        '?portal=espanavit2029',  // wrong param name
      ];

      try {
        for (const search of testInvalidKeys) {
          (globalThis as any).window = {
            location: { search },
            sessionStorage: {
              getItem: (k: string) => mockStorage.get(k) || null,
              setItem: (k: string, v: string) => mockStorage.set(k, v),
              removeItem: (k: string) => mockStorage.delete(k)
            }
          };
          expect(hasAdminPortalAccess()).toBe(false);
        }
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });

    it('grants portal access when ?key=espanavit2029 is provided', () => {
      logoutAdmin();
      const mockStorage = new Map<string, string>();
      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        location: { search: '?key=espanavit2029' },
        sessionStorage: {
          getItem: (k: string) => mockStorage.get(k) || null,
          setItem: (k: string, v: string) => mockStorage.set(k, v),
          removeItem: (k: string) => mockStorage.delete(k)
        }
      };
      try {
        expect(hasAdminPortalAccess()).toBe(true);
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });
  });
});
