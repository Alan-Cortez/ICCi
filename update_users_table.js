import tursoClient from './src/database/turso.js';

async function updateUsersTable() {
    try {
        console.log('🔄 Iniciando migración de tabla users...');

        // 1. Renombrar tabla actual
        console.log('1. Renombrando tabla actual...');
        // Verificamos si ya existe users_old por si hubo un intento fallido
        try {
            await tursoClient.execute('DROP TABLE IF EXISTS users_old');
            await tursoClient.execute('ALTER TABLE users RENAME TO users_old');
        } catch (e) {
            console.log('Nota: Puede que la tabla ya estuviera renombrada o no existiera');
        }

        // 2. Crear nueva tabla con la estructura actualizada
        console.log('2. Creando nueva tabla users...');
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'member', 'leader')),
                nombre TEXT NOT NULL,
                ministry_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ministry_id) REFERENCES ministries(id)
            )
        `);

        // 3. Copiar datos
        console.log('3. Copiando datos existentes...');
        await tursoClient.execute(`
            INSERT INTO users (id, email, password, role, nombre, created_at)
            SELECT id, email, password, role, nombre, created_at FROM users_old
        `);

        // 4. Eliminar tabla antigua
        console.log('4. Limpiando...');
        await tursoClient.execute('DROP TABLE users_old');

        console.log('✅ Migración completada exitosamente');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);

        // Intentar revertir en caso de error crítico
        try {
            console.log('Intentando revertir cambios...');
            await tursoClient.execute('DROP TABLE IF EXISTS users');
            await tursoClient.execute('ALTER TABLE users_old RENAME TO users');
            console.log('Cambios revertidos');
        } catch (rollbackError) {
            console.error('Error fatal al revertir:', rollbackError);
        }
    }
}

updateUsersTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
