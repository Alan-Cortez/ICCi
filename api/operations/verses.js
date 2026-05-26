import { rows, insert } from './helpers.js';

export const verseOperations = {
  'verses.getDaily': {
    async handler(db) {
      const verses = await rows(db, 'SELECT * FROM bible_verses');
      if (verses.length === 0) return null;
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
      return verses[dayOfYear % verses.length];
    },
  },
  'verses.getAll': {
    async handler(db) {
      return rows(db, 'SELECT * FROM bible_verses ORDER BY reference');
    },
  },
  'verses.add': {
    async handler(db, _user, args) {
      const { reference, text, category, version = 'RVR1960' } = args.verseData;
      return insert(db, 'INSERT INTO bible_verses (reference, text, category, version) VALUES (?, ?, ?, ?)', [reference, text, category, version]);
    },
  },
};
