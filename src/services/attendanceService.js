import { apiExecute } from '../lib/apiClient';

export const markAttendance = async (youthId, fecha, presente, justificado = false, razonFalta = null, options = {}) =>
    apiExecute('attendance.mark', { youthId, fecha, presente, justificado, razonFalta, options });

export const getAttendanceByDate = async (fecha) => apiExecute('attendance.getByDate', { fecha });

export const getAttendanceByYouth = async (youthId, fechaInicio, fechaFin) =>
    apiExecute('attendance.getByYouth', { youthId, fechaInicio, fechaFin });

export const updateAttendance = async (id, data) => apiExecute('attendance.update', { id, ...data });

export const hasAttendanceForDate = async (youthId, fecha) =>
    apiExecute('attendance.hasForDate', { youthId, fecha });

export const getAttendanceWithComplianceByDate = async (fecha) =>
    apiExecute('attendance.getWithComplianceByDate', { fecha });

export const deleteAttendance = async (id) => apiExecute('attendance.delete', { id });

export const getAttendanceHistorySummary = async () => apiExecute('attendance.historySummary');

export const getRiskYouth = async (months = 1) => apiExecute('attendance.riskYouth', { months });

export const getAttendanceDates = async () => apiExecute('attendance.getDates');

export const getAttendanceByDateRange = async (fechaInicio, fechaFin) =>
    apiExecute('attendance.getByDateRange', { fechaInicio, fechaFin });
