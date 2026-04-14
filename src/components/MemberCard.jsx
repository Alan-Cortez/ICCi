import React from 'react';
import { useAuth } from '../context/AuthContext';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MemberCard = ({ member, onEdit, onDelete }) => {
    const { isAdmin, isLeader } = useAuth();
    
    const handleDelete = () => {
        if (window.confirm(`¿Estás seguro de eliminar a ${member.nombre} ${member.apellido_paterno}?`)) {
            onDelete(member.id);
        }
    };

    const mesNombre = MESES[member.mes_cumpleanos - 1] || '';
    const canManage = isAdmin() || isLeader();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex flex-row mb-4">
                {/* Foto del miembro */}
                <div className="mr-4 flex-shrink-0">
                    {member.foto ? (
                        <img src={member.foto} alt={`${member.nombre} ${member.apellido_paterno}`} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                        <div className="w-20 h-20 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-2xl font-bold">
                            {member.nombre.charAt(0)}{member.apellido_paterno.charAt(0)}
                        </div>
                    )}
                </div>

                {/* Información del miembro */}
                <div className="flex-1 justify-center min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 truncate">
                        {member.nombre} {member.apellido_paterno} {member.apellido_materno}
                    </h3>

                    <div className="flex flex-row mb-1 items-center">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mr-2">Cumpleaños:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-200">{member.dia_cumpleanos} de {mesNombre}</span>
                    </div>

                    <div className="flex flex-row items-center">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mr-2">Género:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-200">{member.genero}</span>
                    </div>
                </div>
            </div>

            {/* Botones de acción (Solo para Admin o Líder) */}
            {canManage && (
                <div className="flex flex-row gap-2 mt-2">
                    <button
                        className="flex-1 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                        onClick={() => onEdit(member)}
                    >
                        Editar
                    </button>

                    <button
                        className="flex-1 py-2 rounded-md bg-white dark:bg-gray-700 border border-red-500 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        onClick={handleDelete}
                    >
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};
