import { apiExecute } from '../lib/apiClient';
import { queueOperation } from './offlineStorage';
import { getCachedData, setCachedData } from './dataCache';

export const createMember = async (memberData) => {
    if (!navigator.onLine) {
        return queueOperation({ type: 'CREATE_MEMBER', data: memberData });
    }
    return apiExecute('members.create', memberData);
};

export const getAllMembers = async () => {
    if (!navigator.onLine) {
        const cached = getCachedData('all_members');
        return cached || [];
    }
    const rows = await apiExecute('members.getAll');
    setCachedData('all_members', rows);
    return rows;
};

export const getMembersByBirthdayMonth = async (month) => {
    if (!navigator.onLine) {
        const cached = getCachedData(`birthdays_${month}`);
        return cached || [];
    }
    const rows = await apiExecute('members.getByBirthdayMonth', { month });
    setCachedData(`birthdays_${month}`, rows);
    return rows;
};

export const getMemberById = async (id) => apiExecute('members.getById', { id });

export const updateMember = async (id, memberData) => {
    if (!navigator.onLine) {
        return queueOperation({ type: 'UPDATE_MEMBER', data: { id, ...memberData } });
    }
    return apiExecute('members.update', { id, ...memberData });
};

export const deleteMember = async (id) => apiExecute('members.delete', { id });
