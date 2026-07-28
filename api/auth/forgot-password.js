import { getDb } from '../_lib/turso.js';
import { sendJson, parseBody } from '../_lib/http.js';
import { sendPasswordResetEmail } from '../_lib/email.js';
import crypto from 'crypto';

const TOKEN_EXPIRY_MINUTES = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  let emailNorm = '';
  try {
    const body = parseBody(req);
    const email = body.email;

    if (!email) {
      return sendJson(res, 400, { error: 'El correo electrónico es requerido' });
    }

    emailNorm = email.trim().toLowerCase();
    const db = getDb();

    // Buscar usuario (respuesta genérica para no revelar si existe)
    const result = await db.execute({
      sql: 'SELECT id, email, nombre FROM users WHERE email = ?',
      args: [emailNorm],
    });

    // SIEMPRE respondemos con éxito para no revelar si el email existe
    if (result.rows.length === 0) {
      return sendJson(res, 200, {
        message: 'Si el correo existe, recibirás un enlace de restablecimiento.',
      });
    }

    const user = result.rows[0];

    // Invalidar tokens previos no usados del mismo usuario
    await db.execute({
      sql: 'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      args: [user.id],
    });

    // Generar token criptográficamente seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)
      .toISOString()
      .replace('T', ' ')
      .split('.')[0];

    await db.execute({
      sql: 'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      args: [user.id, token, expiresAt],
    });

    // Determinar URL base (Vercel production o desarrollo local)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VITE_APP_URL ||
      (req.headers['x-forwarded-host']
        ? `https://${req.headers['x-forwarded-host']}`
        : 'http://localhost:5173');

    await sendPasswordResetEmail(emailNorm, token, baseUrl);

    return sendJson(res, 200, {
      message: 'Si el correo existe, recibirás un enlace de restablecimiento.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    // Si el email no está configurado en desarrollo, devolvemos el enlace directamente
    if (error.message?.includes('Email no configurado')) {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        // Re-obtener el token que acabamos de insertar para devolverlo al cliente
        const db2 = getDb();
        const tokenRow = await db2.execute({
          sql: `SELECT prt.token
                FROM password_reset_tokens prt
                INNER JOIN users u ON u.id = prt.user_id
                WHERE u.email = ? AND prt.used = 0
                ORDER BY prt.created_at DESC LIMIT 1`,
          args: [emailNorm],
        }).catch(() => ({ rows: [] }));

        const devToken = tokenRow.rows[0]?.token;
        const devLink = devToken
          ? `${process.env.VITE_APP_URL || 'http://localhost:5173'}/reset-password?token=${devToken}`
          : null;

        return sendJson(res, 200, {
          message: 'SMTP no configurado — modo desarrollo: usa el enlace de abajo para continuar.',
          devResetLink: devLink,
          devMode: true,
        });
      }

      return sendJson(res, 503, {
        error:
          'El servicio de correo no está configurado. Contacta al administrador del sistema.',
      });
    }

    return sendJson(res, 500, { error: 'Error al procesar la solicitud' });
  }
}
