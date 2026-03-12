import tursoClient from './src/database/turso.js';

async function testQuery() {
    try {
        console.log('Testing getAllUsers query...');
        const result = await tursoClient.execute(`
            SELECT u.id, u.email, u.role, u.nombre, u.created_at, u.ministry_id, m.nombre as ministry_name 
            FROM users u
            LEFT JOIN ministries m ON u.ministry_id = m.id
            ORDER BY u.created_at DESC
        `);
        console.log('Query successful!');
        console.log('Rows found:', result.rows.length);
        if (result.rows.length > 0) {
            console.log('Sample row:', result.rows[0]);
        }
    } catch (error) {
        console.error('Query FAILED:', error);
    }
}

testQuery();
