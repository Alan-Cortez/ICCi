import { createClient } from '@libsql/client';

const tursoClient = createClient({
    url: 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
});

async function clearEvents() {
    console.log('🗑️ Iniciando eliminación de todos los eventos...');

    try {
        await tursoClient.execute('DELETE FROM events');
        console.log('✅ Todos los eventos han sido eliminados correctamente.');

        // Reset auto-increment if needed (optional, typically SQLite handles this automatically or it doesn't matter much)
        // await tursoClient.execute("DELETE FROM sqlite_sequence WHERE name='events'");

    } catch (error) {
        console.error('❌ Error al eliminar eventos:', error);
    } finally {
        process.exit();
    }
}

clearEvents();
