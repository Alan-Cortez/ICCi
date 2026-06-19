import { apiExecute } from '../lib/apiClient';

export const notificationService = {
  async getNotifications(userId) {
    try {
      return await apiExecute('notifications.get', { userId });
    } catch {
      return [];
    }
  },

  async markAsRead(notificationId) {
    return apiExecute('notifications.markRead', { notificationId });
  },

  async markAllAsRead(userId) {
    return apiExecute('notifications.markAllRead', { userId });
  },

  async getUnreadCount(userId) {
    try {
      return await apiExecute('notifications.unreadCount', { userId });
    } catch {
      return 0;
    }
  },

  async savePushSubscription(userId, subscription) {
    return apiExecute('notifications.savePushSubscription', { userId, subscription });
  },

  async removePushSubscription(userId, subscription) {
    return apiExecute('notifications.removePushSubscription', { userId, subscription });
  },

  async testPush() {
    return apiExecute('notifications.testPush', {});
  },
};

export default notificationService;
