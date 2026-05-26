import { apiExecute } from '../lib/apiClient';

export const getAllSermons = async () => apiExecute('sermons.getAll');

export const getSermonById = async (id) => apiExecute('sermons.getById', { id });

export const createSermon = async (sermonData) => apiExecute('sermons.create', { sermonData });

export const updateSermon = async (id, sermonData) => apiExecute('sermons.update', { id, sermonData });

export const deleteSermon = async (id) => apiExecute('sermons.delete', { id });

export const getSermonsByPreacher = async (preacher) => apiExecute('sermons.getByPreacher', { preacher });
