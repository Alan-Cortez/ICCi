import tursoClient from '../database/turso';
import { addYouthMember, removeYouthMember } from './youthService';
import { addToLeadership, assignTask } from './leadershipService';

// Crear una solicitud pendiente
export const createPendingAction = async (actionType, entityData, user, ministryId) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO pending_actions 
                  (action_type, entity_data, requested_by_id, requested_by_nombre, ministry_id)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
                actionType,
                JSON.stringify(entityData),
                String(user.id),
                user.nombre,
                ministryId || null
            ]
        });
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al crear acción pendiente:', error);
        throw error;
    }
};

// Obtener todas las solicitudes pendientes del ministerio
export const getPendingActions = async (ministryId) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT * FROM pending_actions 
                  WHERE ministry_id = ? 
                  ORDER BY created_at DESC`,
            args: [ministryId]
        });
        return result.rows.map(row => ({
            ...row,
            entity_data: JSON.parse(row.entity_data)
        }));
    } catch (error) {
        console.error('Error al obtener acciones pendientes:', error);
        throw error;
    }
};

// Obtener solo las pendientes (sin revisar)
export const getPendingCount = async (ministryId) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT COUNT(*) as total FROM pending_actions WHERE ministry_id = ? AND status = 'pending'`,
            args: [ministryId]
        });
        return parseInt(result.rows[0]?.total || 0);
    } catch (error) {
        return 0;
    }
};

// Aprobar una acción y ejecutarla en la DB
export const approveAction = async (action) => {
    try {
        const data = typeof action.entity_data === 'string'
            ? JSON.parse(action.entity_data)
            : action.entity_data;

        // Ejecutar la acción original
        switch (action.action_type) {
            case 'add_youth_member':
                await addYouthMember(data.memberId);
                break;
            case 'remove_youth_member':
                await removeYouthMember(data.youthId);
                break;
            case 'add_leadership':
                await addToLeadership(data.youthId);
                break;
            case 'assign_task':
                await assignTask(data.youthMemberId, data.tipo, data.fecha, data.notas, data.leadershipId);
                break;
            default:
                throw new Error(`Tipo de acción desconocido: ${action.action_type}`);
        }

        // Marcar como aprobada
        await tursoClient.execute({
            sql: `UPDATE pending_actions 
                  SET status = 'approved', reviewed_at = datetime('now') 
                  WHERE id = ?`,
            args: [action.id]
        });

        return { success: true };
    } catch (error) {
        console.error('Error al aprobar acción:', error);
        throw error;
    }
};

// Rechazar una acción
export const rejectAction = async (actionId, note = '') => {
    try {
        await tursoClient.execute({
            sql: `UPDATE pending_actions 
                  SET status = 'rejected', reviewed_at = datetime('now'), review_note = ?
                  WHERE id = ?`,
            args: [note, actionId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al rechazar acción:', error);
        throw error;
    }
};

// Labels descriptivos para cada tipo de acción
export const getActionLabel = (actionType, entityData) => {
    const data = typeof entityData === 'string' ? JSON.parse(entityData) : entityData;
    switch (actionType) {
        case 'add_youth_member':
            return `Agregar miembro: ${data.memberNombre || ''}`;
        case 'remove_youth_member':
            return `Remover miembro: ${data.memberNombre || ''}`;
        case 'add_leadership':
            return `Añadir a Liderazgo: ${data.memberNombre || ''}`;
        case 'assign_task':
            return `Asignar tarea "${data.tipo}" a ${data.memberNombre || ''} para el ${data.fecha || ''}`;
        default:
            return actionType;
    }
};
