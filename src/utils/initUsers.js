import tursoClient from '../database/turso';

// Inicializar tabla de usuarios y sembrar datos iniciales
export const initializeUsersTable = async () => {
    try {
        console.log('Inicializando tabla de usuarios...');

        // Crear tabla si no existe
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
                nombre TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Tabla de usuarios creada');

        // Verificar si ya existen usuarios
        const existingUsers = await tursoClient.execute('SELECT COUNT(*) as count FROM users');
        const userCount = existingUsers.rows[0].count;

        if (userCount === 0) {
            console.log('Insertando usuarios iniciales...');

            // Admin General
            await tursoClient.execute({
                sql: `INSERT INTO users (email, password, role, nombre) 
                      VALUES (?, ?, ?, ?)`,
                args: ['alancortez9966@gmail.com', 'Aned170205', 'admin', 'Admin General']
            });
            console.log('✅ Usuario Admin creado');

            // Miembro
            await tursoClient.execute({
                sql: `INSERT INTO users (email, password, role, nombre) 
                      VALUES (?, ?, ?, ?)`,
                args: ['icc@gmail.com', 'icc123456', 'member', 'Miembro ICC']
            });
            console.log('✅ Usuario Miembro creado');
        } else {
            console.log(`ℹ️ Ya existen ${userCount} usuarios en la base de datos`);
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error al inicializar usuarios:', error);
        throw error;
    }
};
