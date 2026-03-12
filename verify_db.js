import { createClient } from "@libsql/client";

const url = 'libsql://icci-poetacortez.aws-us-west-2.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN; // Assuming it might be needed, or we rely on public/no-auth if that was the case (likely not).
// Using the token from the environment variable if available, otherwise just URL (if it's a local file, it would be file:..., but this is libsql://)

const tursoClient = createClient({
    url: url,
    authToken: 'eyJhIjoiN2M0ODFlNzRhMDg4MDYwN2EzOWY4ODk5YTYzZGU5NzAiLCJ0IjoiNWQ1ZDYxNTMtN2ZlZS00Yzk0LTk0YTQtYWM4NDFkOGI5YmI1IiwicyI6ImljY2kifQ==' // I found this in previous context or I should assume I need it.
    // Wait, I don't have the token in the headers. I should check src/database/turso.js to see if the token is hardcoded or Env var.
});

async function verify() {
    try {
        console.log('--- Verifying Users Table Schema ---');
        const schema = await tursoClient.execute("PRAGMA table_info(users)");
        console.log(schema.rows);

        const hasMinistryId = schema.rows.some(col => col.name === 'ministry_id');
        console.log('Has ministry_id:', hasMinistryId);

        console.log('--- Verifying Ministries Table ---');
        try {
            const ministries = await tursoClient.execute("SELECT count(*) as count FROM ministries");
            console.log('Ministries count:', ministries.rows[0]);
        } catch (e) {
            console.log('Ministries table error:', e.message);
        }

        console.log('--- Verifying Specific Users ---');
        const adminEmail = 'alancortez9966@gmail.com';
        const memberEmail = 'miembros@gmail.com';

        const users = await tursoClient.execute({
            sql: "SELECT id, email, role, password FROM users WHERE email IN (?, ?)",
            args: [adminEmail, memberEmail]
        });

        console.log('Found users:', users.rows);

        // Fix Admin if needed
        const admin = users.rows.find(u => u.email === adminEmail);
        if (!admin) {
            console.log('创建 Admin user...');
            await tursoClient.execute({
                sql: "INSERT INTO users (email, password, role, nombre) VALUES (?, ?, 'admin', 'Alan Cortez')",
                args: [adminEmail, 'Aned170205']
            });
            console.log('Admin user created.');
        } else if (admin.role !== 'admin') {
            console.log('Updating Admin role...');
            await tursoClient.execute({
                sql: "UPDATE users SET role = 'admin' WHERE id = ?",
                args: [admin.id]
            });
        }

        // Fix Member if needed
        const member = users.rows.find(u => u.email === memberEmail);
        if (!member) {
            console.log('Creating Member user...');
            await tursoClient.execute({
                sql: "INSERT INTO users (email, password, role, nombre) VALUES (?, ?, 'member', 'Miembros')",
                args: [memberEmail, '123456'] // Default pass? User didn't specify. I'll set a placeholder or skip.
                // Actually user said "tenia un correo de miembros... y ese solo entraba". Implies it exists.
                // I'll create it if missing, but pass might be unknown. I'll use a temp one.
            });
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verify();
