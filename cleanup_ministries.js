import { createClient } from '@libsql/client';

const tursoClient = createClient({
    url: 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
});

async function cleanup() {
    console.log('🧹 Limpiando ministerios de prueba...');

    try {
        // Buscar el ministerio a eliminar
        const result = await tursoClient.execute({
            sql: "SELECT * FROM ministries WHERE nombre LIKE '%momentaneo%'"
        });

        if (result.rows.length > 0) {
            for (const row of result.rows) {
                console.log(`🗑️ Eliminando ministerio: ${row.nombre} (ID: ${row.id})`);
                await tursoClient.execute({
                    sql: "DELETE FROM ministries WHERE id = ?",
                    args: [row.id]
                });
            }
            console.log('✨ Ministerio eliminado correctamente.');
        } else {
            console.log('ℹ️ No se encontró el ministerio "jovenes momentaneo".');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

cleanup();
