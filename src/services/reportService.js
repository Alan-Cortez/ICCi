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
        const { getAllTransactions } = await import('./fundService'); // Dynamic import to avoid circular dep if any
        const allTransactions = await getAllTransactions(ministryId);

        // Filter by date range
        const filtered = allTransactions.filter(t => {
            return t.fecha >= start && t.fecha <= end;
        });

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

// Generar tendencias de asistencia (últimas 12 unidades)
export const generateAttendanceTrends = async (type = 'weekly') => {
    try {
        const labels = [];
        const data = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            let start, end, label;
            const d = new Date(today);

            if (type === 'weekly') {
                d.setDate(d.getDate() - (i * 7));
                // Get Saturday of that week
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -1 : 6); // adjust when day is sunday
                const saturday = new Date(d.setDate(diff));
                start = saturday.toISOString().split('T')[0];
                end = start; // One day
                label = saturday.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
            } else {
                d.setMonth(d.getMonth() - i);
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const range = getDateRange('monthly', year, month);
                start = range.start;
                end = range.end;
                label = d.toLocaleDateString('es-MX', { month: 'short' });
            }

            // Get attendance for this slice
            const records = await getAttendanceByDateRange(start, end);

            const present = records.filter(r => r.presente === 1).length;
            const total = records.length; // This might differ if multiple meetings

            // Average attendance % for that period
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            labels.push(label);
            data.push({
                name: label,
                asistencia: percentage,
                total: present
            });
        }

        return data;
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
