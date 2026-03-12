import React from 'react';
import { Settings, Bell, Calendar, Palette } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';

export const AdminSettings = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Configuración
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Personaliza la configuración del sistema
                </p>
            </div>

            {/* General Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuración General
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Tema de la Aplicación</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Alternar entre modo claro y oscuro</p>
                        </div>
                        <ThemeToggle />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Nombre de la Iglesia</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Iglesia Cristiana Camino Internacional</p>
                        </div>
                        <button className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Editar
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notificaciones
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Recordatorios de Eventos</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Recibir notificaciones de eventos próximos</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Alertas de Cumpleaños</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Notificar cumpleaños de miembros</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Alertas de Fondos Bajos</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Notificar cuando los fondos sean menores a $1,000</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Attendance Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Configuración de Asistencia
                </h3>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Días de Reunión</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {['Domingo', 'Miércoles', 'Viernes'].map(day => (
                                <label key={day} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        defaultChecked={day === 'Domingo'}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Apariencia
                </h3>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Color Primario</h4>
                        <div className="flex gap-3">
                            {['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-red-600', 'bg-yellow-600'].map(color => (
                                <button
                                    key={color}
                                    className={`w-10 h-10 rounded-full ${color} hover:scale-110 transition-transform ${color === 'bg-blue-600' ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
