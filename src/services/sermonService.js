import tursoClient from '../database/turso';

export const getAllSermons = async () => {
    try {
        const result = await tursoClient.execute(`
            SELECT * FROM sermons 
            ORDER BY fecha DESC
        `);
        return result.rows.map(row => ({
            ...row,
            versiculos: row.versiculos ? JSON.parse(row.versiculos) : []
        }));
    } catch (error) {
        console.error('Error al obtener predicaciones:', error);
        throw error;
    }
};

export const getSermonById = async (id) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT * FROM sermons WHERE id = ?`,
            args: [id]
        });
        if (result.rows.length === 0) return null;

        const sermon = result.rows[0];
        return {
            ...sermon,
            versiculos: sermon.versiculos ? JSON.parse(sermon.versiculos) : []
        };
    } catch (error) {
        console.error('Error al obtener predicación:', error);
        throw error;
    }
};

export const createSermon = async (sermonData) => {
    try {
        const { titulo, fecha, predicador, versiculos, texto_completo } = sermonData;
        const result = await tursoClient.execute({
            sql: `INSERT INTO sermons (titulo, fecha, predicador, versiculos, texto_completo) 
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
                titulo,
                fecha,
                predicador,
                JSON.stringify(versiculos || []),
                texto_completo
            ]
        });
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al crear predicación:', error);
        throw error;
    }
};

export const updateSermon = async (id, sermonData) => {
    try {
        const { titulo, fecha, predicador, versiculos, texto_completo } = sermonData;
        await tursoClient.execute({
            sql: `UPDATE sermons 
                  SET titulo = ?, fecha = ?, predicador = ?, versiculos = ?, texto_completo = ?, updated_at = CURRENT_TIMESTAMP
                  WHERE id = ?`,
            args: [
                titulo,
                fecha,
                predicador,
                JSON.stringify(versiculos || []),
                texto_completo,
                id
            ]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar predicación:', error);
        throw error;
    }
};

export const deleteSermon = async (id) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM sermons WHERE id = ?`,
            args: [id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar predicación:', error);
        throw error;
    }
};

export const getSermonsByPreacher = async (preacher) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT * FROM sermons WHERE predicador LIKE ? ORDER BY fecha DESC`,
            args: [`%${preacher}%`]
        });
        return result.rows.map(row => ({
            ...row,
            versiculos: row.versiculos ? JSON.parse(row.versiculos) : []
        }));
    } catch (error) {
        console.error('Error al buscar predicaciones:', error);
        throw error;
    }
};
