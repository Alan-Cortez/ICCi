import { getDb } from './turso.js';
import { hashPassword } from './password.js';

const INITIAL_VERSES = [
  { reference: 'Juan 3:16', text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', category: 'Salvación' },
  { reference: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.', category: 'Fortaleza' },
  { reference: 'Salmos 23:1', text: 'Jehová es mi pastor; nada me faltará.', category: 'Confianza' },
];

async function safeAlter(db, sql) {
  try {
    await db.execute(sql);
  } catch {
    /* columna o tabla ya existe */
  }
}

export async function initializeSchema() {
  const db = getDb();

  await db.execute(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT NOT NULL,
    dia_cumpleanos INTEGER NOT NULL,
    mes_cumpleanos INTEGER NOT NULL,
    foto TEXT,
    genero TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS youth_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    fecha_ingreso DATE NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_member_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL,
    justificado BOOLEAN DEFAULT 0,
    razon_falta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_member_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    tiene_biblia BOOLEAN DEFAULT 0,
    tiene_apuntes BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS leadership (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_member_id INTEGER NOT NULL,
    es_lider BOOLEAN DEFAULT 1,
    fecha_inicio DATE NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS leadership_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leadership_id INTEGER,
    tipo TEXT NOT NULL,
    fecha_asignada DATE NOT NULL,
    completado BOOLEAN DEFAULT 0,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await safeAlter(db, 'ALTER TABLE leadership_assignments ADD COLUMN youth_member_id INTEGER');

  await db.execute(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS youth_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_member_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    contenido TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    concepto TEXT NOT NULL,
    categoria TEXT,
    fecha DATE NOT NULL,
    ministry_id INTEGER,
    registrado_por TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS ministries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS ministry_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ministry_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    fecha_ingreso DATE NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
  )`);

  await safeAlter(db, 'ALTER TABLE events ADD COLUMN ministry_id INTEGER');
  await safeAlter(db, 'ALTER TABLE funds ADD COLUMN ministry_id INTEGER');
  await safeAlter(db, 'ALTER TABLE funds ADD COLUMN categoria TEXT');
  await safeAlter(db, 'ALTER TABLE funds ADD COLUMN registrado_por TEXT');
  await safeAlter(db, 'ALTER TABLE events ADD COLUMN created_by INTEGER');
  await safeAlter(db, 'ALTER TABLE members ADD COLUMN telefono TEXT');
  await safeAlter(db, 'ALTER TABLE attendance ADD COLUMN es_reunion_cancelada BOOLEAN DEFAULT 0');
  await safeAlter(db, 'ALTER TABLE attendance ADD COLUMN es_evento_especial BOOLEAN DEFAULT 0');
  await safeAlter(db, 'ALTER TABLE attendance ADD COLUMN puntual BOOLEAN DEFAULT 1');
  await safeAlter(db, 'ALTER TABLE attendance ADD COLUMN notas TEXT');

  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    nombre TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await safeAlter(db, 'ALTER TABLE users ADD COLUMN ministry_id INTEGER');

  await db.execute(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT DEFAULT 'cumpleanos',
    leido BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subscription_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subscription_json),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT NOT NULL,
    text TEXT NOT NULL,
    version TEXT DEFAULT 'RVR1960',
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS sermons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    fecha DATE NOT NULL,
    predicador TEXT NOT NULL,
    versiculos TEXT,
    texto_completo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS pending_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    entity_data TEXT NOT NULL,
    requested_by_id TEXT,
    requested_by_nombre TEXT,
    ministry_id INTEGER,
    status TEXT DEFAULT 'pending',
    review_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME
  )`);

  const verseCount = await db.execute('SELECT COUNT(*) as count FROM bible_verses');
  if (Number(verseCount.rows[0].count) === 0) {
    for (const verse of INITIAL_VERSES) {
      await db.execute({
        sql: 'INSERT INTO bible_verses (reference, text, category, version) VALUES (?, ?, ?, ?)',
        args: [verse.reference, verse.text, verse.category, 'RVR1960'],
      });
    }
  }

  const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
  if (Number(userCount.rows[0].count) === 0) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Administrador';

    if (adminEmail && adminPassword) {
      const hashed = await hashPassword(adminPassword);
      await db.execute({
        sql: 'INSERT INTO users (email, password, role, nombre) VALUES (?, ?, ?, ?)',
        args: [adminEmail, hashed, 'admin', adminName],
      });
    }
  }

  return { success: true };
}
