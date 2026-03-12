import { createClient } from '@libsql/client';

const tursoClient = createClient({
    url: 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
});

const ministries = [
    { nombre: 'Herederos al Reino', descripcion: 'Ministerio de niños' },
    { nombre: 'Jóvenes', descripcion: 'Ministerio de jóvenes' },
    { nombre: 'Femenil', descripcion: 'Ministerio de mujeres' },
    { nombre: 'Varones', descripcion: 'Ministerio de hombres' },
    { nombre: 'Danza', descripcion: 'Ministerio de danza' },
    { nombre: 'Alabanza', descripcion: 'Ministerio de alabanza' },
    { nombre: 'Media', descripcion: 'Ministerio multimedia y redes' },
    { nombre: 'Servidores', descripcion: 'Ministerio de servicio y ujieres' },
    { nombre: 'Matrimonios', descripcion: 'Ministerio de parejas' },
    { nombre: 'Evangelismo', descripcion: 'Ministerio de evangelización' }
];

async function seed() {
    console.log('🌱 Iniciando sembrado de ministerios...');

    try {
        const existing = await tursoClient.execute('SELECT nombre FROM ministries');
        const existingNames = new Set(existing.rows.map(row => row.nombre));

        for (const ministry of ministries) {
            // Check for exact match or case-insensitive match
            const isPresent = [...existingNames].some(name => name.toLowerCase() === ministry.nombre.toLowerCase());

            if (!isPresent) {
                console.log(`➕ Creando ministerio: ${ministry.nombre}`);
                await tursoClient.execute({
                    sql: 'INSERT INTO ministries (nombre, descripcion) VALUES (?, ?)',
                    args: [ministry.nombre, ministry.descripcion]
                });
            } else {
                console.log(`✅ Ministerio ya existe: ${ministry.nombre}`);
            }
        }

        console.log('✨ Proceso completado');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

seed();
