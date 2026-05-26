import { apiExecute } from '../lib/apiClient';

export const getGeneralStats = async () => apiExecute('stats.getGeneral');

export const getMemberGrowthStats = async (months = 6) => apiExecute('stats.getMemberGrowth', { months });

export const getAttendanceStats = async () => {
    try {
        return await apiExecute('stats.getAttendance');
    } catch {
        return { totalJovenes: 0, totalAsistencias: 0, porcentajeAsistencia: 0, ministerio: 'Jóvenes' };
    }
};

export const getAgeDistribution = async () => {
    try {
        return await apiExecute('stats.getAgeDistribution');
    } catch {
        return [];
    }
};

export const getUpcomingBirthdays = async (days = 7) => {
    try {
        return await apiExecute('stats.getUpcomingBirthdays', { days });
    } catch {
        return [];
    }
};

export const getUpcomingEvents = async (days = 7) => {
    try {
        return await apiExecute('stats.getUpcomingEvents', { days });
    } catch {
        return [];
    }
};

export const getLowFundsMinistries = async (threshold = 1000) => {
    try {
        return await apiExecute('stats.getLowFundsMinistries', { threshold });
    } catch {
        return [];
    }
};

export const getInactiveMembers = async (days = 30) => {
    try {
        return await apiExecute('stats.getInactiveMembers', { days });
    } catch {
        return [];
    }
};

export const getMemberTrend = async () => {
    try {
        return await apiExecute('stats.getMemberTrend');
    } catch {
        return { current: 0, last: 0, trend: 0, percentage: 0, isPositive: true };
    }
};
