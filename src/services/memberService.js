import tursoClient from '../database/turso';
import { queueOperation } from './offlineStorage';
import { getCachedData, setCachedData } from './dataCache';

// Crear un nuevo miembro
export const createMember = async (memberData) => {
    try {
        // Si está offline, encolar operación
        if (!navigator.onLine) {
            console.log('📴 Offline: Queueing member creation');
            return queueOperation({
                type: 'CREATE_MEMBER',
                data: memberData
            });
        }

        const { nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono } = memberData;

        const result = await tursoClient.execute({
            sql: `INSERT INTO members (nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono || null]
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
        // Si está offline, usar datos cacheados
        if (!navigator.onLine) {
            const cached = getCachedData('all_members');
            if (cached) {
                console.log('📦 Using cached members data');
                return cached;
            }
            return [];
        }

        const result = await tursoClient.execute('SELECT * FROM members ORDER BY created_at DESC');

        // Cachear datos para uso offline
        setCachedData('all_members', result.rows);

        return result.rows;
    } catch (error) {
        console.error('Error al obtener miembros:', error);

        // Intentar usar cache si hay error
        const cached = getCachedData('all_members');
        if (cached) {
            console.log('📦 Using cached members data (error fallback)');
            return cached;
        }

        throw error;
    }
};

// Obtener miembros por mes de cumpleaños
export const getMembersByBirthdayMonth = async (month) => {
    try {
        // Si está offline, usar datos cacheados
        if (!navigator.onLine) {
            const cached = getCachedData(`birthdays_${month}`);
            if (cached) {
                console.log(`📦 Using cached birthdays for month ${month}`);
                return cached;
            }
            return [];
        }

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM members WHERE mes_cumpleanos = ? ORDER BY dia_cumpleanos ASC',
            args: [month]
        });

        // Cachear datos
        setCachedData(`birthdays_${month}`, result.rows);

        return result.rows;
    } catch (error) {
        console.error('Error al obtener cumpleañeros:', error);

        // Fallback a cache
        const cached = getCachedData(`birthdays_${month}`);
        if (cached) return cached;

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
        // Si está offline, encolar operación
        if (!navigator.onLine) {
            console.log('📴 Offline: Queueing member update');
            return queueOperation({
                type: 'UPDATE_MEMBER',
                data: { id, ...memberData }
            });
        }

        const { nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono } = memberData;

        await tursoClient.execute({
            sql: `UPDATE members 
            SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, 
                dia_cumpleanos = ?, mes_cumpleanos = ?, foto = ?, genero = ?, telefono = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            args: [nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono || null, id]
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
