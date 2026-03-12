import tursoClient from '../database/turso';

// Registrar asistencia
export const markAttendance = async (youthId, fecha, presente, justificado = false, razonFalta = null, options = {}) => {
    try {
        const {
            esReunionCancelada = false,
            esEventoEspecial = false,
            puntual = true,
            notas = null
        } = options;

        const result = await tursoClient.execute({
            sql: `INSERT INTO attendance (
                youth_member_id, fecha, presente, justificado, razon_falta,
                es_reunion_cancelada, es_evento_especial, puntual, notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                youthId,
                fecha,
                presente ? 1 : 0,
                justificado ? 1 : 0,
                razonFalta,
                esReunionCancelada ? 1 : 0,
                esEventoEspecial ? 1 : 0,
                puntual ? 1 : 0,
                notas
            ]
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
          a.es_reunion_cancelada,
          a.es_evento_especial,
          a.puntual,
          a.notas,
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
        SELECT 
          a.id,
          a.youth_member_id,
          a.fecha,
          a.presente,
          a.justificado,
          a.razon_falta,
          a.es_reunion_cancelada,
          a.es_evento_especial,
          m.nombre,
          m.apellido_paterno,
          m.apellido_materno,
          m.telefono
        FROM attendance a
        INNER JOIN youth_members ym ON a.youth_member_id = ym.id
        INNER JOIN members m ON ym.member_id = m.id
        WHERE a.youth_member_id = ? 
        AND a.fecha BETWEEN ? AND ?
        ORDER BY a.fecha DESC
      `,
            args: [youthId, fechaInicio, fechaFin]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial:', error);
        throw error;
    }
};

// Actualizar registro de asistencia (todos los campos)
export const updateAttendance = async (id, data) => {
    try {
        const {
            presente,
            justificado,
            razonFalta,
            esReunionCancelada = false,
            esEventoEspecial = false,
            puntual = true,
            notas = null
        } = data;

        await tursoClient.execute({
            sql: `UPDATE attendance 
            SET presente = ?, justificado = ?, razon_falta = ?,
                es_reunion_cancelada = ?, es_evento_especial = ?,
                puntual = ?, notas = ?
            WHERE id = ?`,
            args: [
                presente ? 1 : 0,
                justificado ? 1 : 0,
                razonFalta,
                esReunionCancelada ? 1 : 0,
                esEventoEspecial ? 1 : 0,
                puntual ? 1 : 0,
                notas,
                id
            ]
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

// Obtener asistencia con datos de cumplimiento por fecha
export const getAttendanceWithComplianceByDate = async (fecha) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT 
          a.id as attendance_id,
          a.youth_member_id,
          a.fecha,
          a.presente,
          a.justificado,
          a.razon_falta,
          a.es_reunion_cancelada,
          a.es_evento_especial,
          a.puntual,
          a.notas,
          c.id as compliance_id,
          c.tiene_biblia,
          c.tiene_apuntes,
          m.nombre,
          m.apellido_paterno,
          m.apellido_materno
        FROM attendance a
        INNER JOIN youth_members ym ON a.youth_member_id = ym.id
        INNER JOIN members m ON ym.member_id = m.id
        LEFT JOIN compliance c ON c.youth_member_id = a.youth_member_id AND c.fecha = a.fecha
        WHERE a.fecha = ?
        ORDER BY m.nombre ASC
      `,
            args: [fecha]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener asistencia con cumplimiento:', error);
        throw error;
    }
};

// Eliminar registro de asistencia
export const deleteAttendance = async (id) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM attendance WHERE id = ?`,
            args: [id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar asistencia:', error);
        throw error;
    }
};

// Obtener historial de asistencia agrupado por fecha
export const getAttendanceHistorySummary = async () => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT 
            fecha, 
            MAX(es_reunion_cancelada) as cancelled, 
            MAX(CASE WHEN es_reunion_cancelada = 1 THEN razon_falta ELSE NULL END) as reason,
            COUNT(*) as total,
            SUM(CASE WHEN presente = 1 THEN 1 ELSE 0 END) as present_count
        FROM attendance
        GROUP BY fecha
        ORDER BY fecha DESC
      `
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial de asistencia:', error);
        throw error;
    }
};

// Obtener jóvenes en riesgo (baja asistencia)
export const getRiskYouth = async (months = 1) => {
    try {
        // Calcular fecha de inicio (1 mes atrás por defecto)
        const d = new Date();
        d.setMonth(d.getMonth() - months);
        const fechaInicio = d.toISOString().split('T')[0];

        const result = await tursoClient.execute({
            sql: `
        SELECT 
            ym.id as youth_id,
            m.nombre,
            m.apellido_paterno,
            m.foto,
            COUNT(a.id) as total_meetings,
            SUM(CASE WHEN a.presente = 1 THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.es_reunion_cancelada = 1 THEN 1 ELSE 0 END) as cancelled_count
        FROM youth_members ym
        INNER JOIN members m ON ym.member_id = m.id
        LEFT JOIN attendance a ON ym.id = a.youth_member_id AND a.fecha >= ?
        WHERE ym.activo = 1
        GROUP BY ym.id
        HAVING total_meetings > 0
      `,
            args: [fechaInicio]
        });

        // Filtrar y procesar en JS (más flexible)
        return result.rows.map(row => {
            const validMeetings = row.total_meetings - row.cancelled_count;
            const percentage = validMeetings > 0 ? (row.present_count / validMeetings) * 100 : 0;
            return {
                ...row,
                percentage,
                riskLevel: percentage === 0 ? 'critical' : percentage < 50 ? 'warning' : 'good'
            };
        }).filter(r => r.riskLevel !== 'good');

    } catch (error) {
        console.error('Error al obtener jóvenes en riesgo:', error);
        throw error;
    }
};

// Obtener todas las fechas con asistencia registrada (legacy support)
export const getAttendanceDates = async () => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT DISTINCT fecha
        FROM attendance
        ORDER BY fecha DESC
      `
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener fechas de asistencia:', error);
        throw error;
    }
};

// Obtener todo el historial de asistencia en un rango de fechas (Bulk)
export const getAttendanceByDateRange = async (fechaInicio, fechaFin) => {
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
          a.es_reunion_cancelada,
          a.es_evento_especial,
          m.nombre,
          m.apellido_paterno,
          m.apellido_materno,
          m.telefono
        FROM attendance a
        INNER JOIN youth_members ym ON a.youth_member_id = ym.id
        INNER JOIN members m ON ym.member_id = m.id
        WHERE a.fecha BETWEEN ? AND ?
        ORDER BY a.fecha DESC
      `,
            args: [fechaInicio, fechaFin]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial en rango:', error);
        throw error;
    }
};
