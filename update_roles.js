import { createClient } from '@libsql/client';

const tursoClient = createClient({
  url: 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
});

async function updateUsersRoles() {
    try {
        console.log('🔄 Iniciando migración de tabla users para nuevos roles de jóvenes...');

        console.log('1. Renombrando tabla actual...');
        try {
            await tursoClient.execute('DROP TABLE IF EXISTS users_old');
            await tursoClient.execute('ALTER TABLE users RENAME TO users_old');
        } catch (e) {
            console.log('Nota: Puede que la tabla ya estuviera renombrada');
        }

        console.log('2. Creando nueva tabla users con nuevos roles...');
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'member', 'leader', 'youth_liderazgo', 'youth_no_asistencia')),
                nombre TEXT NOT NULL,
                ministry_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ministry_id) REFERENCES ministries(id)
            )
        `);

        console.log('3. Copiando datos existentes...');
        await tursoClient.execute(`
            INSERT INTO users (id, email, password, role, nombre, ministry_id, created_at)
            SELECT id, email, password, role, nombre, ministry_id, created_at FROM users_old
        `);

        console.log('4. Limpiando tabla antigua...');
        await tursoClient.execute('DROP TABLE users_old');

        console.log('✅ Migración de roles completada exitosamente');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);

        try {
            console.log('Intentando revertir cambios...');
            await tursoClient.execute('DROP TABLE IF EXISTS users');
            await tursoClient.execute('ALTER TABLE users_old RENAME TO users');
            console.log('Cambios revertidos exitosamente');
        } catch (rollbackError) {
            console.error('Error fatal al revertir:', rollbackError);
        }
    }
}

updateUsersRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
