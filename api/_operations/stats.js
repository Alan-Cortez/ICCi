import { rows } from './helpers.js';
import { requireAdmin } from '../_lib/roles.js';

export const statsOperations = {
  'stats.getGeneral': {
    async handler(db, user) {
      requireAdmin(user);
      const [membersResult, ministriesResult, eventsResult, fundsResult] = await Promise.all([
        rows(db, 'SELECT COUNT(*) as total FROM members'),
        rows(db, 'SELECT COUNT(*) as total FROM ministries'),
        rows(db, `SELECT COUNT(*) as total FROM events WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')`),
        rows(db, `SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos, SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as total_salidas FROM funds`),
      ]);
      const ingresos = parseFloat(fundsResult[0]?.total_ingresos || 0);
      const salidas = parseFloat(fundsResult[0]?.total_salidas || 0);
      return {
        totalMembers: membersResult[0]?.total || 0,
        totalMinistries: ministriesResult[0]?.total || 0,
        eventsThisMonth: eventsResult[0]?.total || 0,
        totalFunds: ingresos - salidas,
        totalIngresos: ingresos,
        totalSalidas: salidas,
      };
    },
  },
  'stats.getMemberGrowth': {
    async handler(db, user, args) {
      requireAdmin(user);
      const months = args.months ?? 6;
      const r = await rows(db, `SELECT strftime('%Y-%m', created_at) as mes, COUNT(*) as total FROM members WHERE created_at >= date('now', '-${months} months') GROUP BY strftime('%Y-%m', created_at) ORDER BY mes ASC`);
      return r.map((row) => ({ mes: row.mes, total: parseInt(row.total) }));
    },
  },
  'stats.getAttendance': {
    async handler(db, user) {
      requireAdmin(user);
      const r = await rows(db, `SELECT COUNT(DISTINCT youth_member_id) as total_jovenes, SUM(CASE WHEN presente = 1 THEN 1 ELSE 0 END) as total_asistencias, COUNT(*) as total_registros FROM attendance WHERE fecha >= date('now', '-30 days')`);
      const row = r[0] || {};
      const totalRegistros = parseInt(row.total_registros || 0);
      const totalAsistencias = parseInt(row.total_asistencias || 0);
      return {
        totalJovenes: parseInt(row.total_jovenes || 0),
        totalAsistencias,
        porcentajeAsistencia: totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : 0,
        ministerio: 'Jóvenes',
      };
    },
  },
  'stats.getAgeDistribution': {
    async handler(db, user) {
      requireAdmin(user);
      const r = await rows(db, `SELECT CASE 
        WHEN (strftime('%Y', 'now') - strftime('%Y', printf('%04d-%02d-%02d', COALESCE(strftime('%Y', 'now'), 2000), mes_cumpleanos, dia_cumpleanos))) < 18 THEN 'Menores de 18'
        WHEN (strftime('%Y', 'now') - strftime('%Y', printf('%04d-%02d-%02d', COALESCE(strftime('%Y', 'now'), 2000), mes_cumpleanos, dia_cumpleanos))) BETWEEN 18 AND 30 THEN '18-30'
        WHEN (strftime('%Y', 'now') - strftime('%Y', printf('%04d-%02d-%02d', COALESCE(strftime('%Y', 'now'), 2000), mes_cumpleanos, dia_cumpleanos))) BETWEEN 31 AND 50 THEN '31-50'
        ELSE 'Más de 50' END as rango, COUNT(*) as total FROM members WHERE mes_cumpleanos IS NOT NULL AND dia_cumpleanos IS NOT NULL GROUP BY rango`);
      return r.map((row) => ({ rango: row.rango, total: parseInt(row.total) }));
    },
  },
  'stats.getUpcomingBirthdays': {
    async handler(db, user, args) {
      requireAdmin(user);
      const days = args.days ?? 7;
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);
      const all = await rows(db, 'SELECT id, nombre, apellido_paterno, dia_cumpleanos, mes_cumpleanos FROM members WHERE mes_cumpleanos IS NOT NULL AND dia_cumpleanos IS NOT NULL ORDER BY mes_cumpleanos, dia_cumpleanos');
      const upcoming = all.filter((member) => {
        const birthdayThisYear = new Date(today.getFullYear(), member.mes_cumpleanos - 1, member.dia_cumpleanos);
        const birthdayNextYear = new Date(today.getFullYear() + 1, member.mes_cumpleanos - 1, member.dia_cumpleanos);
        return (birthdayThisYear >= today && birthdayThisYear <= endDate) || (birthdayNextYear >= today && birthdayNextYear <= endDate);
      });
      return upcoming.slice(0, 5);
    },
  },
  'stats.getUpcomingEvents': {
    async handler(db, user, args) {
      requireAdmin(user);
      const days = args.days ?? 7;
      const today = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      return rows(db, `SELECT e.*, min.nombre as ministerio_nombre FROM events e LEFT JOIN ministries min ON e.ministry_id = min.id WHERE e.fecha BETWEEN ? AND ? ORDER BY e.fecha ASC LIMIT 5`, [today, endDate.toISOString().split('T')[0]]);
    },
  },
  'stats.getLowFundsMinistries': {
    async handler(db, user, args) {
      requireAdmin(user);
      const threshold = args.threshold ?? 1000;
      const r = await rows(db, `SELECT m.id, m.nombre, SUM(CASE WHEN f.tipo = 'ingreso' THEN f.monto ELSE 0 END) as ingresos, SUM(CASE WHEN f.tipo = 'salida' THEN f.monto ELSE 0 END) as salidas FROM ministries m LEFT JOIN funds f ON f.ministry_id = m.id GROUP BY m.id, m.nombre`);
      return r.map((row) => ({ id: row.id, nombre: row.nombre, balance: parseFloat(row.ingresos || 0) - parseFloat(row.salidas || 0) })).filter((m) => m.balance < threshold);
    },
  },
  'stats.getInactiveMembers': {
    async handler(db, user, args) {
      requireAdmin(user);
      const days = args.days ?? 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return rows(db, `SELECT DISTINCT m.id, m.nombre, m.apellido_paterno, m.telefono FROM youth_members ym INNER JOIN members m ON ym.member_id = m.id
        WHERE ym.id NOT IN (SELECT DISTINCT youth_member_id FROM attendance WHERE fecha >= ? AND presente = 1) LIMIT 10`, [cutoff.toISOString().split('T')[0]]);
    },
  },
  'stats.getMemberTrend': {
    async handler(db, user) {
      requireAdmin(user);
      const [currentMonth, lastMonth] = await Promise.all([
        rows(db, `SELECT COUNT(*) as total FROM members WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`),
        rows(db, `SELECT COUNT(*) as total FROM members WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')`),
      ]);
      const current = parseInt(currentMonth[0]?.total || 0);
      const last = parseInt(lastMonth[0]?.total || 0);
      const trend = current - last;
      return { current, last, trend, percentage: last > 0 ? Math.round((trend / last) * 100) : 0, isPositive: trend >= 0 };
    },
  },
};
