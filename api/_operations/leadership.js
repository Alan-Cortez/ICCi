import { rows, insert, run } from './helpers.js';

export const leadershipOperations = {
  'leadership.add': {
    async handler(db, _user, args) {
      const fechaInicio = new Date().toISOString().split('T')[0];
      return insert(db, 'INSERT INTO leadership (youth_member_id, es_lider, fecha_inicio, activo) VALUES (?, 1, ?, 1)', [args.youthId, fechaInicio]);
    },
  },
  'leadership.remove': {
    async handler(db, _user, args) {
      await run(db, 'UPDATE leadership SET activo = 0 WHERE id = ?', [args.leadershipId]);
      return { success: true };
    },
  },
  'leadership.getMembers': {
    async handler(db) {
      return rows(db, `SELECT l.id as leadership_id, l.youth_member_id, l.fecha_inicio, l.activo, m.nombre, m.apellido_paterno, m.apellido_materno, m.foto
        FROM leadership l INNER JOIN youth_members ym ON l.youth_member_id = ym.id INNER JOIN members m ON ym.member_id = m.id WHERE l.activo = 1 ORDER BY m.nombre ASC`);
    },
  },
  'leadership.assignTask': {
    async handler(db, _user, args) {
      return insert(db, 'INSERT INTO leadership_assignments (leadership_id, youth_member_id, tipo, fecha_asignada, completado, notas) VALUES (?, ?, ?, ?, 0, ?)',
        [args.leadershipId ?? null, args.youthMemberId, args.tipo, args.fecha, args.notas ?? null]);
    },
  },
  'leadership.completeAssignment': {
    async handler(db, _user, args) {
      await run(db, 'UPDATE leadership_assignments SET completado = 1 WHERE id = ?', [args.assignmentId]);
      return { success: true };
    },
  },
  'leadership.getAssignments': {
    async handler(db, _user, args) {
      return rows(db, `SELECT la.id, la.tipo, la.fecha_asignada, la.completado, la.notas, m.nombre, m.apellido_paterno, m.apellido_materno
        FROM leadership_assignments la LEFT JOIN youth_members ym ON la.youth_member_id = ym.id LEFT JOIN leadership l ON la.leadership_id = l.id
        LEFT JOIN youth_members ym2 ON l.youth_member_id = ym2.id INNER JOIN members m ON COALESCE(ym.member_id, ym2.member_id) = m.id
        WHERE la.fecha_asignada BETWEEN ? AND ? ORDER BY la.fecha_asignada ASC, la.tipo ASC`, [args.fechaInicio, args.fechaFin]);
    },
  },
  'leadership.getPendingAssignments': {
    async handler(db) {
      return rows(db, `SELECT la.id, la.tipo, la.fecha_asignada, la.notas, m.nombre, m.apellido_paterno, m.apellido_materno
        FROM leadership_assignments la LEFT JOIN youth_members ym ON la.youth_member_id = ym.id LEFT JOIN leadership l ON la.leadership_id = l.id
        LEFT JOIN youth_members ym2 ON l.youth_member_id = ym2.id INNER JOIN members m ON COALESCE(ym.member_id, ym2.member_id) = m.id
        WHERE la.completado = 0 ORDER BY la.fecha_asignada ASC`);
    },
  },
  'leadership.isLeader': {
    async handler(db, _user, args) {
      const r = await rows(db, 'SELECT id FROM leadership WHERE youth_member_id = ? AND activo = 1', [args.youthId]);
      return r.length > 0;
    },
  },
};
