import tursoClient from '../database/turso';

// Obtener todas las notas de un joven
export const getNotesByYouth = async (youthId) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT * FROM youth_notes WHERE youth_member_id = ? ORDER BY fecha DESC, created_at DESC`,
            args: [youthId]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener notas:', error);
        throw error;
    }
};

// Agregar una nueva nota
export const addNote = async (youthId, fecha, contenido) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO youth_notes (youth_member_id, fecha, contenido) VALUES (?, ?, ?)`,
            args: [youthId, fecha, contenido]
        });
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al agregar nota:', error);
        throw error;
    }
};

// Obtener todas las notas del ministerio con información del joven
export const getAllNotes = async () => {
    try {
        const result = await tursoClient.execute(`
            SELECT 
                yn.id, 
                yn.youth_member_id, 
                yn.fecha, 
                yn.contenido, 
                yn.created_at,
                m.nombre, 
                m.apellido_paterno,
                m.foto
            FROM youth_notes yn
            INNER JOIN youth_members ym ON yn.youth_member_id = ym.id
            INNER JOIN members m ON ym.member_id = m.id
            ORDER BY yn.fecha DESC, yn.created_at DESC
        `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener todas las notas:', error);
        throw error;
    }
};

// Editar una nota
export const updateNote = async (noteId, contenido) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE youth_notes SET contenido = ? WHERE id = ?`,
            args: [contenido, noteId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar nota:', error);
        throw error;
    }
};

// Eliminar una nota
export const deleteNote = async (noteId) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM youth_notes WHERE id = ?`,
            args: [noteId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar nota:', error);
        throw error;
    }
};
