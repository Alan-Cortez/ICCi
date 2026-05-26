import jwt from 'jsonwebtoken';

const TOKEN_TTL = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET debe tener al menos 32 caracteres. Añádelo en .env.local o en Vercel.'
    );
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      nombre: user.nombre,
      ministry_id: user.ministry_id ?? null,
    },
    getSecret(),
    { expiresIn: TOKEN_TTL }
  );
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      nombre: payload.nombre,
      ministry_id: payload.ministry_id,
    };
  } catch {
    return null;
  }
}
