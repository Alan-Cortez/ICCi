import { rows, row, insert, run } from './helpers.js';
import { requireAdmin } from '../_lib/roles.js';

export const ministryOperations = {
  'ministries.create': {
    async handler(db, user, args) {
      requireAdmin(user);
      return insert(db, 'INSERT INTO ministries (nombre, descripcion) VALUES (?, ?)', [args.nombre, args.descripcion]);
    },
  },
  'ministries.getAll': {
    async handler(db) {
      return rows(db, 'SELECT * FROM ministries ORDER BY nombre ASC');
    },
  },
  'ministries.getById': {
    async handler(db, _user, args) {
      return row(db, 'SELECT * FROM ministries WHERE id = ?', [args.id]);
    },
  },
  'ministries.addMember': {
    async handler(db, _user, args) {
      const fechaIngreso = new Date().toISOString().split('T')[0];
      return insert(db, 'INSERT INTO ministry_members (ministry_id, member_id, fecha_ingreso, activo) VALUES (?, ?, ?, 1)',
        [args.ministryId, args.memberId, fechaIngreso]);
    },
  },
  'ministries.getMembers': {
    async handler(db, _user, args) {
      return rows(db, `SELECT mm.id as membership_id, mm.fecha_ingreso, m.* FROM ministry_members mm
        INNER JOIN members m ON mm.member_id = m.id WHERE mm.ministry_id = ? AND mm.activo = 1 ORDER BY m.nombre ASC`, [args.ministryId]);
    },
  },
  'ministries.removeMember': {
    async handler(db, _user, args) {
      await run(db, 'UPDATE ministry_members SET activo = 0 WHERE id = ?', [args.membershipId]);
      return { success: true };
    },
  },
  'ministries.update': {
    async handler(db, user, args) {
      requireAdmin(user);
      await run(db, 'UPDATE ministries SET nombre = ?, descripcion = ? WHERE id = ?', [args.nombre, args.descripcion, args.id]);
      return { success: true };
    },
  },
  'ministries.delete': {
    async handler(db, user, args) {
      requireAdmin(user);
      await run(db, 'DELETE FROM ministries WHERE id = ?', [args.id]);
      return { success: true };
    },
  },
  'ministries.getStats': {
    async handler(db, _user, args) {
      const id = args.id;
      const [membersResult, eventsResult, fundsResult] = await Promise.all([
        rows(db, 'SELECT COUNT(*) as total FROM ministry_members WHERE ministry_id = ? AND activo = 1', [id]),
        rows(db, 'SELECT COUNT(*) as total FROM events WHERE ministry_id = ?', [id]),
        rows(db, `SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as ingresos, SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as salidas FROM funds WHERE ministry_id = ?`, [id]),
      ]);
      const ingresos = parseFloat(fundsResult[0]?.ingresos || 0);
      const salidas = parseFloat(fundsResult[0]?.salidas || 0);
      return {
        totalMembers: parseInt(membersResult[0]?.total || 0),
        totalEvents: parseInt(eventsResult[0]?.total || 0),
        balance: ingresos - salidas,
        ingresos,
        salidas,
      };
    },
  },
};
