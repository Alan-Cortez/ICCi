import tursoClient from '../database/turso';

// Registrar asistencia
export const markAttendance = async (youthId, fecha, presente, justificado = false, razonFalta = null) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO attendance (youth_member_id, fecha, presente, justificado, razon_falta) 
            VALUES (?, ?, ?, ?, ?)`,
            args: [youthId, fecha, presente ? 1 : 0, justificado ? 1 : 0, razonFalta]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        throw error;
    }
};

// Obtener asistencia por fecha
export const getAttendanceByDate = async (fecha) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT 
          a.id,
          a.youth_member_id,
          a.fecha,
          a.presente,
          a.justificado,
          a.razon_falta,
          m.nombre,
          m.apellido_paterno,
          m.apellido_materno
        FROM attendance a
        INNER JOIN youth_members ym ON a.youth_member_id = ym.id
        INNER JOIN members m ON ym.member_id = m.id
        WHERE a.fecha = ?
        ORDER BY m.nombre ASC
      `,
            args: [fecha]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener asistencia:', error);
        throw error;
    }
};

// Obtener historial de asistencia de un joven
export const getAttendanceByYouth = async (youthId, fechaInicio, fechaFin) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT * FROM attendance 
        WHERE youth_member_id = ? 
        AND fecha BETWEEN ? AND ?
        ORDER BY fecha DESC
      `,
            args: [youthId, fechaInicio, fechaFin]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw error;
    }
};

// Actualizar registro de asistencia
export const updateAttendance = async (id, data) => {
    try {
        const { presente, justificado, razonFalta } = data;
        await tursoClient.execute({
            sql: `UPDATE attendance 
            SET presente = ?, justificado = ?, razon_falta = ?
            WHERE id = ?`,
            args: [presente ? 1 : 0, justificado ? 1 : 0, razonFalta, id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar asistencia:', error);
        throw error;
    }
};

// Verificar si ya existe asistencia para un joven en una fecha
export const hasAttendanceForDate = async (youthId, fecha) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT id FROM attendance WHERE youth_member_id = ? AND fecha = ?`,
            args: [youthId, fecha]
        });
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error al verificar asistencia:', error);
        throw error;
    }
};
