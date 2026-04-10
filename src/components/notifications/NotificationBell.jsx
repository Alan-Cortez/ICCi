import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Calendar, User, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, subscribeToPush, permission } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif) => {
        if (!notif.leido) {
            await markAsRead(notif.id);
        }
        setIsOpen(false);
        // Si tiene una URL específica (ej: de cumpleaños), navegar
        if (notif.tipo === 'cumpleanos') {
            navigate('/members');
        }
    };

    const handleEnablePush = async () => {
        await subscribeToPush();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl transition-all outline-none"
                title="Notificaciones"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Marcar todo como leído
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {permission !== 'granted' && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800/50">
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                        Activa las notificaciones en tu dispositivo para no perderte ningún cumpleaños.
                                    </p>
                                    <button
                                        onClick={handleEnablePush}
                                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-bold"
                                    >
                                        Activar Notificaciones Push
                                    </button>
                                </div>
                            )}

                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No tienes notificaciones</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {notifications.map((notif) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-3 ${!notif.leido ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                notif.tipo === 'cumpleanos' ? 'bg-pink-100 text-pink-500' :
                                                notif.tipo === 'sistema' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {notif.tipo === 'cumpleanos' ? <Calendar className="w-5 h-5" /> :
                                                 notif.tipo === 'sistema' ? <Info className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notif.leido ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {notif.titulo}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mt-0.5">
                                                    {notif.mensaje}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                                                </p>
                                            </div>
                                            {!notif.leido && (
                                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/notifications');
                            }}
                            className="w-full py-3 text-center text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700"
                        >
                            Ver todo el historial
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
