import { apiExecute } from '../lib/apiClient';

export const markCompliance = async (youthId, fecha, tieneBiblia, tieneApuntes) =>
    apiExecute('compliance.mark', { youthId, fecha, tieneBiblia, tieneApuntes });

export const getComplianceByDate = async (fecha) => apiExecute('compliance.getByDate', { fecha });

export const getComplianceByYouth = async (youthId, fechaInicio, fechaFin) =>
    apiExecute('compliance.getByYouth', { youthId, fechaInicio, fechaFin });

export const updateCompliance = async (id, tieneBiblia, tieneApuntes) =>
    apiExecute('compliance.update', { id, tieneBiblia, tieneApuntes });

export const hasComplianceForDate = async (youthId, fecha) =>
    apiExecute('compliance.hasForDate', { youthId, fecha });

export const deleteCompliance = async (id) => apiExecute('compliance.delete', { id });

export const getComplianceByDateRange = async (fechaInicio, fechaFin) =>
    apiExecute('compliance.getByDateRange', { fechaInicio, fechaFin });
