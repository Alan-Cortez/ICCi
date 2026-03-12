-- Schema para la tabla de miembros
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
);

-- Tabla de jóvenes del ministerio
CREATE TABLE IF NOT EXISTS youth_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    fecha_ingreso DATE NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Tabla de asistencia
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_member_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL,
    justificado BOOLEAN DEFAULT 0,
    razon_falta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
);

-- Tabla de cumplimiento (Biblia y apuntes)
CREATE TABLE IF NOT EXISTS compliance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_member_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    tiene_biblia BOOLEAN DEFAULT 0,
    tiene_apuntes BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
);

-- Tabla de liderazgo
CREATE TABLE IF NOT EXISTS leadership (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    youth_member_id INTEGER NOT NULL,
    es_lider BOOLEAN DEFAULT 1,
    fecha_inicio DATE NOT NULL,
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
);

-- Tabla de asignaciones de liderazgo
CREATE TABLE IF NOT EXISTS leadership_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leadership_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('predicacion', 'intercesion', 'ayuno')),
    fecha_asignada DATE NOT NULL,
    completado BOOLEAN DEFAULT 0,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leadership_id) REFERENCES leadership(id) ON DELETE CASCADE
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de fondos (transacciones)
CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'salida')),
    monto DECIMAL(10, 2) NOT NULL,
    concepto TEXT NOT NULL,
    fecha DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

