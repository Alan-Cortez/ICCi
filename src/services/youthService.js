import { apiExecute } from '../lib/apiClient';

export const addYouthMember = async (memberId) => apiExecute('youth.add', { memberId });

export const removeYouthMember = async (youthId) => apiExecute('youth.remove', { youthId });

export const getAllYouthMembers = async () => apiExecute('youth.getAll');

export const getYouthMemberById = async (youthId) => apiExecute('youth.getById', { youthId });

export const isYouthMember = async (memberId) => apiExecute('youth.isMember', { memberId });
