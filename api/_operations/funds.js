import { rows, insert, run } from './helpers.js';
import { requireAdminOrTreasurer } from '../_lib/roles.js';

export const fundOperations = {
  'funds.addTransaction': {
    async handler(db, user, args) {
      requireAdminOrTreasurer(user);
      const { tipo, monto, concepto, categoria, fecha, ministryId, registradoPor } = args;
      const result = await insert(db, `INSERT INTO funds (tipo, monto, concepto, categoria, fecha, ministry_id, registrado_por) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tipo, monto, concepto, categoria || null, fecha, ministryId ?? null, registradoPor ?? null]);

      // --- Notificaciones ---
      try {
        const { rows: rowsFn, run: runFn } = await import('./helpers.js');
        const { sendPushToUsers } = await import('../_lib/push.js');
        
        let targetUsersQuery = "SELECT id FROM users WHERE role = 'admin'";
        let targetUsersArgs = [];
        let ministryName = '';

        if (ministryId) {
          targetUsersQuery += ' OR ministry_id = ?';
          targetUsersArgs.push(ministryId);
          const minRows = await rowsFn(db, 'SELECT nombre FROM ministries WHERE id = ?', [ministryId]);
          if (minRows.length > 0) ministryName = ` de ${minRows[0].nombre}`;
        }

        const usersToNotify = await rowsFn(db, targetUsersQuery, targetUsersArgs);
        const userIds = usersToNotify.map(u => u.id);

        const tipoStr = tipo === 'ingreso' ? 'Ingreso' : 'Salida';
        const payload = {
          title: `Nuevo ${tipoStr} Registrado`,
          body: `Se registró un ${tipo} de $${monto} para: ${concepto}${ministryName}`,
          url: '/treasury',
        };

        // Enviar Web Push
        sendPushToUsers(userIds, payload).catch(console.error);

        // Guardar Notificación In-App
        for (const u of userIds) {
          // Evitar notificar al mismo usuario que lo registró si queremos, pero lo dejamos simple.
          await runFn(db, 'INSERT INTO notifications (user_id, titulo, mensaje, tipo) VALUES (?, ?, ?, ?)', [
            u,
            payload.title,
            payload.body,
            'sistema'
          ]);
        }
      } catch (err) {
        console.error('Error enviando notificaciones de fondos:', err);
      }
      
      return result;
    },
  },
  'funds.getCurrentBalance': {
    async handler(db, _user, args) {
      let sql = `SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos, SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as total_salidas FROM funds`;
      const a = [];
      if (args.ministryId) { sql += ' WHERE ministry_id = ?'; a.push(args.ministryId); }
      const r = await rows(db, sql, a);
      const row = r[0] || {};
      const ingresos = parseFloat(row.total_ingresos || 0);
      const salidas = parseFloat(row.total_salidas || 0);
      return { balance: ingresos - salidas, ingresos, salidas, alerta: ingresos - salidas < 500 };
    },
  },
  'funds.getMonthlyBalance': {
    async handler(db, _user, args) {
      const monthStr = String(args.month).padStart(2, '0');
      let sql = `SELECT SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos, SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as total_salidas FROM funds WHERE fecha LIKE ?`;
      const a = [`${args.year}-${monthStr}%`];
      if (args.ministryId) { sql += ' AND ministry_id = ?'; a.push(args.ministryId); }
      const r = await rows(db, sql, a);
      const row = r[0] || {};
      const ingresos = parseFloat(row.total_ingresos || 0);
      const salidas = parseFloat(row.total_salidas || 0);
      return { ingresos, salidas, balance: ingresos - salidas };
    },
  },
  'funds.getAllTransactions': {
    async handler(db, user, args) {
      requireAdminOrTreasurer(user);
      const { ministryId, tipo, categoria, desde, hasta } = args;
      let sql = `SELECT f.*, m.nombre as ministry_nombre FROM funds f LEFT JOIN ministries m ON f.ministry_id = m.id WHERE 1=1`;
      const a = [];
      if (ministryId) { sql += ' AND f.ministry_id = ?'; a.push(ministryId); }
      if (tipo) { sql += ' AND f.tipo = ?'; a.push(tipo); }
      if (categoria) { sql += ' AND f.categoria = ?'; a.push(categoria); }
      if (desde) { sql += ' AND f.fecha >= ?'; a.push(desde); }
      if (hasta) { sql += ' AND f.fecha <= ?'; a.push(hasta); }
      sql += ' ORDER BY f.fecha DESC, f.created_at DESC';
      return rows(db, sql, a);
    },
  },
  'funds.getMonthlySummaryByCategory': {
    async handler(db, user, args) {
      requireAdminOrTreasurer(user);
      const monthStr = String(args.month).padStart(2, '0');
      let sql = `SELECT categoria, COUNT(*) as cantidad, SUM(monto) as total FROM funds WHERE fecha LIKE ?`;
      const a = [`${args.year}-${monthStr}%`];
      if (args.tipo) { sql += ' AND tipo = ?'; a.push(args.tipo); }
      sql += ' GROUP BY categoria ORDER BY total DESC';
      return rows(db, sql, a);
    },
  },
  'funds.deleteTransaction': {
    async handler(db, user, args) {
      requireAdminOrTreasurer(user);
      await run(db, 'DELETE FROM funds WHERE id = ?', [args.id]);
      return { success: true };
    },
  },
  'funds.getAllMinistriesBalances': {
    async handler(db, user) {
      requireAdminOrTreasurer(user);
      const r = await rows(db, `SELECT m.id, m.nombre, SUM(CASE WHEN f.tipo = 'ingreso' THEN f.monto ELSE 0 END) as total_ingresos, SUM(CASE WHEN f.tipo = 'salida' THEN f.monto ELSE 0 END) as total_salidas
        FROM ministries m LEFT JOIN funds f ON f.ministry_id = m.id GROUP BY m.id, m.nombre ORDER BY m.nombre`);
      return r.map((x) => ({ ...x, balance: parseFloat(x.total_ingresos || 0) - parseFloat(x.total_salidas || 0) }));
    },
  },
};
