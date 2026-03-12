
import { createClient } from "@libsql/client";

const url = 'libsql://icci-poetacortez.aws-us-west-2.turso.io';
// Using the token from src/database/turso.js
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag';

const tursoClient = createClient({
    url: url,
    authToken: authToken
});

async function migrate() {
    try {
        console.log('--- Migration Attempt 3: Add youth_member_id to leadership_assignments ---');

        const tableInfo = await tursoClient.execute("PRAGMA table_info(leadership_assignments)");
        const hasColumn = tableInfo.rows.some(col => col.name === 'youth_member_id');

        if (!hasColumn) {
            console.log('Adding youth_member_id column...');
            // Now we can try to include the reference if we want, or keep it simple.
            // Let's keep it simple first to ensure it Works.
            await tursoClient.execute("ALTER TABLE leadership_assignments ADD COLUMN youth_member_id INTEGER");
            console.log('Column added.');
        } else {
            console.log('Column youth_member_id already exists.');
        }

        console.log('Backfilling existing assignments...');

        const assignments = await tursoClient.execute("SELECT id, leadership_id FROM leadership_assignments WHERE youth_member_id IS NULL AND leadership_id IS NOT NULL");

        if (assignments.rows.length === 0) {
            console.log('No assignments to backfill.');
        } else {
            console.log(`Found ${assignments.rows.length} assignments to backfill. Processing...`);
            for (const row of assignments.rows) {
                const leader = await tursoClient.execute({
                    sql: "SELECT youth_member_id FROM leadership WHERE id = ?",
                    args: [row.leadership_id]
                });
                if (leader.rows.length > 0) {
                    await tursoClient.execute({
                        sql: "UPDATE leadership_assignments SET youth_member_id = ? WHERE id = ?",
                        args: [leader.rows[0].youth_member_id, row.id]
                    });
                }
            }
            console.log('Backfill complete.');
        }

        console.log('Migration finished successfully.');

    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();
