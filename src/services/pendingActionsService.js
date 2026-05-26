import { apiExecute } from '../lib/apiClient';

export const createPendingAction = async (actionType, entityData, user, ministryId) =>
    apiExecute('pending.create', { actionType, entityData, ministryId });

export const getPendingActions = async (ministryId) => apiExecute('pending.getAll', { ministryId });

export const getPendingCount = async (ministryId) => {
    try {
        return await apiExecute('pending.getCount', { ministryId });
    } catch {
        return 0;
    }
};

export const approveAction = async (action) => apiExecute('pending.approve', { action });

export const rejectAction = async (actionId, note = '') => apiExecute('pending.reject', { actionId, note });

export const getActionLabel = (actionType, entityData) => {
    if (!entityData) return actionType;
    let data;
    try {
        data = typeof entityData === 'string' ? JSON.parse(entityData) : entityData;
    } catch {
        return actionType;
    }
    if (!data) return actionType;

    switch (actionType) {
        case 'add_youth_member':
            return `Agregar miembro: ${data.memberNombre || ''}`;
        case 'remove_youth_member':
            return `Remover miembro: ${data.memberNombre || ''}`;
        case 'add_leadership':
            return `Añadir a Liderazgo: ${data.memberNombre || ''}`;
        case 'remove_leadership':
            return `Remover de Liderazgo: ${data.memberNombre || ''}`;
        case 'assign_task':
            return `Asignar tarea "${data.tipo}" a ${data.memberNombre || ''} para el ${data.fecha || ''}`;
        case 'create_event':
            return `Crear Evento: "${data.nombre}" (${data.fecha})`;
        case 'update_event':
            return `Editar Evento: "${data.nombre}" (${data.fecha})`;
        case 'delete_event':
            return `Eliminar Evento: "${data.nombre}"`;
        case 'add_transaction':
            return `Finanzas: ${data.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} de $${data.monto} (${data.concepto})`;
        case 'delete_transaction':
            return `Finanzas: Borrar transacción "${data.concepto}" de $${data.monto}`;
        case 'complete_task':
            return `Marcar tarea completada: ${data.memberNombre || ''}`;
        default:
            return actionType;
    }
};
