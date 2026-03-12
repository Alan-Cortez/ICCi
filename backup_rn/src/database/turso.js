import { createClient } from '@libsql/client';

// Configuración del cliente Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
});

// Inicializar la base de datos con el schema
export const initializeDatabase = async () => {
  try {
    // Tabla de miembros
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS members (
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
      )
    `);

    // Tabla de jóvenes del ministerio
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS youth_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        fecha_ingreso DATE NOT NULL,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);

    // Tabla de asistencia
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youth_member_id INTEGER NOT NULL,
        fecha DATE NOT NULL,
        presente BOOLEAN NOT NULL,
        justificado BOOLEAN DEFAULT 0,
        razon_falta TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
      )
    `);

    // Tabla de cumplimiento
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS compliance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youth_member_id INTEGER NOT NULL,
        fecha DATE NOT NULL,
        tiene_biblia BOOLEAN DEFAULT 0,
        tiene_apuntes BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
      )
    `);

    // Tabla de liderazgo
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS leadership (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youth_member_id INTEGER NOT NULL,
        es_lider BOOLEAN DEFAULT 1,
        fecha_inicio DATE NOT NULL,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
      )
    `);

    // Tabla de asignaciones de liderazgo
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS leadership_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leadership_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('predicacion', 'intercesion', 'ayuno')),
        fecha_asignada DATE NOT NULL,
        completado BOOLEAN DEFAULT 0,
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leadership_id) REFERENCES leadership(id) ON DELETE CASCADE
      )
    `);

    // Tabla de eventos
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        fecha DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de fondos
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS funds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'salida')),
        monto DECIMAL(10, 2) NOT NULL,
        concepto TEXT NOT NULL,
        fecha DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

export default tursoClient;
