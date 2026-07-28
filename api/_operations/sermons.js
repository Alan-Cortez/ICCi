import { rows, row, insert, run } from './helpers.js';
import { requireAdmin } from '../_lib/roles.js';

function mapSermon(row) {
  if (!row) return null;
  return { ...row, versiculos: row.versiculos ? JSON.parse(row.versiculos) : [] };
}

export const sermonOperations = {
  'sermons.getAll': {
    async handler(db) {
      const r = await rows(db, 'SELECT * FROM sermons ORDER BY fecha DESC');
      return r.map(mapSermon);
    },
  },
  'sermons.getById': {
    async handler(db, _user, args) {
      return mapSermon(await row(db, 'SELECT * FROM sermons WHERE id = ?', [args.id]));
    },
  },
  'sermons.create': {
    async handler(db, user, args) {
      requireAdmin(user);
      const { titulo, fecha, predicador, versiculos, texto_completo } = args.sermonData;
      return insert(db, 'INSERT INTO sermons (titulo, fecha, predicador, versiculos, texto_completo) VALUES (?, ?, ?, ?, ?)',
        [titulo, fecha, predicador, JSON.stringify(versiculos || []), texto_completo]);
    },
  },
  'sermons.update': {
    async handler(db, user, args) {
      requireAdmin(user);
      const { titulo, fecha, predicador, versiculos, texto_completo } = args.sermonData;
      await run(db, `UPDATE sermons SET titulo = ?, fecha = ?, predicador = ?, versiculos = ?, texto_completo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [titulo, fecha, predicador, JSON.stringify(versiculos || []), texto_completo, args.id]);
      return { success: true };
    },
  },
  'sermons.delete': {
    async handler(db, user, args) {
      requireAdmin(user);
      await run(db, 'DELETE FROM sermons WHERE id = ?', [args.id]);
      return { success: true };
    },
  },
  'sermons.getByPreacher': {
    async handler(db, _user, args) {
      const r = await rows(db, 'SELECT * FROM sermons WHERE predicador LIKE ? ORDER BY fecha DESC', [`%${args.preacher}%`]);
      return r.map(mapSermon);
    },
  },
};
