import { initializeSchema } from './_lib/schema.js';
import { sendJson } from './_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  try {
    await initializeSchema();
    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error('Init error:', error);
    return sendJson(res, 500, { error: error.message || 'Error al inicializar' });
  }
}
