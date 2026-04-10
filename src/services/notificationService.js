import tursoClient from '../database/turso';

/**
 * Servicio para gestionar las notificaciones en la aplicación
 */
export const notificationService = {
  /**
   * Obtener notificaciones de un usuario
   */
  async getNotifications(userId) {
    try {
      const result = await tursoClient.execute({
        sql: 'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50',
        args: [userId]
      });
      return result.rows;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  },

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId) {
    try {
      await tursoClient.execute({
        sql: 'UPDATE notifications SET leido = 1 WHERE id = ?',
        args: [notificationId]
      });
      return { success: true };
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  },

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId) {
    try {
      await tursoClient.execute({
        sql: 'UPDATE notifications SET leido = 1 WHERE user_id = ? OR user_id IS NULL',
        args: [userId]
      });
      return { success: true };
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      throw error;
    }
  },

  /**
   * Obtener el conteo de notificaciones no leídas
   */
  async getUnreadCount(userId) {
    try {
      const result = await tursoClient.execute({
        sql: 'SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND leido = 0',
        args: [userId]
      });
      return result.rows[0].count;
    } catch (error) {
      console.error('Error al obtener conteo:', error);
      return 0;
    }
  },

  /**
   * Guardar una suscripción Push
   */
  async savePushSubscription(userId, subscription) {
    try {
      const subscriptionJson = JSON.stringify(subscription);
      
      // Intentar insertar, si existe no hace nada por el UNIQUE
      await tursoClient.execute({
        sql: 'INSERT OR REPLACE INTO push_subscriptions (user_id, subscription_json) VALUES (?, ?)',
        args: [userId, subscriptionJson]
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error al guardar suscripción push:', error);
      throw error;
    }
  },

  /**
   * Eliminar una suscripción Push (al cerrar sesión)
   */
  async removePushSubscription(userId, subscription) {
    try {
      const subscriptionJson = JSON.stringify(subscription);
      await tursoClient.execute({
        sql: 'DELETE FROM push_subscriptions WHERE user_id = ? AND subscription_json = ?',
        args: [userId, subscriptionJson]
      });
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar suscripción push:', error);
      throw error;
    }
  }
};

export default notificationService;
