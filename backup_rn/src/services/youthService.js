import tursoClient from '../database/turso';

// Agregar miembro al ministerio de jóvenes
export const addYouthMember = async (memberId) => {
    try {
        const fechaIngreso = new Date().toISOString().split('T')[0];

        const result = await tursoClient.execute({
            sql: `INSERT INTO youth_members (member_id, fecha_ingreso, activo) VALUES (?, ?, 1)`,
            args: [memberId, fechaIngreso]
        });

        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al agregar joven:', error);
        throw error;
    }
};

// Remover miembro del ministerio
export const removeYouthMember = async (youthId) => {
    try {
        await tursoClient.execute({
            sql: `UPDATE youth_members SET activo = 0 WHERE id = ?`,
            args: [youthId]
        });
        return { success: true };
    } catch (error) {
        console.error('Error al remover joven:', error);
        throw error;
    }
};

// Obtener todos los jóvenes activos con información del miembro
export const getAllYouthMembers = async () => {
    try {
        const result = await tursoClient.execute(`
      SELECT 
        ym.id as youth_id,
        ym.member_id,
        ym.fecha_ingreso,
        ym.activo,
        m.nombre,
        m.apellido_paterno,
        m.apellido_materno,
        m.foto,
        m.genero,
        m.dia_cumpleanos,
        m.mes_cumpleanos
      FROM youth_members ym
      INNER JOIN members m ON ym.member_id = m.id
      WHERE ym.activo = 1
      ORDER BY m.nombre ASC
    `);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener jóvenes:', error);
        throw error;
    }
};

// Obtener joven por ID
export const getYouthMemberById = async (youthId) => {
    try {
        const result = await tursoClient.execute({
            sql: `
        SELECT 
          ym.id as youth_id,
          ym.member_id,
          ym.fecha_ingreso,
          ym.activo,
          m.nombre,
          m.apellido_paterno,
          m.apellido_materno,
          m.foto,
          m.genero
        FROM youth_members ym
        INNER JOIN members m ON ym.member_id = m.id
        WHERE ym.id = ?
      `,
            args: [youthId]
        });
        return result.rows[0];
    } catch (error) {
        console.error('Error al obtener joven:', error);
        throw error;
    }
};

// Verificar si un miembro ya está en el ministerio
export const isYouthMember = async (memberId) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT id FROM youth_members WHERE member_id = ? AND activo = 1`,
            args: [memberId]
        });
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error al verificar joven:', error);
        throw error;
    }
};
