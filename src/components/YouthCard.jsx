import React from 'react';
import { Trash2, Crown, Phone, Calendar, Edit2 } from 'lucide-react';

export const YouthCard = ({ youth, onClick, onDelete, onEdit, showStats = false, stats = null }) => {
    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(youth);
        }
    };

    const getInitials = (nombre, apellido) => {
        return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`;
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500 transition-all group relative overflow-hidden"
            onClick={onClick}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/20 rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>

            <div className="flex items-start gap-4 relative z-10">
                {/* Avatar */}
                <div className="relative">
                    {youth.foto ? (
                        <img
                            src={youth.foto}
                            alt={`${youth.nombre} ${youth.apellido_paterno}`}
                            className="w-14 h-14 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-200 text-lg font-bold shadow-sm">
                            {getInitials(youth.nombre, youth.apellido_paterno)}
                        </div>
                    )}

                    {/* Leader Badge */}
                    {youth.es_lider && (
                        <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 p-1 rounded-lg shadow-sm border-2 border-white dark:border-gray-800 transform -rotate-12 z-20">
                            <Crown className="w-3 h-3" fill="currentColor" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {youth.nombre} {youth.apellido_paterno}
                    </h3>

                    <div className="space-y-1 mt-1">
                        {youth.telefono && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Phone className="w-3 h-3 mr-1.5 opacity-60" />
                                <span className="truncate">{youth.telefono}</span>
                            </div>
                        )}
                        {youth.fecha_nacimiento && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3 mr-1.5 opacity-60" />
                                <span>{new Date(youth.fecha_nacimiento).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    {showStats && stats && (
                        <div className="mt-3 flex gap-2">
                            <div className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                                {stats.attendancePercentage}% Asist.
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(youth);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                            title="Editar"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
                            title="Remover"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
