import { createClient } from "@libsql/client";

const url = 'libsql://icci-poetacortez.aws-us-west-2.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag';

const tursoClient = createClient({
    url: url,
    authToken: authToken
});

async function main() {
    try {
        console.log('--- Verifying Schema ---');
        // Check if `ministry_id` exists in `users`
        const tableInfo = await tursoClient.execute("PRAGMA table_info(users)");
        const hasMinistryId = tableInfo.rows.some(col => col.name === 'ministry_id');

        if (!hasMinistryId) {
            console.log('⚠️ Column `ministry_id` missing. Performing full migration...');
            
            // Rename old table
            await tursoClient.execute('DROP TABLE IF EXISTS users_backup');
            await tursoClient.execute('ALTER TABLE users RENAME TO users_backup');

            // Create new table with all columns and constraints
            await tursoClient.execute(`
                CREATE TABLE users (
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

            // Copy data back using a safe insert that handles missing columns in backup
            console.log('Moving data...');
            // We assume backup has email, password, role, nombre. ministry_id will be null.
            // Note: old role constraint might fail if we have 'leader' which old table didn't allow, but new one does.
            // But old data should be fine.
            await tursoClient.execute(`
                INSERT INTO users (id, email, password, role, nombre, created_at)
                SELECT id, email, password, role, nombre, created_at FROM users_backup
            `);

            console.log('✅ Schema updated successfully.');
            // Drop backup? Maybe keep for safety or drop.
            // await tursoClient.execute('DROP TABLE users_backup'); 
        } else {
            console.log('✅ Schema appears correct (ministry_id exists).');
        }

        console.log('--- Verifying Users ---');
        
        // 1. Admin User
        const adminEmail = 'alancortez9966@gmail.com';
        const adminData = await tursoClient.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [adminEmail]
        });

        if (adminData.rows.length === 0) {
            console.log('Creating Admin user...');
            await tursoClient.execute({
                sql: "INSERT INTO users (email, password, role, nombre) VALUES (?, ?, 'admin', 'Alan Cortez')",
                args: [adminEmail, 'Aned170205']
            });
        } else {
            console.log('Updating Admin user role/password...');
            await tursoClient.execute({
                sql: "UPDATE users SET role = 'admin', password = 'Aned170205' WHERE email = ?",
                args: [adminEmail]
            });
        }

        // 2. Member User
        const memberEmail = 'miembros@gmail.com';
        const memberData = await tursoClient.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [memberEmail]
        });

        if (memberData.rows.length === 0) {
            console.log('Creating Member user...');
            // Password not provided, using default '123456' or similar
            await tursoClient.execute({
                sql: "INSERT INTO users (email, password, role, nombre) VALUES (?, ?, 'member', 'Miembros')",
                args: [memberEmail, '123456'] 
            });
        } else {
            console.log('Updating Member role...');
            await tursoClient.execute({
                sql: "UPDATE users SET role = 'member' WHERE email = ?",
                args: [memberEmail]
            });
        }

        console.log('--- Verification Complete ---');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

main();
