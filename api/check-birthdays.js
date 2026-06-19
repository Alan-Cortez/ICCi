import { getDb } from './lib/turso.js';
import { sendPushToUsers } from './lib/push.js';
import { sendJson, getBearerToken } from './lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = getBearerToken(req) || req.headers['x-cron-secret'];
    if (auth !== cronSecret) {
      return sendJson(res, 401, { error: 'No autorizado' });
    }
  }

  try {
    const db = getDb();
    const today = new Date();
    const formatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Monterrey',
      day: 'numeric',
      month: 'numeric',
    });
    const parts = formatter.formatToParts(today);
    const day = parseInt(parts.find((p) => p.type === 'day').value, 10);
    const month = parseInt(parts.find((p) => p.type === 'month').value, 10);

    const birthdayMembers = await db.execute({
      sql: 'SELECT id, nombre, apellido_paterno FROM members WHERE dia_cumpleanos = ? AND mes_cumpleanos = ?',
      args: [day, month],
    });

    if (birthdayMembers.rows.length === 0) {
      return sendJson(res, 200, { message: 'No hay cumpleaños hoy' });
    }

    const results = { notificationsCreated: 0, pushSent: 0, errors: 0 };
    const users = await db.execute('SELECT id FROM users');
    const userIds = users.rows.map(u => u.id);

    for (const member of birthdayMembers.rows) {
      const memberName = `${member.nombre} ${member.apellido_paterno}`;

      for (const userId of userIds) {
        const exists = await db.execute({
          sql: `SELECT id FROM notifications WHERE user_id = ? AND tipo = 'cumpleanos' AND mensaje LIKE ? AND date(created_at) = date('now')`,
          args: [userId, `%${memberName}%`],
        });
        if (exists.rows.length > 0) continue;

        await db.execute({
          sql: 'INSERT INTO notifications (user_id, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)',
          args: [userId, '¡Cumpleaños Hoy!', `Hoy cumple años: ${memberName}, que no se te olvide!`, 'cumpleanos'],
        });
        results.notificationsCreated++;
      }

      // Enviar push a todos los usuarios
      const payload = {
        title: '¡Recordatorio de Cumpleaños!',
        body: `Hoy cumple años: ${memberName}, que no se te olvide!`,
        url: '/members',
      };
      
      const pushResult = await sendPushToUsers(userIds, payload);
      results.pushSent += pushResult.sent;
      results.errors += pushResult.errors;
    }

    return sendJson(res, 200, results);
  } catch (error) {
    console.error('Error en check-birthdays:', error);
    return sendJson(res, 500, { error: error.message });
  }
}
