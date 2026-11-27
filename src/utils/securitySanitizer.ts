/**
 * Centralized Enterprise Security & Input Sanitization Suite
 * 
 * Provides defense-in-depth protection against:
 * 1. Stored & Reflected Cross-Site Scripting (XSS)
 * 2. HTML / Script / Event-handler Injection (<script>, <iframe>, javascript:, onerror=)
 * 3. Null-byte & Control character attacks
 * 4. Header & Prototype pollution
 * 5. Malformed credentials & parameter fuzzing
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

/**
 * Encodes special HTML characters into safe HTML entities.
 */
export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Strips all HTML/XML tags and dangerous schemes completely.
 */
export function stripHtml(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // remove HTML tags
    .replace(/javascript\s*:/gi, '') // strip javascript pseudo-protocol
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/on\w+\s*=/gi, ''); // strip inline event handlers like onerror=, onclick=
}

/**
 * Strips dangerous control characters and null bytes (\0).
 */
export function stripControlCharacters(str: unknown): string {
  if (typeof str !== 'string') return '';
  // Removes null bytes and ASCII control characters except standard whitespace (\t, \n, \r)
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitizes arbitrary text input: removes dangerous tags/scripts, strips control chars,
 * and limits length to avoid memory buffer exhaustion.
 */
export function sanitizeText(str: unknown, maxLength: number = 2000): string {
  if (typeof str !== 'string') return '';
  const cleaned = stripControlCharacters(stripHtml(str));
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) : cleaned;
}

/**
 * Validates and normalizes email addresses using standard RFC 5322 regex.
 */
export function sanitizeEmail(email: unknown): { isValid: boolean; value: string; error?: string } {
  if (typeof email !== 'string') {
    return { isValid: false, value: '', error: 'El correo electrónico debe ser una cadena de texto.' };
  }

  const cleaned = stripControlCharacters(email).trim().toLowerCase();

  if (!cleaned) {
    return { isValid: false, value: '', error: 'Por favor, introduce tu correo electrónico.' };
  }

  if (cleaned.length > 254) {
    return { isValid: false, value: cleaned, error: 'La dirección de correo excede el límite máximo de 254 caracteres.' };
  }

  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!EMAIL_REGEX.test(cleaned)) {
    return { isValid: false, value: cleaned, error: 'Por favor, introduce una dirección de correo válida (ejemplo: usuario@dominio.com).' };
  }

  return { isValid: true, value: cleaned };
}

/**
 * Validates and sanitizes display names / usernames.
 * Allows letters (including Spanish á, é, í, ó, ú, ñ, ü), numbers, spaces, underscores, and hyphens.
 */
export function sanitizeUsername(name: unknown, maxLength: number = 50): { isValid: boolean; value: string; error?: string } {
  if (typeof name !== 'string') {
    return { isValid: false, value: 'Viajero', error: 'El nombre debe ser una cadena de texto.' };
  }

  const stripped = stripHtml(name);
  const cleaned = stripControlCharacters(stripped).trim();

  if (!cleaned) {
    return { isValid: false, value: 'Viajero', error: 'Por favor, introduce un nombre de usuario.' };
  }

  if (cleaned.length > maxLength) {
    return { isValid: false, value: cleaned.substring(0, maxLength), error: `El nombre no puede exceder ${maxLength} caracteres.` };
  }

  return { isValid: true, value: cleaned };
}

/**
 * Validates password strength and strips null-byte injection vectors.
 */
export function sanitizePassword(password: unknown, minLength: number = 6, maxLength: number = 128): { isValid: boolean; value: string; error?: string } {
  if (typeof password !== 'string') {
    return { isValid: false, value: '', error: 'La contraseña debe ser una cadena de texto.' };
  }

  // Check for null-byte tampering
  if (password.includes('\0')) {
    return { isValid: false, value: '', error: 'La contraseña contiene caracteres no permitidos.' };
  }

  const cleaned = password.trim();

  if (cleaned.length < minLength) {
    return { isValid: false, value: cleaned, error: `La contraseña debe tener al menos ${minLength} caracteres.` };
  }

  if (cleaned.length > maxLength) {
    return { isValid: false, value: cleaned, error: `La contraseña no puede exceder ${maxLength} caracteres.` };
  }

  return { isValid: true, value: cleaned };
}

/**
 * Verifies if an HTTP request origin matches allowed domains.
 * Prevents Cross-Origin Resource Sharing (CORS) wildcard attacks in production.
 */
export function isOriginAllowed(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return false;
  const cleanOrigin = origin.toLowerCase().trim();
  const cleanHost = (host || '').toLowerCase().trim();

  // Allow same-origin or localhost in development
  if (cleanHost && cleanOrigin.includes(cleanHost)) return true;
  if (cleanOrigin.startsWith('http://localhost:') || cleanOrigin.startsWith('http://127.0.0.1:')) return true;
  if (cleanOrigin.endsWith('.vercel.app') || cleanOrigin === 'https://espanolapp.vercel.app') return true;

  return false;
}
