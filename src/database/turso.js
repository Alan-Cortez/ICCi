import { createClient } from '@libsql/client';

// Configuración del cliente Turso
const tursoClient = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL || 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
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

    // Tabla de notas de jóvenes
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS youth_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youth_member_id INTEGER NOT NULL,
        fecha DATE NOT NULL,
        contenido TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (youth_member_id) REFERENCES youth_members(id) ON DELETE CASCADE
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

    // Tabla de ministerios
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS ministries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de miembros de ministerios
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS ministry_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ministry_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        fecha_ingreso DATE NOT NULL,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);

    // Migraciones: Agregar columna ministry_id a eventos y fondos si no existe
    try {
      await tursoClient.execute("ALTER TABLE events ADD COLUMN ministry_id INTEGER");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    try {
      await tursoClient.execute("ALTER TABLE funds ADD COLUMN ministry_id INTEGER");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    try {
      await tursoClient.execute("ALTER TABLE events ADD COLUMN created_by INTEGER");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    try {
      await tursoClient.execute("ALTER TABLE members ADD COLUMN telefono TEXT");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    // Nuevas columnas para attendance (reuniones canceladas, eventos especiales, puntualidad)
    try {
      await tursoClient.execute("ALTER TABLE attendance ADD COLUMN es_reunion_cancelada BOOLEAN DEFAULT 0");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    try {
      await tursoClient.execute("ALTER TABLE attendance ADD COLUMN es_evento_especial BOOLEAN DEFAULT 0");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    try {
      await tursoClient.execute("ALTER TABLE attendance ADD COLUMN puntual BOOLEAN DEFAULT 1");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    try {
      await tursoClient.execute("ALTER TABLE attendance ADD COLUMN notas TEXT");
    } catch (e) {
      // Ignorar error si la columna ya existe
    }

    // Tabla de usuarios para autenticación
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
        nombre TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de versículos bíblicos
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS bible_verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL,
        text TEXT NOT NULL,
        version TEXT DEFAULT 'RVR1960',
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de predicaciones (Escritos)
    await tursoClient.execute(`
      CREATE TABLE IF NOT EXISTS sermons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        fecha DATE NOT NULL,
        predicador TEXT NOT NULL,
        versiculos TEXT,
        texto_completo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sembrar versículos iniciales si no existen
    const existingVerses = await tursoClient.execute('SELECT COUNT(*) as count FROM bible_verses');
    const verseCount = existingVerses.rows[0].count;

    if (verseCount === 0) {
      const initialVerses = [
        { reference: 'Juan 3:16', text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', category: 'Salvación' },
        { reference: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.', category: 'Fortaleza' },
        { reference: 'Salmos 23:1', text: 'Jehová es mi pastor; nada me faltará.', category: 'Confianza' },
        { reference: 'Proverbios 3:5-6', text: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.', category: 'Sabiduría' },
        { reference: 'Romanos 8:28', text: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.', category: 'Esperanza' },
        { reference: 'Isaías 40:31', text: 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.', category: 'Fortaleza' },
        { reference: 'Mateo 11:28', text: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.', category: 'Paz' },
        { reference: 'Jeremías 29:11', text: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.', category: 'Esperanza' },
        { reference: '2 Corintios 5:7', text: 'Porque por fe andamos, no por vista.', category: 'Fe' },
        { reference: 'Salmos 46:1', text: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.', category: 'Protección' },
        { reference: 'Proverbios 16:3', text: 'Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.', category: 'Sabiduría' },
        { reference: 'Filipenses 4:6-7', text: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.', category: 'Paz' },
        { reference: 'Josué 1:9', text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.', category: 'Valentía' },
        { reference: 'Salmos 119:105', text: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.', category: 'Guía' },
        { reference: '1 Corintios 13:4-5', text: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece; no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor.', category: 'Amor' },
        { reference: 'Romanos 12:2', text: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.', category: 'Transformación' },
        { reference: 'Hebreos 11:1', text: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.', category: 'Fe' },
        { reference: 'Salmos 37:4', text: 'Deléitate asimismo en Jehová, y él te concederá las peticiones de tu corazón.', category: 'Bendición' },
        { reference: 'Mateo 6:33', text: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.', category: 'Prioridades' },
        { reference: '1 Juan 4:19', text: 'Nosotros le amamos a él, porque él nos amó primero.', category: 'Amor' },
        { reference: 'Efesios 2:8-9', text: 'Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios; no por obras, para que nadie se gloríe.', category: 'Gracia' },
        { reference: 'Salmos 91:1-2', text: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío; Mi Dios, en quien confiaré.', category: 'Protección' },
        { reference: 'Gálatas 5:22-23', text: 'Mas el fruto del Espíritu es amor, gozo, paz, paciencia, benignidad, bondad, fe, mansedumbre, templanza; contra tales cosas no hay ley.', category: 'Fruto del Espíritu' },
        { reference: 'Colosenses 3:23', text: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.', category: 'Servicio' },
        { reference: 'Santiago 1:2-3', text: 'Hermanos míos, tened por sumo gozo cuando os halléis en diversas pruebas, sabiendo que la prueba de vuestra fe produce paciencia.', category: 'Pruebas' },
        { reference: '2 Timoteo 1:7', text: 'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.', category: 'Poder' },
        { reference: 'Apocalipsis 3:20', text: 'He aquí, yo estoy a la puerta y llamo; si alguno oye mi voz y abre la puerta, entraré a él, y cenaré con él, y él conmigo.', category: 'Invitación' },
        { reference: 'Salmos 34:8', text: 'Gustad, y ved que es bueno Jehová; dichoso el hombre que confía en él.', category: 'Bendición' },
        { reference: 'Proverbios 18:10', text: 'Torre fuerte es el nombre de Jehová; a él correrá el justo, y será levantado.', category: 'Refugio' },
        { reference: 'Isaías 41:10', text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.', category: 'Consuelo' }
      ];

      for (const verse of initialVerses) {
        await tursoClient.execute({
          sql: `INSERT INTO bible_verses (reference, text, category, version) VALUES (?, ?, ?, ?)`,
          args: [verse.reference, verse.text, verse.category, 'RVR1960']
        });
      }

      console.log('✅ Versículos iniciales creados');
    }

    // Sembrar usuarios iniciales si no existen
    const existingUsers = await tursoClient.execute('SELECT COUNT(*) as count FROM users');
    const userCount = existingUsers.rows[0].count;

    if (userCount === 0) {
      // Admin General
      await tursoClient.execute({
        sql: `INSERT INTO users (email, password, role, nombre) VALUES (?, ?, ?, ?)`,
        args: ['alancortez9966@gmail.com', 'Aned170205', 'admin', 'Admin General']
      });

      // Miembro
      await tursoClient.execute({
        sql: `INSERT INTO users (email, password, role, nombre) VALUES (?, ?, ?, ?)`,
        args: ['icc@gmail.com', 'icc123456', 'member', 'Miembro ICC']
      });

      console.log('✅ Usuarios iniciales creados');
    }

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

export default tursoClient;
