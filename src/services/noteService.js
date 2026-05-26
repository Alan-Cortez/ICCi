import { apiExecute } from '../lib/apiClient';

export const getNotesByYouth = async (youthId) => apiExecute('notes.getByYouth', { youthId });

export const addNote = async (youthId, fecha, contenido) => apiExecute('notes.add', { youthId, fecha, contenido });

export const getAllNotes = async () => apiExecute('notes.getAll');

export const updateNote = async (noteId, contenido) => apiExecute('notes.update', { noteId, contenido });

export const deleteNote = async (noteId) => apiExecute('notes.delete', { noteId });
