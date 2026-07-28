import { rows, insert, run } from './helpers.js';

export const complianceOperations = {
  'compliance.mark': {
    async handler(db, _user, args) {
      return insert(db, 'INSERT INTO compliance (youth_member_id, fecha, tiene_biblia, tiene_apuntes) VALUES (?, ?, ?, ?)',
        [args.youthId, args.fecha, args.tieneBiblia ? 1 : 0, args.tieneApuntes ? 1 : 0]);
    },
  },
  'compliance.getByDate': {
    async handler(db, _user, args) {
      return rows(db, `SELECT c.id, c.youth_member_id, c.fecha, c.tiene_biblia, c.tiene_apuntes, m.nombre, m.apellido_paterno, m.apellido_materno
        FROM compliance c INNER JOIN youth_members ym ON c.youth_member_id = ym.id INNER JOIN members m ON ym.member_id = m.id WHERE c.fecha = ? ORDER BY m.nombre ASC`, [args.fecha]);
    },
  },
  'compliance.getByYouth': {
    async handler(db, _user, args) {
      return rows(db, 'SELECT * FROM compliance WHERE youth_member_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha DESC',
        [args.youthId, args.fechaInicio, args.fechaFin]);
    },
  },
  'compliance.update': {
    async handler(db, _user, args) {
      await run(db, 'UPDATE compliance SET tiene_biblia = ?, tiene_apuntes = ? WHERE id = ?',
        [args.tieneBiblia ? 1 : 0, args.tieneApuntes ? 1 : 0, args.id]);
      return { success: true };
    },
  },
  'compliance.hasForDate': {
    async handler(db, _user, args) {
      const r = await rows(db, 'SELECT id FROM compliance WHERE youth_member_id = ? AND fecha = ?', [args.youthId, args.fecha]);
      return r.length > 0;
    },
  },
  'compliance.delete': {
    async handler(db, _user, args) {
      await run(db, 'DELETE FROM compliance WHERE id = ?', [args.id]);
      return { success: true };
    },
  },
  'compliance.getByDateRange': {
    async handler(db, _user, args) {
      return rows(db, 'SELECT * FROM compliance WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC', [args.fechaInicio, args.fechaFin]);
    },
  },
};
