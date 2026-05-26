import { getAttendanceByYouth, getAttendanceByDateRange } from './attendanceService';
import { getComplianceByYouth, getComplianceByDateRange } from './complianceService';
import { getAllYouthMembers } from './youthService';
import { getDateRange, formatDate } from '../utils/dateHelpers';
import { formatIndividualReport, formatGroupReport } from '../utils/reportHelpers';

// Generar reporte diario
export const generateDailyReport = async (fecha) => {
    try {
        const allAttendance = await getAttendanceByDateRange(fecha, fecha);
        const allCompliance = await getComplianceByDateRange(fecha, fecha);
        const allYouth = await getAllYouthMembers();

        return formatGroupReport(allAttendance, allCompliance, allYouth, `Diario - ${formatDate(fecha)}`);
    } catch (error) {
        console.error('Error al generar reporte diario:', error);
        throw error;
    }
};

// Generar reporte semanal
export const generateWeeklyReport = async (fechaInicio) => {
    try {
        const { start, end } = getDateRange('weekly');

        const allAttendance = await getAttendanceByDateRange(start, end);
        const allCompliance = await getComplianceByDateRange(start, end);
        const allYouth = await getAllYouthMembers();

        return formatGroupReport(allAttendance, allCompliance, allYouth, `Semanal - ${formatDate(start)} a ${formatDate(end)}`);
    } catch (error) {
        console.error('Error al generar reporte semanal:', error);
        throw error;
    }
};

// Generar reporte mensual
export const generateMonthlyReport = async (mes, año) => {
    try {
        const { start, end } = getDateRange('monthly', año, mes);

        const allAttendance = await getAttendanceByDateRange(start, end);
        const allCompliance = await getComplianceByDateRange(start, end);
        const allYouth = await getAllYouthMembers();

        return formatGroupReport(allAttendance, allCompliance, allYouth, `Mensual - ${formatDate(start)} a ${formatDate(end)}`);
    } catch (error) {
        console.error('Error al generar reporte mensual:', error);
        throw error;
    }
};

// Generar reporte anual
export const generateAnnualReport = async (año) => {
    try {
        const { start, end } = getDateRange('annual', año);

        const allAttendance = await getAttendanceByDateRange(start, end);
        const allCompliance = await getComplianceByDateRange(start, end);
        const allYouth = await getAllYouthMembers();

        return formatGroupReport(allAttendance, allCompliance, allYouth, `Anual - ${año}`);
    } catch (error) {
        console.error('Error al generar reporte anual:', error);
        throw error;
    }
};

// Generar reporte financiero
export const generateFinancialReport = async (ministryId, start, end) => {
    try {
        const { getAllTransactions } = await import('./fundService');
        const allTransactions = await getAllTransactions({
            ministryId,
            desde: start,
            hasta: end,
        });
        const filtered = allTransactions;

        const income = filtered.filter(t => t.tipo === 'ingreso');
        const expense = filtered.filter(t => t.tipo === 'salida');

        const totalIncome = income.reduce((sum, t) => sum + parseFloat(t.monto), 0);
        const totalExpense = expense.reduce((sum, t) => sum + parseFloat(t.monto), 0);
        const netBalance = totalIncome - totalExpense;

        return {
            period: `${formatDate(start)} - ${formatDate(end)}`,
            totalIncome,
            totalExpense,
            netBalance,
            transactions: filtered,
            stats: {
                transactionCount: filtered.length,
                avgIncome: income.length ? totalIncome / income.length : 0,
                avgExpense: expense.length ? totalExpense / expense.length : 0
            }
        };
    } catch (error) {
        console.error('Error al generar reporte financiero:', error);
        throw error;
    }
};

// Tendencia de asistencia alineada al período del reporte (por reunión o por mes)
export const generateAttendanceTrends = async (start, end) => {
    try {
        const records = await getAttendanceByDateRange(start, end);
        const valid = records.filter(r => !r.es_reunion_cancelada);
        if (valid.length === 0) return [];

        const dayMs = 1000 * 60 * 60 * 24;
        const spanDays = Math.ceil((new Date(end) - new Date(start)) / dayMs) + 1;

        const formatShort = (dateStr) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        };

        // Períodos largos: agrupar por mes
        if (spanDays > 62) {
            const byMonth = {};
            valid.forEach((r) => {
                const key = r.fecha.slice(0, 7);
                if (!byMonth[key]) byMonth[key] = [];
                byMonth[key].push(r);
            });
            return Object.keys(byMonth).sort().map((key) => {
                const monthRecords = byMonth[key];
                const present = monthRecords.filter((r) => r.presente === 1).length;
                const total = monthRecords.length;
                const [y, m] = key.split('-').map(Number);
                const label = new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
                return { name: label, asistencia: total > 0 ? Math.round((present / total) * 100) : 0, total: present };
            });
        }

        // Períodos cortos: una barra por fecha de reunión
        const dates = [...new Set(valid.map((r) => r.fecha))].sort();
        return dates.map((fecha) => {
            const dayRecords = valid.filter((r) => r.fecha === fecha);
            const present = dayRecords.filter((r) => r.presente === 1).length;
            const total = dayRecords.length;
            return {
                name: formatShort(fecha),
                asistencia: total > 0 ? Math.round((present / total) * 100) : 0,
                total: present,
            };
        });
    } catch (error) {
        console.error('Error trends:', error);
        return [];
    }
};

// Generar reporte individual
export const generateIndividualReport = async (youthId, periodo) => {
    try {
        const { start, end } = periodo;
        const youthData = await getAllYouthMembers().then(youth =>
            youth.find(y => y.youth_id === youthId)
        );

        const attendanceRecords = await getAttendanceByYouth(youthId, start, end);
        const complianceRecords = await getComplianceByYouth(youthId, start, end);

        return formatIndividualReport(youthData, attendanceRecords, complianceRecords);
    } catch (error) {
        console.error('Error al generar reporte individual:', error);
        throw error;
    }
};
