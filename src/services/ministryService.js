import tursoClient from '../database/turso';
import { getCachedData, setCachedData } from './dataCache';

// Crear un nuevo ministerio
export const createMinistry = async (nombre, descripcion) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO ministries (nombre, descripcion) VALUES (?, ?)`,
            args: [nombre, descripcion]
        });
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al crear ministerio:', error);
        throw error;
    }
};

// Obtener todos los ministerios
export const getAllMinistries = async () => {
    try {
        // Si está offline, usar datos cacheados
        if (!navigator.onLine) {
            const cached = getCachedData('all_ministries');
            if (cached) {
                console.log('📦 Using cached ministries data');
                return cached;
            }
            return [];
        }

        const result = await tursoClient.execute('SELECT * FROM ministries ORDER BY nombre ASC');

        // Cachear datos
        setCachedData('all_ministries', result.rows);

        return result.rows;
    } catch (error) {
        console.error('Error al obtener ministerios:', error);

        // Fallback a cache
        const cached = getCachedData('all_ministries');
        if (cached) return cached;

        throw error;
    }
};

// Obtener ministerio por ID
export const getMinistryById = async (id) => {
    try {
        const result = await tursoClient.execute({
            sql: 'SELECT * FROM ministries WHERE id = ?',
            args: [id]
        });
        return result.rows[0];
    } catch (error) {
        console.error('Error al obtener ministerio:', error);
        throw error;
    }
};

// Agregar miembro al ministerio
export const addMemberToMinistry = async (ministryId, memberId) => {
    try {
        const fechaIngreso = new Date().toISOString().split('T')[0];
        const result = await tursoClient.execute({
            sql: `INSERT INTO ministry_members (ministry_id, member_id, fecha_ingreso, activo) VALUES (?, ?, ?, 1)`,
            args: [ministryId, memberId, fechaIngreso]
        });
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al agregar miembro al ministerio:', error);
        throw error;
    }
};

// Obtener miembros de un ministerio
export const getMinistryMembers = async (ministryId) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT 
          mm.id as membership_id,
          mm.fecha_ingreso,
          m.*
        FROM ministry_members mm
        INNER JOIN members m ON mm.member_id = m.id
        WHERE mm.ministry_id = ? AND mm.activo = 1
        ORDER BY m.nombre ASC
      `,
            args: [ministryId]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener miembros del ministerio:', error);
        throw error;
    }
};

// Remover miembro del ministerio
export const removeMemberFromMinistry = async (membershipId) => {
    try {
        await tursoClient.execute({
            sql: 'UPDATE ministry_members SET activo = 0 WHERE id = ?',
            args: [membershipId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al remover miembro del ministerio:', error);
        throw error;
    }
};

// Actualizar ministerio
export const updateMinistry = async (id, nombre, descripcion) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE ministries SET nombre = ?, descripcion = ? WHERE id = ?`,
            args: [nombre, descripcion, id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar ministerio:', error);
        throw error;
    }
};

// Eliminar/Archivar ministerio
export const deleteMinistry = async (id) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM ministries WHERE id = ?`,
            args: [id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar ministerio:', error);
        throw error;
    }
};

// Obtener estadísticas de un ministerio
export const getMinistryStats = async (id) => {
    try {
        const [membersResult, eventsResult, fundsResult] = await Promise.all([
            // Total de miembros
            tursoClient.execute({
                sql: `SELECT COUNT(*) as total FROM ministry_members WHERE ministry_id = ? AND activo = 1`,
                args: [id]
            }),
            // Total de eventos
            tursoClient.execute({
                sql: `SELECT COUNT(*) as total FROM events WHERE ministry_id = ?`,
                args: [id]
            }),
            // Balance de fondos
            tursoClient.execute({
                sql: `
                    SELECT 
                        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos,
                        SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as salidas
                    FROM funds
                    WHERE ministry_id = ?
                `,
                args: [id]
            })
        ]);

        const totalMembers = parseInt(membersResult.rows[0]?.total || 0);
        const totalEvents = parseInt(eventsResult.rows[0]?.total || 0);
        const ingresos = parseFloat(fundsResult.rows[0]?.ingresos || 0);
        const salidas = parseFloat(fundsResult.rows[0]?.salidas || 0);
        const balance = ingresos - salidas;

        return {
            totalMembers,
            totalEvents,
            balance,
            ingresos,
            salidas
        };
    } catch (error) {
        console.error('Error al obtener estadísticas del ministerio:', error);
        throw error;
    }
};
