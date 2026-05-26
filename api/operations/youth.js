import { rows, row, insert, run } from './helpers.js';

export const youthOperations = {
  'youth.add': {
    async handler(db, _user, args) {
      const fechaIngreso = new Date().toISOString().split('T')[0];
      return insert(db, 'INSERT INTO youth_members (member_id, fecha_ingreso, activo) VALUES (?, ?, 1)', [args.memberId, fechaIngreso]);
    },
  },
  'youth.remove': {
    async handler(db, _user, args) {
      await run(db, 'UPDATE youth_members SET activo = 0 WHERE id = ?', [args.youthId]);
      return { success: true };
    },
  },
  'youth.getAll': {
    async handler(db) {
      return rows(db, `SELECT ym.id as youth_id, ym.member_id, ym.fecha_ingreso, ym.activo, m.nombre, m.apellido_paterno, m.apellido_materno, m.foto, m.genero, m.dia_cumpleanos, m.mes_cumpleanos
        FROM youth_members ym INNER JOIN members m ON ym.member_id = m.id WHERE ym.activo = 1 ORDER BY m.nombre ASC`);
    },
  },
  'youth.getById': {
    async handler(db, _user, args) {
      return row(db, `SELECT ym.id as youth_id, ym.member_id, ym.fecha_ingreso, ym.activo, m.nombre, m.apellido_paterno, m.apellido_materno, m.foto, m.genero
        FROM youth_members ym INNER JOIN members m ON ym.member_id = m.id WHERE ym.id = ?`, [args.youthId]);
    },
  },
  'youth.isMember': {
    async handler(db, _user, args) {
      const r = await rows(db, 'SELECT id FROM youth_members WHERE member_id = ? AND activo = 1', [args.memberId]);
      return r.length > 0;
    },
  },
};
