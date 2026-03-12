
import { createClient } from "@libsql/client";

const url = 'libsql://icci-poetacortez.aws-us-west-2.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag';

const tursoClient = createClient({
    url: url,
    authToken: authToken
});

async function migrate() {
    try {
        console.log('--- Recreating leadership_assignments Table ---');

        // 1. Rename existing table
        console.log('Renaming old table...');
        try {
            await tursoClient.execute("ALTER TABLE leadership_assignments RENAME TO leadership_assignments_old");
        } catch (e) {
            console.log('Error renaming (maybe already renamed?):', e.message);
            // If it fails, maybe it doesn't exist or we already renamed it in a failed run.
            // Let's verify if _old exists.
        }

        // 2. Create new table
        console.log('Creating new table...');
        await tursoClient.execute(`
            CREATE TABLE leadership_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                leadership_id INTEGER, -- Now NULLABLE
                youth_member_id INTEGER, -- Added explicitly
                tipo TEXT NOT NULL CHECK(tipo IN ('predicacion', 'intercesion', 'ayuno')),
                fecha_asignada DATE NOT NULL,
                completado BOOLEAN DEFAULT 0,
                notas TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (leadership_id) REFERENCES leadership(id) ON DELETE CASCADE,
                FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
            )
        `);

        // 3. Copy data
        console.log('Copying data...');
        // Note: The old table might have 'youth_member_id' if my previous migration partially worked or we just added it.
        // If the previous migration added the column, we can copy it.
        // Let's check columns of old table.

        let columns = 'id, leadership_id, tipo, fecha_asignada, completado, notas, created_at';
        let selectColumns = 'id, leadership_id, tipo, fecha_asignada, completado, notas, created_at';

        const oldTableInfo = await tursoClient.execute("PRAGMA table_info(leadership_assignments_old)");
        const hasYouthId = oldTableInfo.rows.some(col => col.name === 'youth_member_id');

        if (hasYouthId) {
            columns += ', youth_member_id';
            selectColumns += ', youth_member_id';
        }

        await tursoClient.execute(`
            INSERT INTO leadership_assignments (${columns})
            SELECT ${selectColumns} FROM leadership_assignments_old
        `);

        // If we didn't have youth_member_id in old table (failed migration), we need to backfill again.
        if (!hasYouthId) {
            console.log('Backfilling youth_member_id for migrated data...');
            await tursoClient.execute(`
                UPDATE leadership_assignments 
                SET youth_member_id = (
                    SELECT youth_member_id 
                    FROM leadership 
                    WHERE leadership.id = leadership_assignments.leadership_id
                )
                WHERE youth_member_id IS NULL AND leadership_id IS NOT NULL
            `);
        }

        console.log('Data copied successfully.');

        // 4. Verify count
        const countOld = await tursoClient.execute("SELECT COUNT(*) as c FROM leadership_assignments_old");
        const countNew = await tursoClient.execute("SELECT COUNT(*) as c FROM leadership_assignments");
        console.log(`Old count: ${countOld.rows[0].c}, New count: ${countNew.rows[0].c}`);

        // 5. Cleanup
        // await tursoClient.execute("DROP TABLE leadership_assignments_old");
        // console.log('Old table dropped.'); 
        console.log('Keeping leadership_assignments_old as backup. Delete manually later.');

        console.log('Migration finished successfully.');

    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
