
import { createClient } from "@libsql/client";

const url = 'libsql://icci-poetacortez.aws-us-west-2.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag';

const tursoClient = createClient({
    url: url,
    authToken: authToken
});

async function verify() {
    try {
        console.log('--- Verifying Assignments Logic ---');

        // 1. Get a youth member who is NOT a leader
        const youthMembers = await tursoClient.execute("SELECT id FROM youth_members WHERE activo = 1 LIMIT 5");
        const leaders = await tursoClient.execute("SELECT youth_member_id FROM leadership WHERE activo = 1");

        const leaderIds = leaders.rows.map(l => l.youth_member_id);
        const nonLeader = youthMembers.rows.find(y => !leaderIds.includes(y.id));

        if (!nonLeader) {
            console.log('No non-leader youth found for testing. Skipping non-leader test.');
        } else {
            console.log(`Found non-leader youth ID: ${nonLeader.id}. Attempting to assign Ayuno...`);

            // Insert assignment directly for testing (simulating service call)
            const result = await tursoClient.execute({
                sql: `INSERT INTO leadership_assignments (leadership_id, youth_member_id, tipo, fecha_asignada, completado, notas) 
                VALUES (NULL, ?, 'ayuno', ?, 0, 'Test Auto Assignment')`,
                args: [nonLeader.id, new Date().toISOString().split('T')[0]]
            });
            console.log('Assignment created via SQL. ID:', result.lastInsertRowid);

            // Verify we can retrieve it with our new JOIN logic
            const retrieved = await tursoClient.execute({
                sql: `
                    SELECT 
                      la.id, la.tipo, m.nombre
                    FROM leadership_assignments la
                    LEFT JOIN youth_members ym ON la.youth_member_id = ym.id
                    LEFT JOIN leadership l ON la.leadership_id = l.id
                    LEFT JOIN youth_members ym2 ON l.youth_member_id = ym2.id
                    INNER JOIN members m ON COALESCE(ym.member_id, ym2.member_id) = m.id
                    WHERE la.id = ?
                `,
                args: [result.lastInsertRowid]
            });

            if (retrieved.rows.length > 0) {
                console.log('✅ Verification Successful: Retrieved non-leader assignment correctly.');
                console.log('Row:', retrieved.rows[0]);

                // Clean up
                await tursoClient.execute({
                    sql: "DELETE FROM leadership_assignments WHERE id = ?",
                    args: [result.lastInsertRowid]
                });
                console.log('Test assignment cleaned up.');
            } else {
                console.error('❌ Verification Failed: Could not retrieve assignment with new JOIN logic.');
            }
        }

    } catch (e) {
        console.error('Verification failed:', e);
    }
}

verify();
