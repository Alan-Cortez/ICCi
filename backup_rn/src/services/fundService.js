import tursoClient from '../database/turso';

const FONDO_BASE = 1000;

// Registrar transacción (ingreso o salida)
export const addTransaction = async (tipo, monto, concepto, fecha) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO funds (tipo, monto, concepto, fecha) VALUES (?, ?, ?, ?)`,
            args: [tipo, monto, concepto, fecha]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al registrar transacción:', error);
        throw error;
    }
};

// Obtener balance actual
export const getCurrentBalance = async () => {
    try {
        const result = await tursoClient.execute(`
      SELECT 
        SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
        SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as total_salidas
      FROM funds
    `);

        const row = result.rows[0];
        const ingresos = parseFloat(row.total_ingresos || 0);
        const salidas = parseFloat(row.total_salidas || 0);
        const balance = FONDO_BASE + ingresos - salidas;

        return {
            balance,
            ingresos,
            salidas,
            fondoBase: FONDO_BASE,
            alerta: balance < FONDO_BASE
        };
    } catch (error) {
        console.error('Error al obtener balance:', error);
        throw error;
    }
};

// Obtener todas las transacciones
export const getAllTransactions = async () => {
    try {
        const result = await tursoClient.execute(`
      SELECT * FROM funds ORDER BY fecha DESC, created_at DESC
    `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        throw error;
    }
};

// Obtener transacciones por rango de fechas
export const getTransactionsByDateRange = async (fechaInicio, fechaFin) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT * FROM funds WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC`,
            args: [fechaInicio, fechaFin]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener transacciones por fecha:', error);
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

// Obtener estadísticas de fondos
export const getFundsStats = async () => {
    try {
        const balance = await getCurrentBalance();
        const transactions = await getAllTransactions();

        return {
            ...balance,
            totalTransacciones: transactions.length,
            ultimasTransacciones: transactions.slice(0, 5)
        };
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        throw error;
    }
};
