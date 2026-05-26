import { apiExecute } from '../lib/apiClient';

export const addToLeadership = async (youthId) => apiExecute('leadership.add', { youthId });

export const removeFromLeadership = async (leadershipId) => apiExecute('leadership.remove', { leadershipId });

export const getLeadershipMembers = async () => apiExecute('leadership.getMembers');

export const assignTask = async (youthMemberId, tipo, fecha, notas = null, leadershipId = null) =>
    apiExecute('leadership.assignTask', { youthMemberId, tipo, fecha, notas, leadershipId });

export const completeAssignment = async (assignmentId) =>
    apiExecute('leadership.completeAssignment', { assignmentId });

export const getAssignments = async (fechaInicio, fechaFin) =>
    apiExecute('leadership.getAssignments', { fechaInicio, fechaFin });

export const getPendingAssignments = async () => apiExecute('leadership.getPendingAssignments');

export const isLeader = async (youthId) => apiExecute('leadership.isLeader', { youthId });
