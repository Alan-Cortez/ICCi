import { getDb } from './lib/turso.js';
import webpush from 'web-push';
import { sendJson, getBearerToken } from './lib/http.js';

function getVapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error('Configura VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en el servidor');
  }
  return { publicKey, privateKey };
}

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
    const { publicKey, privateKey } = getVapidConfig();
    webpush.setVapidDetails(
      process.env.VAPID_MAILTO || 'mailto:admin@icci.local',
      publicKey,
      privateKey
    );

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

    const subscriptions = await db.execute(`
      SELECT ps.subscription_json, u.nombre as user_name, u.id as user_id
      FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
    `);

    const todayKey = `${today.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const results = { notificationsCreated: 0, pushSent: 0, errors: [] };

    for (const member of birthdayMembers.rows) {
      const memberName = `${member.nombre} ${member.apellido_paterno}`;

      const users = await db.execute('SELECT id FROM users');
      for (const user of users.rows) {
        const exists = await db.execute({
          sql: `SELECT id FROM notifications WHERE user_id = ? AND tipo = 'cumpleanos' AND mensaje LIKE ? AND date(created_at) = date('now')`,
          args: [user.id, `%${memberName}%`],
        });
        if (exists.rows.length > 0) continue;

        await db.execute({
          sql: 'INSERT INTO notifications (user_id, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)',
          args: [user.id, '¡Cumpleaños Hoy!', `Hoy cumple años: ${memberName}, que no se te olvide!`, 'cumpleanos'],
        });
        results.notificationsCreated++;
      }

      for (const sub of subscriptions.rows) {
        try {
          const pushConfig = JSON.parse(sub.subscription_json);
          const payload = JSON.stringify({
            title: '¡Recordatorio de Cumpleaños!',
            body: `Hoy cumple años: ${memberName}, que no se te olvide : ${sub.user_name}`,
            url: '/members',
          });
          await webpush.sendNotification(pushConfig, payload);
          results.pushSent++;
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.execute({
              sql: 'DELETE FROM push_subscriptions WHERE subscription_json = ?',
              args: [sub.subscription_json],
            });
          }
          results.errors.push({ userId: sub.user_id, date: todayKey });
        }
      }
    }

    return sendJson(res, 200, results);
  } catch (error) {
    console.error('Error en check-birthdays:', error);
    return sendJson(res, 500, { error: error.message });
  }
}
