import { createClient } from '@libsql/client';

const client = createClient({
    url: 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
});

async function migrate() {
    try {
        await client.execute(`
            CREATE TABLE IF NOT EXISTS pending_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_type TEXT NOT NULL,
                entity_data TEXT NOT NULL,
                requested_by_id TEXT NOT NULL,
                requested_by_nombre TEXT NOT NULL,
                status TEXT DEFAULT 'pending'
                    CHECK(status IN ('pending','approved','rejected')),
                ministry_id INTEGER,
                created_at TEXT DEFAULT (datetime('now')),
                reviewed_at TEXT,
                review_note TEXT
            )
        `);
        console.log('✅ Tabla pending_actions creada exitosamente');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

migrate();
