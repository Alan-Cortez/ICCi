import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

// Clave pública VAPID (Generada por Antigravity)
const VAPID_PUBLIC_KEY = 'BL60me1E02DywvWA4ymTdyNHaUd6s_HCvtqh9zl25ayz7qxSve2htVJN3QNFry7vbwZyZ6T1AuFeKpWy-5r-L8M';

/**
 * Función de utilidad para convertir la clave VAPID de base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [subscription, setSubscription] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(currentUser.id);
      setNotifications(data);
      const count = await notificationService.getUnreadCount(currentUser.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
    // Opcional: Intervalo para refrescar
    const interval = setInterval(fetchNotifications, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /**
   * Solicitar permisos y suscribirse a Push
   */
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      
      // Suscribirse al servidor de Push
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        // Guardar en la DB por si acaso
        await notificationService.savePushSubscription(currentUser.id, existingSubscription);
        return existingSubscription;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setSubscription(newSubscription);
      await notificationService.savePushSubscription(currentUser.id, newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  /**
   * Marcar una como leída
   */
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  /**
   * Marcar todas como leídas
   */
  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await notificationService.markAllAsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, leido: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    permission,
    subscription,
    subscribeToPush,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
};
