import { getDb } from '../_lib/turso.js';
import { verifyPassword, isPasswordHashed, upgradePasswordIfNeeded } from '../_lib/password.js';
import { signToken } from '../_lib/jwt.js';
import { sendJson, parseBody } from '../_lib/http.js';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '../_lib/rateLimit.js';

/** Formatea milisegundos en texto legible (ej: "14 minutos y 32 segundos") */
function formatRemainingTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0 && seconds > 0) return `${minutes} min y ${seconds} s`;
  if (minutes > 0) return `${minutes} minutos`;
  return `${seconds} segundos`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  // Obtener IP del cliente (compatible con Vercel y Express)
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  try {
    const { email, password } = parseBody(req);

    if (!email || !password) {
      return sendJson(res, 400, { error: 'Email y contraseña son requeridos' });
    }

    const emailNorm = email.trim().toLowerCase();

    // ── Rate limiting por IP ──────────────────────────────────────────────
    const ipCheck = checkRateLimit(`ip:${ip}`);
    if (ipCheck.blocked) {
      return sendJson(res, 429, {
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${formatRemainingTime(ipCheck.remainingMs)}.`,
        retryAfterMs: ipCheck.remainingMs,
      });
    }

    // ── Rate limiting por email ───────────────────────────────────────────
    const emailCheck = checkRateLimit(`email:${emailNorm}`);
    if (emailCheck.blocked) {
      return sendJson(res, 429, {
        error: `Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intenta de nuevo en ${formatRemainingTime(emailCheck.remainingMs)} o restablece tu contraseña.`,
        retryAfterMs: emailCheck.remainingMs,
      });
    }

    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, email, password, role, nombre, ministry_id FROM users WHERE email = ?',
      args: [emailNorm],
    });

    // Respuesta genérica para no revelar si el email existe
    if (result.rows.length === 0) {
      recordFailedAttempt(`ip:${ip}`);
      recordFailedAttempt(`email:${emailNorm}`);
      return sendJson(res, 401, { error: 'Credenciales inválidas' });
    }

    const row = result.rows[0];
    const valid = await verifyPassword(password, row.password);

    if (!valid) {
      const ipResult = recordFailedAttempt(`ip:${ip}`);
      const emailResult = recordFailedAttempt(`email:${emailNorm}`);

      // Si alguno se bloqueó en este intento, avisamos
      if (emailResult.blocked || ipResult.blocked) {
        const remaining = emailResult.remainingMs || ipResult.remainingMs;
        return sendJson(res, 429, {
          error: `Demasiados intentos fallidos. Cuenta bloqueada por ${formatRemainingTime(remaining)}.`,
          retryAfterMs: remaining,
        });
      }

      const left = Math.min(
        emailResult.attemptsLeft ?? 99,
        ipResult.attemptsLeft ?? 99
      );
      const warning = left <= 2 ? ` (${left} intento${left !== 1 ? 's' : ''} restante${left !== 1 ? 's' : ''})` : '';
      return sendJson(res, 401, { error: `Credenciales inválidas${warning}` });
    }

    // ── Login exitoso ─────────────────────────────────────────────────────
    resetAttempts(`ip:${ip}`);
    resetAttempts(`email:${emailNorm}`);

    if (!isPasswordHashed(row.password)) {
      await upgradePasswordIfNeeded(db, row.id, password);
    }

    const user = {
      id: row.id,
      email: row.email,
      role: row.role,
      nombre: row.nombre,
      ministry_id: row.ministry_id ?? null,
    };

    const token = signToken(user);
    return sendJson(res, 200, { token, user });
  } catch (error) {
    console.error('Login error:', error);
    return sendJson(res, 500, { error: 'Error al iniciar sesión' });
  }
}
