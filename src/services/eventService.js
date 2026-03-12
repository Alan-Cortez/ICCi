import tursoClient from '../database/turso';
import { getCachedData, setCachedData } from './dataCache';

// Crear evento
export const createEvent = async (nombre, descripcion, fecha, ministryId = null, createdBy = null) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO events (nombre, descripcion, fecha, ministry_id, created_by) VALUES (?, ?, ?, ?, ?)`,
            args: [nombre, descripcion, fecha, ministryId, createdBy]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al crear evento:', error);
        throw error;
    }
};

// Obtener todos los eventos (globales + ministerios)
export const getAllEvents = async () => {
    try {
        const result = await tursoClient.execute(`
      SELECT e.*, 
             m.nombre as creador_nombre, m.apellido_paterno as creador_apellido,
             min.nombre as ministerio_nombre
      FROM events e
      LEFT JOIN members m ON e.created_by = m.id
      LEFT JOIN ministries min ON e.ministry_id = min.id
      ORDER BY e.fecha ASC
    `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        throw error;
    }
};

// Obtener eventos por ministerio
export const getEventsByMinistry = async (ministryId) => {
    try {
        const result = await tursoClient.execute({
            sql: `
            SELECT e.*, m.nombre as creador_nombre, m.apellido_paterno as creador_apellido 
            FROM events e
            LEFT JOIN members m ON e.created_by = m.id
            WHERE e.ministry_id = ? 
            ORDER BY e.fecha ASC
            `,
            args: [ministryId]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener eventos del ministerio:', error);
        throw error;
    }
};

// Obtener eventos próximos (desde hoy en adelante)
export const getUpcomingEvents = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await tursoClient.execute({
            sql: `
            SELECT e.*, min.nombre as ministerio_nombre
            FROM events e
            LEFT JOIN ministries min ON e.ministry_id = min.id
            WHERE e.fecha >= ? 
            ORDER BY e.fecha ASC
            `,
            args: [today]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener eventos próximos:', error);
        throw error;
    }
};

// Obtener eventos por mes
export const getEventsByMonth = async (month, year) => {
    try {
        // Si está offline, usar datos cacheados
        if (!navigator.onLine) {
            const cached = getCachedData(`events_${month}_${year}`);
            if (cached) {
                console.log(`📦 Using cached events for ${month}/${year}`);
                return cached;
            }
            return [];
        }

        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

        const result = await tursoClient.execute({
            sql: `
            SELECT e.*, min.nombre as ministerio_nombre
            FROM events e
            LEFT JOIN ministries min ON e.ministry_id = min.id
            WHERE e.fecha LIKE ? 
            ORDER BY e.fecha ASC
            `,
            args: [`${monthStr}%`]
        });

        // Cachear datos
        setCachedData(`events_${month}_${year}`, result.rows);

        return result.rows;
    } catch (error) {
        console.error('Error al obtener eventos del mes:', error);

        // Fallback a cache
        const cached = getCachedData(`events_${month}_${year}`);
        if (cached) return cached;

        throw error;
    }
};

// Actualizar evento
export const updateEvent = async (id, nombre, descripcion, fecha, createdBy = null) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE events SET nombre = ?, descripcion = ?, fecha = ?, created_by = ? WHERE id = ?`,
            args: [nombre, descripcion, fecha, createdBy, id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        throw error;
    }
};

// Eliminar evento
export const deleteEvent = async (id) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM events WHERE id = ?`,
            args: [id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        throw error;
    }
};
