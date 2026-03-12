import tursoClient from '../database/turso';

// Agregar joven al grupo de liderazgo
export const addToLeadership = async (youthId) => {
    try {
        const fechaInicio = new Date().toISOString().split('T')[0];

        const result = await tursoClient.execute({
            sql: `INSERT INTO leadership (youth_member_id, es_lider, fecha_inicio, activo) 
            VALUES (?, 1, ?, 1)`,
            args: [youthId, fechaInicio]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al agregar a liderazgo:', error);
        throw error;
    }
};

// Remover del liderazgo
export const removeFromLeadership = async (leadershipId) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE leadership SET activo = 0 WHERE id = ?`,
            args: [leadershipId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al remover de liderazgo:', error);
        throw error;
    }
};

// Obtener todos los líderes activos
export const getLeadershipMembers = async () => {
    try {
        const result = await tursoClient.execute(`
      SELECT 
        l.id as leadership_id,
        l.youth_member_id,
        l.fecha_inicio,
        l.activo,
        m.nombre,
        m.apellido_paterno,
        m.apellido_materno,
        m.foto
      FROM leadership l
      INNER JOIN youth_members ym ON l.youth_member_id = ym.id
      INNER JOIN members m ON ym.member_id = m.id
      WHERE l.activo = 1
      ORDER BY m.nombre ASC
    `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener líderes:', error);
        throw error;
    }
};

// Asignar tarea a un líder
export const assignTask = async (leadershipId, tipo, fecha, notas = null) => {
    try {
        const result = await tursoClient.execute({
            sql: `INSERT INTO leadership_assignments (leadership_id, tipo, fecha_asignada, completado, notas) 
            VALUES (?, ?, ?, 0, ?)`,
            args: [leadershipId, tipo, fecha, notas]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al asignar tarea:', error);
        throw error;
    }
};

// Marcar asignación como completada
export const completeAssignment = async (assignmentId) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE leadership_assignments SET completado = 1 WHERE id = ?`,
            args: [assignmentId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al completar asignación:', error);
        throw error;
    }
};

// Obtener asignaciones en un rango de fechas
export const getAssignments = async (fechaInicio, fechaFin) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT 
          la.id,
          la.tipo,
          la.fecha_asignada,
          la.completado,
          la.notas,
          m.nombre,
          m.apellido_paterno,
          m.apellido_materno
        FROM leadership_assignments la
        INNER JOIN leadership l ON la.leadership_id = l.id
        INNER JOIN youth_members ym ON l.youth_member_id = ym.id
        INNER JOIN members m ON ym.member_id = m.id
        WHERE la.fecha_asignada BETWEEN ? AND ?
        ORDER BY la.fecha_asignada ASC, la.tipo ASC
      `,
            args: [fechaInicio, fechaFin]
        });
        return result.rows;
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        throw error;
    }
};

// Obtener asignaciones pendientes
export const getPendingAssignments = async () => {
    try {
        const result = await tursoClient.execute(`
      SELECT 
        la.id,
        la.tipo,
        la.fecha_asignada,
        la.notas,
        m.nombre,
        m.apellido_paterno,
        m.apellido_materno
      FROM leadership_assignments la
      INNER JOIN leadership l ON la.leadership_id = l.id
      INNER JOIN youth_members ym ON l.youth_member_id = ym.id
      INNER JOIN members m ON ym.member_id = m.id
      WHERE la.completado = 0
      ORDER BY la.fecha_asignada ASC
    `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener asignaciones pendientes:', error);
        throw error;
    }
};

// Verificar si un joven es líder
export const isLeader = async (youthId) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT id FROM leadership WHERE youth_member_id = ? AND activo = 1`,
            args: [youthId]
        });
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error al verificar liderazgo:', error);
        throw error;
    }
};
