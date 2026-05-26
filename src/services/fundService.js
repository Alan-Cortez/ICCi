import { apiExecute } from '../lib/apiClient';

export const CATEGORIAS_INGRESO = [
    'Diezmos', 'Ofrenda General', 'Ofrenda Especial', 'Donación', 'Evento', 'Otro'
];

export const CATEGORIAS_SALIDA = [
    'Gastos de Evento', 'Mantenimiento', 'Servicios', 'Materiales',
    'Transporte', 'Viáticos', 'Equipos', 'Otro'
];

export const addTransaction = async ({ tipo, monto, concepto, categoria, fecha, ministryId = null, registradoPor = null }) =>
    apiExecute('funds.addTransaction', { tipo, monto, concepto, categoria, fecha, ministryId, registradoPor });

export const getCurrentBalance = async (ministryId = null) =>
    apiExecute('funds.getCurrentBalance', { ministryId });

export const getMonthlyBalance = async (year, month, ministryId = null) =>
    apiExecute('funds.getMonthlyBalance', { year, month, ministryId });

export const getAllTransactions = async (filters = {}) =>
    apiExecute('funds.getAllTransactions', filters);

export const getMonthlySummaryByCategory = async (year, month, tipo = null) =>
    apiExecute('funds.getMonthlySummaryByCategory', { year, month, tipo });

export const deleteTransaction = async (id) => apiExecute('funds.deleteTransaction', { id });

export const getAllMinistriesBalances = async () => apiExecute('funds.getAllMinistriesBalances');
