import { apiExecute } from '../lib/apiClient';
import { getCachedData, setCachedData } from './dataCache';

export const createMinistry = async (nombre, descripcion) =>
    apiExecute('ministries.create', { nombre, descripcion });

export const getAllMinistries = async () => {
    if (!navigator.onLine) {
        const cached = getCachedData('all_ministries');
        return cached || [];
    }
    const rows = await apiExecute('ministries.getAll');
    setCachedData('all_ministries', rows);
    return rows;
};

export const getMinistryById = async (id) => apiExecute('ministries.getById', { id });

export const addMemberToMinistry = async (ministryId, memberId) =>
    apiExecute('ministries.addMember', { ministryId, memberId });

export const getMinistryMembers = async (ministryId) =>
    apiExecute('ministries.getMembers', { ministryId });

export const removeMemberFromMinistry = async (membershipId) =>
    apiExecute('ministries.removeMember', { membershipId });

export const updateMinistry = async (id, nombre, descripcion) =>
    apiExecute('ministries.update', { id, nombre, descripcion });

export const deleteMinistry = async (id) => apiExecute('ministries.delete', { id });

export const getMinistryStats = async (id) => apiExecute('ministries.getStats', { id });
