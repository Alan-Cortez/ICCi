import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export function isPasswordHashed(stored) {
  return typeof stored === 'string' && (stored.startsWith('$2a$') || stored.startsWith('$2b$'));
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, stored) {
  if (!stored) return false;
  if (isPasswordHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}

/** Migra contraseña en texto plano a hash bcrypt */
export async function upgradePasswordIfNeeded(db, userId, plainPassword) {
  const hashed = await hashPassword(plainPassword);
  await db.execute({
    sql: 'UPDATE users SET password = ? WHERE id = ?',
    args: [hashed, userId],
  });
}
