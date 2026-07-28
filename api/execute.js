import { getDb } from './_lib/turso.js';
import { verifyToken } from './_lib/jwt.js';
import { requireAuth, ApiError } from './_lib/roles.js';
import { sendJson, getBearerToken, parseBody } from './_lib/http.js';
import { getOperation } from './_operations/index.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  try {
    console.log('[DEBUG] method:', req.method, 'body:', req.body);
    const { operation, args = {} } = parseBody(req);
    console.log('[DEBUG] operation:', operation, 'args:', args);
    if (!operation || typeof operation !== 'string') {
      return sendJson(res, 400, { error: 'Operación requerida' });
    }

    const op = getOperation(operation);
    if (!op) {
      return sendJson(res, 400, { error: 'Operación no permitida' });
    }

    let user = null;
    if (!op.public) {
      const token = getBearerToken(req);
      user = token ? verifyToken(token) : null;
      requireAuth(user);
    }

    const db = getDb();
    const data = await op.handler(db, user, args);
    return sendJson(res, 200, { data });
  } catch (error) {
    if (error instanceof ApiError) {
      return sendJson(res, error.status, { error: error.message });
    }
    console.error('Execute error:', error);
    return sendJson(res, 500, { error: error.message || 'Error interno' });
  }
}
