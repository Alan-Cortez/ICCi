import { rows, insert, run } from './helpers.js';

export const eventOperations = {
  'events.create': {
    async handler(db, _user, args) {
      const { nombre, descripcion, fecha, ministryId, createdBy } = args;
      return insert(db, 'INSERT INTO events (nombre, descripcion, fecha, ministry_id, created_by) VALUES (?, ?, ?, ?, ?)',
        [nombre, descripcion, fecha, ministryId ?? null, createdBy ?? null]);
    },
  },
  'events.getAll': {
    async handler(db) {
      return rows(db, `SELECT e.*, m.nombre as creador_nombre, m.apellido_paterno as creador_apellido, min.nombre as ministerio_nombre
        FROM events e LEFT JOIN members m ON e.created_by = m.id LEFT JOIN ministries min ON e.ministry_id = min.id ORDER BY e.fecha ASC`);
    },
  },
  'events.getByMinistry': {
    async handler(db, _user, args) {
      return rows(db, `SELECT e.*, m.nombre as creador_nombre, m.apellido_paterno as creador_apellido 
        FROM events e LEFT JOIN members m ON e.created_by = m.id WHERE e.ministry_id = ? ORDER BY e.fecha ASC`, [args.ministryId]);
    },
  },
  'events.getUpcoming': {
    async handler(db) {
      const today = new Date().toISOString().split('T')[0];
      return rows(db, `SELECT e.*, min.nombre as ministerio_nombre FROM events e LEFT JOIN ministries min ON e.ministry_id = min.id WHERE e.fecha >= ? ORDER BY e.fecha ASC`, [today]);
    },
  },
  'events.getByMonth': {
    async handler(db, _user, args) {
      const monthStr = `${args.year}-${String(args.month).padStart(2, '0')}`;
      return rows(db, `SELECT e.*, min.nombre as ministerio_nombre FROM events e LEFT JOIN ministries min ON e.ministry_id = min.id WHERE e.fecha LIKE ? ORDER BY e.fecha ASC`, [`${monthStr}%`]);
    },
  },
  'events.update': {
    async handler(db, _user, args) {
      const { id, nombre, descripcion, fecha, createdBy } = args;
      await run(db, 'UPDATE events SET nombre = ?, descripcion = ?, fecha = ?, created_by = ? WHERE id = ?', [nombre, descripcion, fecha, createdBy ?? null, id]);
      return { success: true };
    },
  },
  'events.delete': {
    async handler(db, _user, args) {
      await run(db, 'DELETE FROM events WHERE id = ?', [args.id]);
      return { success: true };
    },
  },
};
