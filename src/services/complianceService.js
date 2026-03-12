import tursoClient from '../database/turso';

// Registrar cumplimiento de Biblia y apuntes
export const markCompliance = async (youthId, fecha, tieneBiblia, tieneApuntes) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO compliance (youth_member_id, fecha, tiene_biblia, tiene_apuntes) 
            VALUES (?, ?, ?, ?)`,
            args: [youthId, fecha, tieneBiblia ? 1 : 0, tieneApuntes ? 1 : 0]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al registrar cumplimiento:', error);
        throw error;
    }
};

// Obtener cumplimiento por fecha
export const getComplianceByDate = async (fecha) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT 
          c.id,
          c.youth_member_id,
          c.fecha,
          c.tiene_biblia,
          c.tiene_apuntes,
          m.nombre,
          m.apellido_paterno,
          m.apellido_materno
        FROM compliance c
        INNER JOIN youth_members ym ON c.youth_member_id = ym.id
        INNER JOIN members m ON ym.member_id = m.id
        WHERE c.fecha = ?
        ORDER BY m.nombre ASC
      `,
            args: [fecha]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener cumplimiento:', error);
        throw error;
    }
};

// Obtener historial de cumplimiento de un joven
export const getComplianceByYouth = async (youthId, fechaInicio, fechaFin) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT * FROM compliance 
        WHERE youth_member_id = ? 
        AND fecha BETWEEN ? AND ?
        ORDER BY fecha DESC
      `,
            args: [youthId, fechaInicio, fechaFin]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial de cumplimiento:', error);
        throw error;
    }
};

// Actualizar cumplimiento
export const updateCompliance = async (id, tieneBiblia, tieneApuntes) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE compliance SET tiene_biblia = ?, tiene_apuntes = ? WHERE id = ?`,
            args: [tieneBiblia ? 1 : 0, tieneApuntes ? 1 : 0, id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar cumplimiento:', error);
        throw error;
    }
};

// Verificar si ya existe cumplimiento para un joven en una fecha
export const hasComplianceForDate = async (youthId, fecha) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT id FROM compliance WHERE youth_member_id = ? AND fecha = ?`,
            args: [youthId, fecha]
        });
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error al verificar cumplimiento:', error);
        throw error;
    }
};

// Eliminar registro de cumplimiento
export const deleteCompliance = async (id) => {
    try {
        await tursoClient.execute({
            sql: `DELETE FROM compliance WHERE id = ?`,
            args: [id]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar cumplimiento:', error);
        throw error;
    }
};

// Obtener historial de cumplimiento en un rango de fechas (Bulk)
export const getComplianceByDateRange = async (fechaInicio, fechaFin) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT * FROM compliance 
        WHERE fecha BETWEEN ? AND ?
        ORDER BY fecha DESC
      `,
            args: [fechaInicio, fechaFin]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener historial de cumplimiento en rango:', error);
        throw error;
    }
};
