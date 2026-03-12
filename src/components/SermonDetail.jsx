import React from 'react';
import { X, Calendar, User, BookOpen, Edit2 } from 'lucide-react';

export const SermonDetail = ({ sermon, onClose, onEdit }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl my-8">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {sermon.titulo}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User className="w-5 h-5" />
                            <span className="font-medium">{sermon.predicador}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-5 h-5" />
                            <span>{new Date(sermon.fecha).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                    </div>

                    {/* Versículos */}
                    {sermon.versiculos && sermon.versiculos.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    Versículos Usados
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {sermon.versiculos.map((verse, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                                    >
                                        {verse}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    {/* Texto Completo */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Contenido de la Predicación
                        </h4>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {sermon.texto_completo}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
