import tursoClient from '../database/turso';

const FONDO_BASE = 0; // Cambiado a 0 para ministerios nuevos, o configurable

// Registrar transacción (ingreso o salida)
export const addTransaction = async (tipo, monto, concepto, fecha, ministryId = null) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO funds (tipo, monto, concepto, fecha, ministry_id) VALUES (?, ?, ?, ?, ?)`,
            args: [tipo, monto, concepto, fecha, ministryId]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al registrar transacción:', error);
        throw error;
    }
};

// Obtener balance actual (Global o por Ministerio)
export const getCurrentBalance = async (ministryId = null) => {
    try {
        let sql = `
      SELECT 
        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
        SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as total_salidas
      FROM funds
    `;

        const args = [];
        if (ministryId) {
            sql += ` WHERE ministry_id = ?`;
            args.push(ministryId);
        } else {
            sql += ` WHERE ministry_id IS NULL`;
        }

        const result = await tursoClient.execute({ sql, args });

        const row = result.rows[0];
        const ingresos = parseFloat(row.total_ingresos || 0);
        const salidas = parseFloat(row.total_salidas || 0);
        // El fondo base podría ser 0 para ministerios individuales
        const base = ministryId ? 0 : 1000;
        const balance = base + ingresos - salidas;

        return {
            balance,
            ingresos,
            salidas,
            fondoBase: base,
            alerta: balance < 1000 // Alerta genérica
        };
    } catch (error) {
        console.error('Error al obtener balance:', error);
        throw error;
    }
};
// Obtener todas las transacciones (o por ministerio)
export const getAllTransactions = async (ministryId = null) => {
    try {
        let sql = `SELECT * FROM funds`;
        const args = [];

        if (ministryId) {
            sql += ` WHERE ministry_id = ?`;
            args.push(ministryId);
        } else {
            sql += ` WHERE ministry_id IS NULL`;
        }

        sql += ` ORDER BY fecha DESC, created_at DESC`;

        const result = await tursoClient.execute({ sql, args });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        throw error;
    }
};

// Eliminar transacción
export const deleteTransaction = async (id) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM funds WHERE id = ?`,
            args: [id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar transacción:', error);
        throw error;
    }
};
