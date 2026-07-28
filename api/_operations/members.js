import { rows, row, insert, run } from './helpers.js';
import { requireAdmin } from '../_lib/roles.js';

export const memberOperations = {
  'members.create': {
    async handler(db, user, args) {
      const { nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono } = args;
      const result = await insert(db, `INSERT INTO members (nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono || null]);
        
      // Notificar a los admins sobre el nuevo miembro
      const memberName = `${nombre} ${apellido_paterno}`;
      const { sendPushToAdmins } = await import('../_lib/push.js');
      
      const payload = {
        title: 'Nuevo Miembro Registrado',
        body: `Se ha registrado a ${memberName} en el sistema.`,
        url: '/members',
      };
      // Enviamos el push a los administradores
      sendPushToAdmins(payload).catch(console.error);

      // También creamos notificaciones in-app para los admins
      const admins = await rows(db, "SELECT id FROM users WHERE role = 'admin'");
      for (const admin of admins) {
        await run(db, 'INSERT INTO notifications (user_id, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)', [
          admin.id,
          payload.title,
          payload.body,
          'sistema'
        ]);
      }

      return result;
    },
  },
  'members.getAll': {
    async handler(db) {
      return rows(db, 'SELECT * FROM members ORDER BY created_at DESC');
    },
  },
  'members.getByBirthdayMonth': {
    async handler(db, _user, args) {
      return rows(db, 'SELECT * FROM members WHERE mes_cumpleanos = ? ORDER BY dia_cumpleanos ASC', [args.month]);
    },
  },
  'members.getById': {
    async handler(db, _user, args) {
      return row(db, 'SELECT * FROM members WHERE id = ?', [args.id]);
    },
  },
  'members.update': {
    async handler(db, user, args) {
      requireAdmin(user);
      const { id, nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono } = args;
      await run(db, `UPDATE members SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, 
        dia_cumpleanos = ?, mes_cumpleanos = ?, foto = ?, genero = ?, telefono = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [nombre, apellido_paterno, apellido_materno, dia_cumpleanos, mes_cumpleanos, foto, genero, telefono || null, id]);
      return { success: true };
    },
  },
  'members.delete': {
    async handler(db, user, args) {
      requireAdmin(user);
      await run(db, 'DELETE FROM members WHERE id = ?', [args.id]);
      return { success: true };
    },
  },
};
