import tursoClient from './src/database/turso.js';

async function createUsersTable() {
    try {
        console.log('Creando tabla de usuarios...');

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

        console.log('✅ Tabla de usuarios creada exitosamente');
    } catch (error) {
        console.error('❌ Error al crear tabla de usuarios:', error);
        throw error;
    }
}

createUsersTable()
    .then(() => {
        console.log('Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error en el proceso:', error);
        process.exit(1);
    });
