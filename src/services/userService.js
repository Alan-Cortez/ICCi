import { apiExecute } from '../lib/apiClient';

export const getAllUsers = async () => apiExecute('users.getAll');

export const updateUser = async (userId, userData) =>
    apiExecute('users.update', { userId, ...userData });

export const createUser = async (userData) => apiExecute('users.create', userData);

export const deleteUser = async (userId) => apiExecute('users.delete', { userId });

export const getMinistryLeader = async (ministryId) => {
    try {
        return await apiExecute('users.getMinistryLeader', { ministryId });
    } catch {
        return null;
    }
};
