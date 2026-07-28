/**
 * Rate limiter en memoria para proteger endpoints sensibles.
 * Bloquea por IP y por correo electrónico.
 */

const MAX_ATTEMPTS = 5;          // intentos antes de bloqueo
const WINDOW_MS = 15 * 60 * 1000; // ventana de 15 minutos
const LOCKOUT_MS = 15 * 60 * 1000; // bloqueo de 15 minutos

// Map: key → { count, firstAttempt, lockedUntil }
const store = new Map();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.lockedUntil && now > entry.lockedUntil) {
      store.delete(key);
    } else if (!entry.lockedUntil && now - entry.firstAttempt > WINDOW_MS) {
      store.delete(key);
    }
  }
}

// Limpia cada 10 minutos para evitar memory leak
setInterval(cleanup, 10 * 60 * 1000);

/**
 * Verifica si una clave está bloqueada.
 * @param {string} key - Identificador (IP, email, etc.)
 * @returns {{ blocked: boolean, remainingMs?: number, attemptsLeft?: number }}
 */
export function checkRateLimit(key) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    return { blocked: false, attemptsLeft: MAX_ATTEMPTS };
  }

  if (entry.lockedUntil) {
    if (now < entry.lockedUntil) {
      return { blocked: true, remainingMs: entry.lockedUntil - now };
    }
    // Bloqueo expiró
    store.delete(key);
    return { blocked: false, attemptsLeft: MAX_ATTEMPTS };
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    store.delete(key);
    return { blocked: false, attemptsLeft: MAX_ATTEMPTS };
  }

  const attemptsLeft = MAX_ATTEMPTS - entry.count;
  return { blocked: false, attemptsLeft: Math.max(0, attemptsLeft) };
}

/**
 * Registra un intento fallido para la clave dada.
 * @param {string} key
 * @returns {{ blocked: boolean, remainingMs?: number }}
 */
export function recordFailedAttempt(key) {
  const now = Date.now();
  const entry = store.get(key) || { count: 0, firstAttempt: now };

  // Reinicia si la ventana venció
  if (now - entry.firstAttempt > WINDOW_MS) {
    entry.count = 0;
    entry.firstAttempt = now;
    delete entry.lockedUntil;
  }

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    store.set(key, entry);
    return { blocked: true, remainingMs: LOCKOUT_MS };
  }

  store.set(key, entry);
  return { blocked: false, attemptsLeft: MAX_ATTEMPTS - entry.count };
}

/**
 * Resetea el contador de una clave (login exitoso).
 * @param {string} key
 */
export function resetAttempts(key) {
  store.delete(key);
}
