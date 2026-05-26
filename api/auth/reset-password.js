import { getDb } from '../lib/turso.js';
import { hashPassword } from '../lib/password.js';
import { sendJson, parseBody } from '../lib/http.js';

const MIN_PASSWORD_LENGTH = 8;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  try {
    const { token, password } = parseBody(req);

    if (!token || !password) {
      return sendJson(res, 400, { error: 'Token y nueva contraseña son requeridos' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return sendJson(res, 400, {
        error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      });
    }

    const db = getDb();

    // Buscar token válido (no usado y no expirado)
    const result = await db.execute({
      sql: `SELECT prt.id, prt.user_id, prt.expires_at, prt.used
            FROM password_reset_tokens prt
            WHERE prt.token = ?`,
      args: [token],
    });

    if (result.rows.length === 0) {
      return sendJson(res, 400, {
        error: 'El enlace de restablecimiento no es válido o ya fue utilizado',
      });
    }

    const row = result.rows[0];

    if (row.used) {
      return sendJson(res, 400, { error: 'Este enlace ya fue utilizado' });
    }

    const expiresAt = new Date(row.expires_at + 'Z'); // asegurar UTC
    if (Date.now() > expiresAt.getTime()) {
      return sendJson(res, 400, {
        error: 'El enlace ha expirado. Solicita uno nuevo.',
      });
    }

    // Actualizar contraseña
    const hashed = await hashPassword(password);
    await db.execute({
      sql: 'UPDATE users SET password = ? WHERE id = ?',
      args: [hashed, row.user_id],
    });

    // Marcar token como usado
    await db.execute({
      sql: 'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
      args: [row.id],
    });

    // Invalida otros tokens pendientes del mismo usuario
    await db.execute({
      sql: 'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      args: [row.user_id],
    });

    return sendJson(res, 200, { message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Reset password error:', error);
    return sendJson(res, 500, { error: 'Error al restablecer la contraseña' });
  }
}
