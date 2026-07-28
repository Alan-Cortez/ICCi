import webpush from 'web-push';
import { getDb } from './turso.js';

let webpushInitialized = false;

export function initWebPush() {
  if (webpushInitialized) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn('VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY no están configuradas.');
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO || 'mailto:admin@icci.local',
    publicKey,
    privateKey
  );
  webpushInitialized = true;
  return true;
}

/**
 * Enviar notificaciones push a uno o varios usuarios.
 * @param {Array<number>} userIds Lista de IDs de usuarios a los que enviar.
 * @param {object} payload El contenido de la notificación {title, body, url}
 */
export async function sendPushToUsers(userIds, payload) {
  if (!initWebPush()) return { sent: 0, errors: 0 };
  if (!userIds || userIds.length === 0) return { sent: 0, errors: 0 };

  const db = getDb();
  // Obtener las suscripciones de los usuarios especificados
  // Como Sqlite/LibSQL no soporta muy bien arrays en sentencias parametrizadas largas de una vez fácilmente, 
  // armaremos los placeholders.
  const placeholders = userIds.map(() => '?').join(',');
  const subscriptions = await db.execute({
    sql: `SELECT user_id, subscription_json FROM push_subscriptions WHERE user_id IN (${placeholders})`,
    args: userIds,
  });

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let errors = 0;

  for (const sub of subscriptions.rows) {
    try {
      const pushConfig = JSON.parse(sub.subscription_json);
      await webpush.sendNotification(pushConfig, payloadString);
      sent++;
    } catch (error) {
      errors++;
      if (error.statusCode === 410 || error.statusCode === 404) {
        // La suscripción expiró o fue cancelada por el usuario
        await db.execute({
          sql: 'DELETE FROM push_subscriptions WHERE subscription_json = ?',
          args: [sub.subscription_json],
        });
      } else {
        console.error('Error enviando push:', error);
      }
    }
  }
  return { sent, errors };
}

/**
 * Enviar notificaciones push a todos los administradores
 */
export async function sendPushToAdmins(payload) {
  const db = getDb();
  const admins = await db.execute("SELECT id FROM users WHERE role = 'admin'");
  const adminIds = admins.rows.map(row => row.id);
  return sendPushToUsers(adminIds, payload);
}

/**
 * Enviar notificaciones push a todos los usuarios
 */
export async function sendPushToAll(payload) {
  const db = getDb();
  const users = await db.execute("SELECT id FROM users");
  const userIds = users.rows.map(row => row.id);
  return sendPushToUsers(userIds, payload);
}
