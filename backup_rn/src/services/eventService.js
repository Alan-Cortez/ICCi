import tursoClient from '../database/turso';

// Crear evento
export const createEvent = async (nombre, descripcion, fecha) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO events (nombre, descripcion, fecha) VALUES (?, ?, ?)`,
            args: [nombre, descripcion, fecha]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al crear evento:', error);
        throw error;
    }
};

// Obtener todos los eventos
export const getAllEvents = async () => {
    try {
        const result = await tursoClient.execute(`
      SELECT * FROM events ORDER BY fecha ASC
    `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        throw error;
    }
};

// Obtener eventos próximos (desde hoy en adelante)
export const getUpcomingEvents = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await tursoClient.execute({
            sql: `SELECT * FROM events WHERE fecha >= ? ORDER BY fecha ASC`,
            args: [today]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener eventos próximos:', error);
        throw error;
    }
};

// Actualizar evento
export const updateEvent = async (id, nombre, descripcion, fecha) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE events SET nombre = ?, descripcion = ?, fecha = ? WHERE id = ?`,
            args: [nombre, descripcion, fecha, id]
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
