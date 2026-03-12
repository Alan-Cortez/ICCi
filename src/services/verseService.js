import tursoClient from '../database/turso';

export const getDailyVerse = async () => {
    try {
        // Obtener todos los versículos
        const result = await tursoClient.execute('SELECT * FROM bible_verses');
        const verses = result.rows;

        if (verses.length === 0) return null;

        // Usar fecha como seed para selección consistente diaria
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
        const index = dayOfYear % verses.length;

        return verses[index];
    } catch (error) {
        console.error('Error al obtener versículo:', error);
        return null;
    }
};

export const getAllVerses = async () => {
    try {
        const result = await tursoClient.execute('SELECT * FROM bible_verses ORDER BY reference');
        return result.rows;
    } catch (error) {
        console.error('Error al obtener versículos:', error);
        return [];
    }
};

export const addVerse = async (verseData) => {
    try {
        const { reference, text, category, version = 'RVR1960' } = verseData;
        const result = await tursoClient.execute({
            sql: `INSERT INTO bible_verses (reference, text, category, version) VALUES (?, ?, ?, ?)`,
            args: [reference, text, category, version]
        });
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('Error al agregar versículo:', error);
        throw error;
    }
};
