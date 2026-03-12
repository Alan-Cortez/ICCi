import tursoClient from './src/database/turso.js';

async function seedUsers() {
    try {
        console.log('Insertando usuarios iniciales...');

        // Admin General
        await tursoClient.execute({
            sql: `INSERT OR REPLACE INTO users (email, password, role, nombre) 
                  VALUES (?, ?, ?, ?)`,
            args: ['alancortez9966@gmail.com', 'Aned170205', 'admin', 'Admin General']
        });
        console.log('✅ Usuario Admin creado');

        // Miembro
        await tursoClient.execute({
            sql: `INSERT OR REPLACE INTO users (email, password, role, nombre) 
                  VALUES (?, ?, ?, ?)`,
            args: ['icc@gmail.com', 'icc123456', 'member', 'Miembro ICC']
        });
        console.log('✅ Usuario Miembro creado');

        console.log('✅ Usuarios insertados exitosamente');
    } catch (error) {
        console.error('❌ Error al insertar usuarios:', error);
        throw error;
    }
}

seedUsers()
    .then(() => {
        console.log('Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error en el proceso:', error);
        process.exit(1);
    });
