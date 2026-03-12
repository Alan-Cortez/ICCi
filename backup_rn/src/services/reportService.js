import { getAttendanceByYouth } from './attendanceService';
import { getComplianceByYouth } from './complianceService';
import { getAllYouthMembers } from './youthService';
import { getDateRange, formatDate } from '../utils/dateHelpers';
import { formatIndividualReport, formatGroupReport } from '../utils/reportHelpers';

// Generar reporte diario
export const generateDailyReport = async (fecha) => {
    try {
        const allYouth = await getAllYouthMembers();
        const attendancePromises = allYouth.map(y => getAttendanceByYouth(y.youth_id, fecha, fecha));
        const compliancePromises = allYouth.map(y => getComplianceByYouth(y.youth_id, fecha, fecha));

        const allAttendance = (await Promise.all(attendancePromises)).flat();
        const allCompliance = (await Promise.all(compliancePromises)).flat();

        return formatGroupReport(allAttendance, allCompliance, `Diario - ${formatDate(fecha)}`);
    } catch (error) {
        console.error('Error al generar reporte diario:', error);
        throw error;
    }
};

// Generar reporte semanal
export const generateWeeklyReport = async (fechaInicio) => {
    try {
        const { start, end } = getDateRange('weekly');
        const allYouth = await getAllYouthMembers();

        const attendancePromises = allYouth.map(y => getAttendanceByYouth(y.youth_id, start, end));
        const compliancePromises = allYouth.map(y => getComplianceByYouth(y.youth_id, start, end));

        const allAttendance = (await Promise.all(attendancePromises)).flat();
        const allCompliance = (await Promise.all(compliancePromises)).flat();

        return formatGroupReport(allAttendance, allCompliance, `Semanal - ${formatDate(start)} a ${formatDate(end)}`);
    } catch (error) {
        console.error('Error al generar reporte semanal:', error);
        throw error;
    }
};

// Generar reporte mensual
export const generateMonthlyReport = async (mes, año) => {
    try {
        const { start, end } = getDateRange('monthly', año, mes);
        const allYouth = await getAllYouthMembers();

        const attendancePromises = allYouth.map(y => getAttendanceByYouth(y.youth_id, start, end));
        const compliancePromises = allYouth.map(y => getComplianceByYouth(y.youth_id, start, end));

        const allAttendance = (await Promise.all(attendancePromises)).flat();
        const allCompliance = (await Promise.all(compliancePromises)).flat();

        return formatGroupReport(allAttendance, allCompliance, `Mensual - ${formatDate(start)} a ${formatDate(end)}`);
    } catch (error) {
        console.error('Error al generar reporte mensual:', error);
        throw error;
    }
};

// Generar reporte anual
export const generateAnnualReport = async (año) => {
    try {
        const { start, end } = getDateRange('annual', año);
        const allYouth = await getAllYouthMembers();

        const attendancePromises = allYouth.map(y => getAttendanceByYouth(y.youth_id, start, end));
        const compliancePromises = allYouth.map(y => getComplianceByYouth(y.youth_id, start, end));

        const allAttendance = (await Promise.all(attendancePromises)).flat();
        const allCompliance = (await Promise.all(compliancePromises)).flat();

        return formatGroupReport(allAttendance, allCompliance, `Anual - ${año}`);
    } catch (error) {
        console.error('Error al generar reporte anual:', error);
        throw error;
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
