import { getDb } from '../lib/turso.js';
import { sendJson, parseBody } from '../lib/http.js';
import { signToken } from '../lib/jwt.js';
import { OAuth2Client } from 'google-auth-library';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  try {
    const { credential, clientId } = parseBody(req);

    if (!credential) {
      return sendJson(res, 400, { error: 'Falta el token de Google' });
    }

    // El client ID lo puede mandar el frontend o podemos usar la variable de entorno del backend
    // Usamos el de entorno por seguridad, y si no está, el que envíe el cliente
    const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || clientId;

    if (!googleClientId) {
      return sendJson(res, 500, { error: 'Google Client ID no está configurado en el servidor' });
    }

    const client = new OAuth2Client(googleClientId);

    // Verificar el token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();

    // Buscar en la base de datos si el usuario existe
    const db = getDb();
    const result = await db.execute({
      sql: 'SELECT id, email, role, nombre, ministry_id FROM users WHERE email = ?',
      args: [email],
    });

    if (result.rows.length === 0) {
      // OPCIÓN A: Rechazamos al usuario si no existe en el sistema
      return sendJson(res, 401, {
        error: `El correo ${email} no está registrado en el sistema. Contacta al administrador para que te dé de alta.`,
      });
    }

    const row = result.rows[0];

    // Iniciamos sesión exitosamente
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
    console.error('Google login error:', error);
    return sendJson(res, 500, { error: 'Error al iniciar sesión con Google' });
  }
}
