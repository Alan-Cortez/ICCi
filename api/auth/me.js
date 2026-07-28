import { verifyToken } from '../_lib/jwt.js';
import { sendJson, getBearerToken } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return sendJson(res, 401, { error: 'No autenticado' });
  }

  const user = verifyToken(token);
  if (!user) {
    return sendJson(res, 401, { error: 'Sesión expirada' });
  }

  return sendJson(res, 200, { user });
}
