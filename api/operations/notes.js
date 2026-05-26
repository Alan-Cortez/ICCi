import { rows, insert, run } from './helpers.js';

export const noteOperations = {
  'notes.getByYouth': {
    async handler(db, _user, args) {
      return rows(db, 'SELECT * FROM youth_notes WHERE youth_member_id = ? ORDER BY fecha DESC, created_at DESC', [args.youthId]);
    },
  },
  'notes.add': {
    async handler(db, _user, args) {
      return insert(db, 'INSERT INTO youth_notes (youth_member_id, fecha, contenido) VALUES (?, ?, ?)', [args.youthId, args.fecha, args.contenido]);
    },
  },
  'notes.getAll': {
    async handler(db) {
      return rows(db, `SELECT yn.id, yn.youth_member_id, yn.fecha, yn.contenido, yn.created_at, m.nombre, m.apellido_paterno, m.foto
        FROM youth_notes yn INNER JOIN youth_members ym ON yn.youth_member_id = ym.id INNER JOIN members m ON ym.member_id = m.id ORDER BY yn.fecha DESC, yn.created_at DESC`);
    },
  },
  'notes.update': {
    async handler(db, _user, args) {
      await run(db, 'UPDATE youth_notes SET contenido = ? WHERE id = ?', [args.contenido, args.noteId]);
      return { success: true };
    },
  },
  'notes.delete': {
    async handler(db, _user, args) {
      await run(db, 'DELETE FROM youth_notes WHERE id = ?', [args.noteId]);
      return { success: true };
    },
  },
};
