import { createClient } from '@libsql/client';

let client = null;

function readEnv(name, legacyViteName) {
  return process.env[name] || process.env[legacyViteName];
}

export function getDb() {
  if (client) return client;

  const url = readEnv('TURSO_DATABASE_URL', 'VITE_TURSO_DATABASE_URL');
  const authToken = readEnv('TURSO_AUTH_TOKEN', 'VITE_TURSO_AUTH_TOKEN');

  if (!url || !authToken) {
    throw new Error(
      'Faltan credenciales de Turso. Crea un archivo .env.local en la raíz del proyecto con TURSO_DATABASE_URL y TURSO_AUTH_TOKEN (copia .env.example).'
    );
  }

  client = createClient({ url, authToken });
  return client;
}

export async function dbExecute(sql, args = []) {
  const db = getDb();
  return db.execute({ sql, args });
}
