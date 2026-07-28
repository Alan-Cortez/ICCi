import { rows, insert, run, row } from './helpers.js';
import { requireAdmin } from '../_lib/roles.js';
import { hashPassword } from '../_lib/password.js';

export const userOperations = {
  'users.getAll': {
    async handler(db, user) {
      requireAdmin(user);
      return rows(db, `SELECT u.id, u.email, u.role, u.nombre, u.created_at, u.ministry_id, m.nombre as ministry_name 
        FROM users u LEFT JOIN ministries m ON u.ministry_id = m.id ORDER BY u.created_at DESC`);
    },
  },
  'users.update': {
    async handler(db, user, args) {
      requireAdmin(user);
      const { userId, email, role, nombre, ministry_id, password } = args;
      if (password) {
        const hashed = await hashPassword(password);
        await run(db, 'UPDATE users SET email = ?, role = ?, nombre = ?, ministry_id = ?, password = ? WHERE id = ?',
          [email, role, nombre, ministry_id || null, hashed, userId]);
      } else {
        await run(db, 'UPDATE users SET email = ?, role = ?, nombre = ?, ministry_id = ? WHERE id = ?',
          [email, role, nombre, ministry_id || null, userId]);
      }
      return { success: true };
    },
  },
  'users.create': {
    async handler(db, user, args) {
      requireAdmin(user);
      const { email, password, role, nombre, ministry_id } = args;
      const hashed = await hashPassword(password);
      return insert(db, 'INSERT INTO users (email, password, role, nombre, ministry_id) VALUES (?, ?, ?, ?, ?)',
        [email, hashed, role, nombre, ministry_id || null]);
    },
  },
  'users.delete': {
    async handler(db, user, args) {
      requireAdmin(user);
      await run(db, 'DELETE FROM users WHERE id = ?', [args.userId]);
      return { success: true };
    },
  },
  'users.getMinistryLeader': {
    async handler(db, _user, args) {
      const leader = await row(db, `SELECT email, nombre FROM users WHERE role = 'leader' AND ministry_id = ? LIMIT 1`, [args.ministryId]);
      if (leader) return leader;
      return row(db, `SELECT email, nombre FROM users WHERE role = 'admin' LIMIT 1`);
    },
  },
};
