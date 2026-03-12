import tursoClient from '../database/turso';

// Crear un nuevo miembro
export const createMember = async (memberData) => {
    try {
        const { nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero } = memberData;

        const result = await tursoClient.execute({
            sql: `INSERT INTO members (nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al crear miembro:', error);
        throw error;
    }
};

// Obtener todos los miembros
export const getAllMembers = async () => {
    try {
        const result = await tursoClient.execute('SELECT * FROM members ORDER BY created_at DESC');
        return result.rows;
    } catch (error) {
        console.error('Error al obtener miembros:', error);
        throw error;
    }
};

// Obtener un miembro por ID
export const getMemberById = async (id) => {
    try {
        const result = await tursoClient.execute({
            sql: 'SELECT * FROM members WHERE id = ?',
            args: [id]
        });
        return result.rows[0];
    } catch (error) {
        console.error('Error al obtener miembro:', error);
        throw error;
    }
};

// Actualizar un miembro
export const updateMember = async (id, memberData) => {
    try {
        const { nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero } = memberData;

        await tursoClient.execute({
            sql: `UPDATE members 
            SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, 
                dia_cumpleanos = ?, mes_cumpleanos = ?, foto = ?, genero = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            args: [nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, id]
        });

        return { success: true };
    } catch (error) {
        console.error('Error al actualizar miembro:', error);
        throw error;
    }
};

// Eliminar un miembro
export const deleteMember = async (id) => {
    try {
        await tursoClient.execute({
            sql: 'DELETE FROM members WHERE id = ?',
            args: [id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar miembro:', error);
        throw error;
    }
};
