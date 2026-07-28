import { rows, run } from './helpers.js';

export const notificationOperations = {
  'notifications.get': {
    async handler(db, user, args) {
      const userId = args.userId ?? user.id;
      return rows(db, 'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50', [userId]);
    },
  },
  'notifications.markRead': {
    async handler(db, _user, args) {
      await run(db, 'UPDATE notifications SET leido = 1 WHERE id = ?', [args.notificationId]);
      return { success: true };
    },
  },
  'notifications.markAllRead': {
    async handler(db, user, args) {
      const userId = args.userId ?? user.id;
      await run(db, 'UPDATE notifications SET leido = 1 WHERE user_id = ? OR user_id IS NULL', [userId]);
      return { success: true };
    },
  },
  'notifications.unreadCount': {
    async handler(db, user, args) {
      const userId = args.userId ?? user.id;
      const r = await rows(db, 'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND leido = 0', [userId]);
      return r[0]?.count ?? 0;
    },
  },
  'notifications.savePushSubscription': {
    async handler(db, user, args) {
      const userId = args.userId ?? user.id;
      const subscriptionJson = JSON.stringify(args.subscription);
      await run(db, 'INSERT OR REPLACE INTO push_subscriptions (user_id, subscription_json) VALUES (?, ?)', [userId, subscriptionJson]);
      return { success: true };
    },
  },
  'notifications.removePushSubscription': {
    async handler(db, user, args) {
      const userId = args.userId ?? user.id;
      const subscriptionJson = JSON.stringify(args.subscription);
      await run(db, 'DELETE FROM push_subscriptions WHERE user_id = ? AND subscription_json = ?', [userId, subscriptionJson]);
      return { success: true };
    },
  },
  'notifications.testPush': {
    async handler(db, user, args) {
      const { sendPushToUsers } = await import('../_lib/push.js');
      const payload = {
        title: '¡Push de prueba funciona!',
        body: 'El sistema de notificaciones está configurado correctamente.',
        url: '/notifications',
      };
      
      const result = await sendPushToUsers([user.id], payload);
      
      if (result.sent > 0) {
        return { success: true, message: 'Notificación enviada' };
      } else {
        throw new Error('No se pudo enviar la notificación. ¿Estás suscrito?');
      }
    },
  },
};
