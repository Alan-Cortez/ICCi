import { apiExecute } from '../lib/apiClient';

export const getDailyVerse = async () => {
    try {
        return await apiExecute('verses.getDaily');
    } catch {
        return null;
    }
};

export const getAllVerses = async () => {
    try {
        return await apiExecute('verses.getAll');
    } catch {
        return [];
    }
};

export const addVerse = async (verseData) => apiExecute('verses.add', { verseData });
