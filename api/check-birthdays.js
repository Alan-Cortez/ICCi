const { createClient } = require('@libsql/client');
const webpush = require('web-push');

// Configuración de Turso en Node.js
const turso = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL || 'libsql://icci-poetacortez.aws-us-west-2.turso.io',
  authToken: process.env.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjQ4OTI4MjIsImlkIjoiNjk1NmEwMGEtZDU5Ni00ZWQ2LThiMzMtMGQ4NGZkYjVlNzAxIiwicmlkIjoiOWI4MDM5YWEtZTcxOC00ZjhlLThjODYtNTY0MzU4ZjI0OGM5In0.DYHiwiAcA_WUOTXrP7ptJ986O5CqRQC8cESX50Ycho3AZINLD3IIa6BbrCAWwH8rygTNVJTONDWmexuTqGs3Ag'
});

// Configuración de Web Push
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BL60me1E02DywvWA4ymTdyNHaUd6s_HCvtqh9zl25ayz7qxSve2htVJN3QNFry7vbwZyZ6T1AuFeKpWy-5r-L8M';
const VAPID_PRIVATE_KEY = process.env.VITE_VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:alancortez9966@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY || 'xpE9HX5NJIibrmD4M0me85J6XRgmWDBm6TrIpmS3dYA'
);

module.exports = async (req, res) => {
  // Solo permitir GET (para el Cron) o POST con una clave secreta
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date();
    // Ajuste a hora de Piedras Negras (CST/CDT)
    // Vercel corre en UTC. Piedras Negras es UTC-6 o UTC-5.
    // Para simplificar, obtenemos día y mes local del servidor (asumiendo que el cron corre a la hora correcta)
    // Pero mejor forzamos la zona horaria.
    const formatter = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Monterrey', // Misma zona que Piedras Negras
      day: 'numeric',
      month: 'numeric'
    });
    const parts = formatter.formatToParts(today);
    const day = parseInt(parts.find(p => p.type === 'day').value);
    const month = parseInt(parts.find(p => p.type === 'month').value);

    console.log(`Buscando cumpleaños para el día ${day} del mes ${month}`);

    // 1. Buscar miembros que cumplen años hoy
    const birthdayMembers = await turso.execute({
      sql: 'SELECT nombre, apellido_paterno FROM members WHERE dia_cumpleanos = ? AND mes_cumpleanos = ?',
      args: [day, month]
    });

    if (birthdayMembers.rows.length === 0) {
      return res.status(200).json({ message: 'No hay cumpleaños hoy' });
    }

    // 2. Obtener todos los usuarios suscritos y sus nombres
    const subscriptions = await turso.execute(`
      SELECT ps.subscription_json, u.nombre as user_name, u.id as user_id
      FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
    `);

    const results = {
      notificationsCreated: 0,
      pushSent: 0,
      errors: []
    };

    // 3. Procesar cada cumpleañero
    for (const member of birthdayMembers.rows) {
      const memberName = `${member.nombre} ${member.apellido_paterno}`;

      // A. Crear notificación en la base de datos para todos los usuarios
      // (Podríamos hacerlo solo para los suscritos, pero mejor para todos los usuarios de la app)
      const users = await turso.execute('SELECT id FROM users');
      for (const user of users.rows) {
        await turso.execute({
          sql: 'INSERT INTO notifications (user_id, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)',
          args: [
            user.id, 
            '¡Cumpleaños Hoy!', 
            `Hoy cumple años: ${memberName}, que no se te olvide!`, 
            'cumpleanos'
          ]
        });
        results.notificationsCreated++;
      }

      // B. Enviar notificaciones Push personalizadas
      for (const sub of subscriptions.rows) {
        try {
          const pushConfig = JSON.parse(sub.subscription_json);
          const payload = JSON.stringify({
            title: '¡Recordatorio de Cumpleaños!',
            body: `Hoy cumple años: ${memberName}, que no se te olvide : ${sub.user_name}`,
            url: '/members'
          });

          await webpush.sendNotification(pushConfig, payload);
          results.pushSent++;
        } catch (error) {
          console.error(`Error enviando push a usuario ${sub.user_id}:`, error);
          // Si el error es 410 (Gone), la suscripción ya no es válida
          if (error.statusCode === 410 || error.statusCode === 404) {
             await turso.execute({
               sql: 'DELETE FROM push_subscriptions WHERE subscription_json = ?',
               args: [sub.subscription_json]
             });
          }
        }
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error en check-birthdays:', error);
    return res.status(500).json({ error: error.message });
  }
};
