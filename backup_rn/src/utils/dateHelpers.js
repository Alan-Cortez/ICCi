// Funciones auxiliares para manejo de fechas

// Obtener fecha de hoy en formato YYYY-MM-DD
export const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

// Formatear fecha a formato legible
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
};

// Obtener inicio de semana (lunes)
export const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
};

// Obtener fin de semana (domingo)
export const getWeekEnd = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
};

// Obtener inicio de mes
export const getMonthStart = (year, month) => {
    return `${year}-${String(month).padStart(2, '0')}-01`;
};

// Obtener fin de mes
export const getMonthEnd = (year, month) => {
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
};

// Obtener inicio de año
export const getYearStart = (year) => {
    return `${year}-01-01`;
};

// Obtener fin de año
export const getYearEnd = (year) => {
    return `${year}-12-31`;
};

// Obtener nombre del mes
export const getMonthName = (month) => {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
};

// Calcular diferencia en días
export const daysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Obtener rango de fechas para período
export const getDateRange = (period, year, month = null) => {
    switch (period) {
        case 'weekly':
            return {
                start: getWeekStart(),
                end: getWeekEnd()
            };
        case 'monthly':
            return {
                start: getMonthStart(year, month),
                end: getMonthEnd(year, month)
            };
        case 'annual':
            return {
                start: getYearStart(year),
                end: getYearEnd(year)
            };
        default:
            return {
                start: getToday(),
                end: getToday()
            };
    }
};
