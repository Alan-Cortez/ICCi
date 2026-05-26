import { rows, insert, run } from './helpers.js';
import { youthOperations } from './youth.js';
import { leadershipOperations } from './leadership.js';
import { eventOperations } from './events.js';
import { fundOperations } from './funds.js';

async function runOp(db, user, op) {
  return op.handler(db, user, op.args);
}

export const pendingOperations = {
  'pending.create': {
    async handler(db, user, args) {
      const { actionType, entityData, ministryId } = args;
      return insert(db, `INSERT INTO pending_actions (action_type, entity_data, requested_by_id, requested_by_nombre, ministry_id) VALUES (?, ?, ?, ?, ?)`,
        [actionType, JSON.stringify(entityData), String(user.id), user.nombre, ministryId ?? null]);
    },
  },
  'pending.getAll': {
    async handler(db, _user, args) {
      const r = await rows(db, 'SELECT * FROM pending_actions WHERE ministry_id = ? ORDER BY created_at DESC', [args.ministryId]);
      return r.map((row) => {
        try {
          return { ...row, entity_data: typeof row.entity_data === 'string' ? JSON.parse(row.entity_data) : row.entity_data };
        } catch {
          return { ...row, entity_data: {} };
        }
      });
    },
  },
  'pending.getCount': {
    async handler(db, _user, args) {
      const r = await rows(db, `SELECT COUNT(*) as total FROM pending_actions WHERE ministry_id = ? AND status = 'pending'`, [args.ministryId]);
      return parseInt(r[0]?.total || 0);
    },
  },
  'pending.approve': {
    async handler(db, user, args) {
      const action = args.action;
      const data = typeof action.entity_data === 'string' ? JSON.parse(action.entity_data) : action.entity_data;

      switch (action.action_type) {
        case 'add_youth_member':
          await runOp(db, user, { handler: youthOperations['youth.add'].handler, args: { memberId: data.memberId } });
          break;
        case 'remove_youth_member':
          await runOp(db, user, { handler: youthOperations['youth.remove'].handler, args: { youthId: data.youthId } });
          break;
        case 'add_leadership':
          await runOp(db, user, { handler: leadershipOperations['leadership.add'].handler, args: { youthId: data.youthId } });
          break;
        case 'remove_leadership':
          await runOp(db, user, { handler: leadershipOperations['leadership.remove'].handler, args: { leadershipId: data.leadershipId } });
          break;
        case 'assign_task':
          await runOp(db, user, { handler: leadershipOperations['leadership.assignTask'].handler, args: { youthMemberId: data.youthMemberId, tipo: data.tipo, fecha: data.fecha, notas: data.notas, leadershipId: data.leadershipId } });
          break;
        case 'create_event':
          await runOp(db, user, { handler: eventOperations['events.create'].handler, args: { nombre: data.nombre, descripcion: data.descripcion, fecha: data.fecha, ministryId: data.ministryId, createdBy: data.organizerId } });
          break;
        case 'update_event':
          await runOp(db, user, { handler: eventOperations['events.update'].handler, args: { id: data.id, nombre: data.nombre, descripcion: data.descripcion, fecha: data.fecha, createdBy: data.organizerId } });
          break;
        case 'delete_event':
          await runOp(db, user, { handler: eventOperations['events.delete'].handler, args: { id: data.id } });
          break;
        case 'add_transaction':
          await runOp(db, user, { handler: fundOperations['funds.addTransaction'].handler, args: { tipo: data.tipo, monto: data.monto, concepto: data.concepto, categoria: data.categoria, fecha: data.fecha, ministryId: data.ministryId, registradoPor: data.registradoPor } });
          break;
        case 'delete_transaction':
          await runOp(db, user, { handler: fundOperations['funds.deleteTransaction'].handler, args: { id: data.id } });
          break;
        case 'complete_task':
          await runOp(db, user, { handler: leadershipOperations['leadership.completeAssignment'].handler, args: { assignmentId: data.assignmentId } });
          break;
        default:
          throw new Error(`Tipo de acción desconocido: ${action.action_type}`);
      }

      await run(db, `UPDATE pending_actions SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?`, [action.id]);
      return { success: true };
    },
  },
  'pending.reject': {
    async handler(db, _user, args) {
      await run(db, `UPDATE pending_actions SET status = 'rejected', reviewed_at = datetime('now'), review_note = ? WHERE id = ?`, [args.note || '', args.actionId]);
      return { success: true };
    },
  },
};
