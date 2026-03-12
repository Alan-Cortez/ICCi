import tursoClient from '../database/turso';

// Obtener estadísticas generales del sistema
export const getGeneralStats = async () => {
    try {
        const [membersResult, ministriesResult, eventsResult, fundsResult] = await Promise.all([
            // Total de miembros
            tursoClient.execute('SELECT COUNT(*) as total FROM members'),
            // Total de ministerios
            tursoClient.execute('SELECT COUNT(*) as total FROM ministries'),
            // Eventos este mes
            tursoClient.execute({
                sql: `SELECT COUNT(*) as total FROM events 
                      WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')`,
            }),
            // Fondos totales (suma de todos los ministerios)
            tursoClient.execute(`
                SELECT 
                    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) as total_salidas
                FROM funds
            `)
        ]);

        const totalMembers = membersResult.rows[0]?.total || 0;
        const totalMinistries = ministriesResult.rows[0]?.total || 0;
        const eventsThisMonth = eventsResult.rows[0]?.total || 0;

        const ingresos = parseFloat(fundsResult.rows[0]?.total_ingresos || 0);
        const salidas = parseFloat(fundsResult.rows[0]?.total_salidas || 0);
        const totalFunds = ingresos - salidas;

        return {
            totalMembers,
            totalMinistries,
            eventsThisMonth,
            totalFunds,
            totalIngresos: ingresos,
            totalSalidas: salidas
        };
    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        throw error;
    }
};

// Obtener crecimiento de miembros por mes
export const getMemberGrowthStats = async (months = 6) => {
    try {
        const result = await tursoClient.execute({
            sql: `
                SELECT 
                    strftime('%Y-%m', created_at) as mes,
                    COUNT(*) as total
                FROM members
                WHERE created_at >= date('now', '-${months} months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY mes ASC
            `
        });

        return result.rows.map(row => ({
            mes: row.mes,
            total: parseInt(row.total)
        }));
    } catch (error) {
        console.error('Error al obtener crecimiento de miembros:', error);
        throw error;
    }
};

// Obtener estadísticas de asistencia por ministerio (Youth Ministry)
export const getAttendanceStats = async () => {
    try {
        // Obtener asistencia del ministerio de jóvenes
        const result = await tursoClient.execute(`
            SELECT 
                COUNT(DISTINCT youth_member_id) as total_jovenes,
                SUM(CASE WHEN presente = 1 THEN 1 ELSE 0 END) as total_asistencias,
                COUNT(*) as total_registros
            FROM attendance
            WHERE fecha >= date('now', '-30 days')
        `);

        const row = result.rows[0];
        const totalJovenes = parseInt(row?.total_jovenes || 0);
        const totalAsistencias = parseInt(row?.total_asistencias || 0);
        const totalRegistros = parseInt(row?.total_registros || 0);

        const porcentajeAsistencia = totalRegistros > 0
            ? Math.round((totalAsistencias / totalRegistros) * 100)
            : 0;

        return {
            totalJovenes,
            totalAsistencias,
            porcentajeAsistencia,
            ministerio: 'Jóvenes'
        };
    } catch (error) {
        console.error('Error al obtener estadísticas de asistencia:', error);
        return {
            totalJovenes: 0,
            totalAsistencias: 0,
            porcentajeAsistencia: 0,
            ministerio: 'Jóvenes'
        };
    }
};

// Obtener distribución de edades
export const getAgeDistribution = async () => {
    try {
        const result = await tursoClient.execute(`
            SELECT 
                CASE 
                    WHEN (strftime('%Y', 'now') - strftime('%Y', 
                        printf('%04d-%02d-%02d', 
                            COALESCE(strftime('%Y', 'now'), 2000),
                            mes_cumpleanos,
                            dia_cumpleanos
                        )
                    )) < 18 THEN 'Menores de 18'
                    WHEN (strftime('%Y', 'now') - strftime('%Y', 
                        printf('%04d-%02d-%02d', 
                            COALESCE(strftime('%Y', 'now'), 2000),
                            mes_cumpleanos,
                            dia_cumpleanos
                        )
                    )) BETWEEN 18 AND 30 THEN '18-30'
                    WHEN (strftime('%Y', 'now') - strftime('%Y', 
                        printf('%04d-%02d-%02d', 
                            COALESCE(strftime('%Y', 'now'), 2000),
                            mes_cumpleanos,
                            dia_cumpleanos
                        )
                    )) BETWEEN 31 AND 50 THEN '31-50'
                    ELSE 'Más de 50'
                END as rango,
                COUNT(*) as total
            FROM members
            WHERE mes_cumpleanos IS NOT NULL AND dia_cumpleanos IS NOT NULL
            GROUP BY rango
        `);

        return result.rows.map(row => ({
            rango: row.rango,
            total: parseInt(row.total)
        }));
    } catch (error) {
        console.error('Error al obtener distribución de edades:', error);
        return [];
    }
};

// Obtener cumpleaños próximos
export const getUpcomingBirthdays = async (days = 7) => {
    try {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + days);

        const result = await tursoClient.execute(`
            SELECT id, nombre, apellido_paterno, dia_cumpleanos, mes_cumpleanos
            FROM members
            WHERE mes_cumpleanos IS NOT NULL AND dia_cumpleanos IS NOT NULL
            ORDER BY mes_cumpleanos, dia_cumpleanos
        `);

        // Filtrar cumpleaños en los próximos N días
        const upcoming = result.rows.filter(member => {
            const birthdayThisYear = new Date(today.getFullYear(), member.mes_cumpleanos - 1, member.dia_cumpleanos);
            const birthdayNextYear = new Date(today.getFullYear() + 1, member.mes_cumpleanos - 1, member.dia_cumpleanos);

            return (birthdayThisYear >= today && birthdayThisYear <= endDate) ||
                (birthdayNextYear >= today && birthdayNextYear <= endDate);
        });

        return upcoming.slice(0, 5); // Máximo 5
    } catch (error) {
        console.error('Error al obtener cumpleaños próximos:', error);
        return [];
    }
};

// Obtener eventos próximos
export const getUpcomingEvents = async (days = 7) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        const endDateStr = endDate.toISOString().split('T')[0];

        const result = await tursoClient.execute({
            sql: `
                SELECT e.*, min.nombre as ministerio_nombre
                FROM events e
                LEFT JOIN ministries min ON e.ministry_id = min.id
                WHERE e.fecha BETWEEN ? AND ?
                ORDER BY e.fecha ASC
                LIMIT 5
            `,
            args: [today, endDateStr]
        });

        return result.rows;
    } catch (error) {
        console.error('Error al obtener eventos próximos:', error);
        return [];
    }
};

// Obtener ministerios con fondos bajos
export const getLowFundsMinistries = async (threshold = 1000) => {
    try {
        const result = await tursoClient.execute(`
            SELECT 
                m.id,
                m.nombre,
                SUM(CASE WHEN f.tipo = 'ingreso' THEN f.monto ELSE 0 END) as ingresos,
                SUM(CASE WHEN f.tipo = 'salida' THEN f.monto ELSE 0 END) as salidas
            FROM ministries m
            LEFT JOIN funds f ON f.ministry_id = m.id
            GROUP BY m.id, m.nombre
        `);

        const lowFunds = result.rows
            .map(row => ({
                id: row.id,
                nombre: row.nombre,
                balance: (parseFloat(row.ingresos || 0) - parseFloat(row.salidas || 0))
            }))
            .filter(ministry => ministry.balance < threshold);

        return lowFunds;
    } catch (error) {
        console.error('Error al obtener ministerios con fondos bajos:', error);
        return [];
    }
};

// Obtener miembros inactivos (sin asistencia reciente)
export const getInactiveMembers = async (days = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        const result = await tursoClient.execute({
            sql: `
                SELECT DISTINCT 
                    m.id,
                    m.nombre,
                    m.apellido_paterno,
                    m.telefono
                FROM youth_members ym
                INNER JOIN members m ON ym.member_id = m.id
                WHERE ym.id NOT IN (
                    SELECT DISTINCT youth_member_id 
                    FROM attendance 
                    WHERE fecha >= ? AND presente = 1
                )
                LIMIT 10
            `,
            args: [cutoffDateStr]
        });

        return result.rows;
    } catch (error) {
        console.error('Error al obtener miembros inactivos:', error);
        return [];
    }
};

// Obtener tendencia de miembros (comparación con mes anterior)
export const getMemberTrend = async () => {
    try {
        const [currentMonth, lastMonth] = await Promise.all([
            tursoClient.execute({
                sql: `SELECT COUNT(*) as total FROM members 
                      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`
            }),
            tursoClient.execute({
                sql: `SELECT COUNT(*) as total FROM members 
                      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', '-1 month')`
            })
        ]);

        const current = parseInt(currentMonth.rows[0]?.total || 0);
        const last = parseInt(lastMonth.rows[0]?.total || 0);
        const trend = current - last;
        const percentage = last > 0 ? Math.round((trend / last) * 100) : 0;

        return {
            current,
            last,
            trend,
            percentage,
            isPositive: trend >= 0
        };
    } catch (error) {
        console.error('Error al obtener tendencia de miembros:', error);
        return { current: 0, last: 0, trend: 0, percentage: 0, isPositive: true };
    }
};
