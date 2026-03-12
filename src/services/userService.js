import tursoClient from '../database/turso';

export const getAllUsers = async () => {
    try {
        const result = await tursoClient.execute(`
            SELECT u.id, u.email, u.role, u.nombre, u.created_at, u.ministry_id, m.nombre as ministry_name 
            FROM users u
            LEFT JOIN ministries m ON u.ministry_id = m.id
            ORDER BY u.created_at DESC
        `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
};

export const updateUser = async (userId, userData) => {
    try {
        const { email, role, nombre, ministry_id } = userData;
        await tursoClient.execute({
            sql: `UPDATE users SET email = ?, role = ?, nombre = ?, ministry_id = ? WHERE id = ?`,
            args: [email, role, nombre, ministry_id || null, userId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
};

export const createUser = async (userData) => {
    try {
        const { email, password, role, nombre, ministry_id } = userData;
        const result = await tursoClient.execute({
            sql: `INSERT INTO users (email, password, role, nombre, ministry_id) VALUES (?, ?, ?, ?, ?)`,
            args: [email, password, role, nombre, ministry_id || null]
        });
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
};

export const deleteUser = async (userId) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM users WHERE id = ?`,
            args: [userId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
};
