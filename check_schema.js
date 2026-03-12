
import { createClient } from "@libsql/client";

const url = 'libsql://icci-poetacortez.aws-us-west-2.turso.io';
const authToken = 'eyJhIjoiN2M0ODFlNzRhMDg4MDYwN2EzOWY4ODk5YTYzZGU5NzAiLCJ0IjoiNWQ1ZDYxNTMtN2ZlZS00Yzk0LTk0YTQtYWM4NDFkOGI5YmI1IiwicyI6ImljY2kifQ==';

const tursoClient = createClient({
    url: url,
    authToken: authToken
});

async function checkSchema() {
    try {
        console.log('--- Leadership Assignments Schema ---');
        const assignments = await tursoClient.execute("PRAGMA table_info(leadership_assignments)");
        console.log(assignments.rows);

        console.log('--- Leadership Schema ---');
        const leadership = await tursoClient.execute("PRAGMA table_info(leadership)");
        console.log(leadership.rows);

        console.log('--- Youth Members Schema ---');
        const youth = await tursoClient.execute("PRAGMA table_info(youth_members)");
        console.log(youth.rows);

    } catch (e) {
        console.error(e);
    }
}

checkSchema();
