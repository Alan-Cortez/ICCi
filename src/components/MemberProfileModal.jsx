import React from 'react';
import { X, Phone, Calendar, User } from 'lucide-react';

export const MemberProfileModal = ({ member, onClose }) => {
    if (!member) return null;

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="relative h-32 bg-[#020617] overflow-hidden">
                    {/* Abstract Fluid Mesh Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-[#020617] to-slate-950 opacity-90"></div>
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-600 rounded-full mix-blend-screen filter blur-[40px] opacity-30"></div>
                    <div className="absolute top-4 -right-12 w-40 h-40 bg-blue-400 rounded-full mix-blend-screen filter blur-[32px] opacity-20"></div>
                    <div className="absolute -bottom-10 left-1/4 w-56 h-56 bg-indigo-600 rounded-full mix-blend-screen filter blur-[48px] opacity-20"></div>
                    
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <div className="relative -mt-16 mb-4 flex justify-center">
                        {member.foto ? (
                            <img
                                src={member.foto}
                                alt={member.nombre}
                                className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-md object-cover bg-white"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <User className="w-16 h-16 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {member.nombre} {member.apellido_paterno} {member.apellido_materno}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">Miembro</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Cumpleaños</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {member.dia_cumpleanos} de {monthNames[member.mes_cumpleanos - 1]}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {member.telefono || 'No registrado'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
