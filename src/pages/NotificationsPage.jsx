import React, { useState } from 'react';
import { Bell, Search, Check, Trash2, Calendar, User, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

export const NotificationsPage = () => {
    const navigate = useNavigate();
    const { notifications, loading, markAsRead, markAllAsRead, refresh } = useNotifications();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNotifications = notifications.filter(n =>
        n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.mensaje.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMarkAsRead = async (id) => {
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        if (window.confirm('¿Deseas marcar todas las notificaciones como leídas?')) {
            await markAllAsRead();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Centro de Notificaciones</h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Mantente al tanto de los cumpleaños y noticias de la iglesia</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                        title="Actualizar"
                    >
                        <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors text-sm font-bold flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Marcar todo como leído
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
                {/* Search and Filters */}
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar notificaciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-transparent focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-2xl shadow-sm transition-all outline-none"
                    />
                </div>

                {/* Mobile Actions */}
                <div className="flex sm:hidden justify-between items-center gap-2">
                    <button
                        onClick={refresh}
                        className="flex-1 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl shadow-sm font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl shadow-sm font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Todo leído
                    </button>
                </div>

                {/* Notifications List */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {loading && filteredNotifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">Cargando notificaciones...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sin notificaciones</h3>
                            <p className="text-gray-500 dark:text-gray-400">No encontramos notificaciones que coincidan con tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredNotifications.map((notif, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={notif.id}
                                    className={`p-4 sm:p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 flex flex-col sm:flex-row gap-4 sm:items-start ${!notif.leido ? 'bg-blue-50/20 dark:bg-blue-900/10 border-l-4 border-blue-600' : ''}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                        notif.tipo === 'cumpleanos' ? 'bg-pink-100 text-pink-500' :
                                        notif.tipo === 'sistema' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {notif.tipo === 'cumpleanos' ? <Calendar className="w-6 h-6" /> :
                                         notif.tipo === 'sistema' ? <Info className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <h3 className={`text-lg transition-colors ${!notif.leido ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {notif.titulo}
                                            </h3>
                                            <span className="text-xs font-medium text-gray-400">
                                                {format(new Date(notif.created_at), "d 'de' MMMM, h:mm a", { locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {notif.mensaje}
                                        </p>
                                    </div>

                                    {!notif.leido && (
                                        <button
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all self-end sm:self-center"
                                        >
                                            Leída
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
