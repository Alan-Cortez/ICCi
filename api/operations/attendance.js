import { rows, insert, run } from './helpers.js';

export const attendanceOperations = {
  'attendance.mark': {
    async handler(db, _user, args) {
      const { youthId, fecha, presente, justificado, razonFalta, options = {} } = args;
      const { esReunionCancelada = false, esEventoEspecial = false, puntual = true, notas = null } = options;
      return insert(db, `INSERT INTO attendance (youth_member_id, fecha, presente, justificado, razon_falta, es_reunion_cancelada, es_evento_especial, puntual, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [youthId, fecha, presente ? 1 : 0, justificado ? 1 : 0, razonFalta, esReunionCancelada ? 1 : 0, esEventoEspecial ? 1 : 0, puntual ? 1 : 0, notas]);
    },
  },
  'attendance.getByDate': {
    async handler(db, _user, args) {
      return rows(db, `SELECT a.id, a.youth_member_id, a.fecha, a.presente, a.justificado, a.razon_falta, a.es_reunion_cancelada, a.es_evento_especial, a.puntual, a.notas, m.nombre, m.apellido_paterno, m.apellido_materno
        FROM attendance a INNER JOIN youth_members ym ON a.youth_member_id = ym.id INNER JOIN members m ON ym.member_id = m.id WHERE a.fecha = ? ORDER BY m.nombre ASC`, [args.fecha]);
    },
  },
  'attendance.getByYouth': {
    async handler(db, _user, args) {
      return rows(db, `SELECT a.id, a.youth_member_id, a.fecha, a.presente, a.justificado, a.razon_falta, a.es_reunion_cancelada, a.es_evento_especial, m.nombre, m.apellido_paterno, m.apellido_materno, m.telefono
        FROM attendance a INNER JOIN youth_members ym ON a.youth_member_id = ym.id INNER JOIN members m ON ym.member_id = m.id
        WHERE a.youth_member_id = ? AND a.fecha BETWEEN ? AND ? ORDER BY a.fecha DESC`, [args.youthId, args.fechaInicio, args.fechaFin]);
    },
  },
  'attendance.update': {
    async handler(db, _user, args) {
      const { id, presente, justificado, razonFalta, esReunionCancelada = false, esEventoEspecial = false, puntual = true, notas = null } = args;
      await run(db, `UPDATE attendance SET presente = ?, justificado = ?, razon_falta = ?, es_reunion_cancelada = ?, es_evento_especial = ?, puntual = ?, notas = ? WHERE id = ?`,
        [presente ? 1 : 0, justificado ? 1 : 0, razonFalta, esReunionCancelada ? 1 : 0, esEventoEspecial ? 1 : 0, puntual ? 1 : 0, notas, id]);
      return { success: true };
    },
  },
  'attendance.hasForDate': {
    async handler(db, _user, args) {
      const r = await rows(db, 'SELECT id FROM attendance WHERE youth_member_id = ? AND fecha = ?', [args.youthId, args.fecha]);
      return r.length > 0;
    },
  },
  'attendance.getWithComplianceByDate': {
    async handler(db, _user, args) {
      return rows(db, `SELECT a.id as attendance_id, a.youth_member_id, a.fecha, a.presente, a.justificado, a.razon_falta, a.es_reunion_cancelada, a.es_evento_especial, a.puntual, a.notas,
        c.id as compliance_id, c.tiene_biblia, c.tiene_apuntes, m.nombre, m.apellido_paterno, m.apellido_materno
        FROM attendance a INNER JOIN youth_members ym ON a.youth_member_id = ym.id INNER JOIN members m ON ym.member_id = m.id
        LEFT JOIN compliance c ON c.youth_member_id = a.youth_member_id AND c.fecha = a.fecha WHERE a.fecha = ? ORDER BY m.nombre ASC`, [args.fecha]);
    },
  },
  'attendance.delete': {
    async handler(db, _user, args) {
      await run(db, 'DELETE FROM attendance WHERE id = ?', [args.id]);
      return { success: true };
    },
  },
  'attendance.historySummary': {
    async handler(db) {
      return rows(db, `SELECT fecha, MAX(es_reunion_cancelada) as cancelled, MAX(CASE WHEN es_reunion_cancelada = 1 THEN razon_falta ELSE NULL END) as reason,
        COUNT(*) as total, SUM(CASE WHEN presente = 1 THEN 1 ELSE 0 END) as present_count FROM attendance GROUP BY fecha ORDER BY fecha DESC`);
    },
  },
  'attendance.riskYouth': {
    async handler(db, _user, args) {
      const months = args.months ?? 1;
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      const fechaInicio = d.toISOString().split('T')[0];
      const result = await rows(db, `SELECT ym.id as youth_id, m.nombre, m.apellido_paterno, m.foto, COUNT(a.id) as total_meetings,
        SUM(CASE WHEN a.presente = 1 THEN 1 ELSE 0 END) as present_count, SUM(CASE WHEN a.es_reunion_cancelada = 1 THEN 1 ELSE 0 END) as cancelled_count
        FROM youth_members ym INNER JOIN members m ON ym.member_id = m.id LEFT JOIN attendance a ON ym.id = a.youth_member_id AND a.fecha >= ?
        WHERE ym.activo = 1 GROUP BY ym.id HAVING total_meetings > 0`, [fechaInicio]);
      return result.map((row) => {
        const validMeetings = row.total_meetings - row.cancelled_count;
        const percentage = validMeetings > 0 ? (row.present_count / validMeetings) * 100 : 0;
        return { ...row, percentage, riskLevel: percentage === 0 ? 'critical' : percentage < 50 ? 'warning' : 'good' };
      }).filter((r) => r.riskLevel !== 'good');
    },
  },
  'attendance.getDates': {
    async handler(db) {
      return rows(db, 'SELECT DISTINCT fecha FROM attendance ORDER BY fecha DESC');
    },
  },
  'attendance.getByDateRange': {
    async handler(db, _user, args) {
      return rows(db, `SELECT a.id, a.youth_member_id, a.fecha, a.presente, a.justificado, a.razon_falta, a.es_reunion_cancelada, a.es_evento_especial, m.nombre, m.apellido_paterno, m.apellido_materno, m.telefono
        FROM attendance a INNER JOIN youth_members ym ON a.youth_member_id = ym.id INNER JOIN members m ON ym.member_id = m.id
        WHERE a.fecha BETWEEN ? AND ? ORDER BY a.fecha DESC`, [args.fechaInicio, args.fechaFin]);
    },
  },
};
