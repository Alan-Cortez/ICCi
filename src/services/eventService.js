import { apiExecute } from '../lib/apiClient';
import { getCachedData, setCachedData } from './dataCache';

export const createEvent = async (nombre, descripcion, fecha, ministryId = null, createdBy = null) =>
    apiExecute('events.create', { nombre, descripcion, fecha, ministryId, createdBy });

export const getAllEvents = async () => apiExecute('events.getAll');

export const getEventsByMinistry = async (ministryId) => apiExecute('events.getByMinistry', { ministryId });

export const getUpcomingEvents = async () => apiExecute('events.getUpcoming');

export const getEventsByMonth = async (month, year) => {
    if (!navigator.onLine) {
        const cached = getCachedData(`events_${month}_${year}`);
        return cached || [];
    }
    const rows = await apiExecute('events.getByMonth', { month, year });
    setCachedData(`events_${month}_${year}`, rows);
    return rows;
};

export const updateEvent = async (id, nombre, descripcion, fecha, createdBy = null) =>
    apiExecute('events.update', { id, nombre, descripcion, fecha, createdBy });

export const deleteEvent = async (id) => apiExecute('events.delete', { id });
