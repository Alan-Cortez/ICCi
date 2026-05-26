export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function requireAuth(user) {
  if (!user) throw new ApiError(401, 'Sesión inválida o expirada');
}

export function requireAdmin(user) {
  requireAuth(user);
  if (String(user.role).toLowerCase() !== 'admin') {
    throw new ApiError(403, 'Se requiere rol de administrador');
  }
}

export function requireAdminOrTreasurer(user) {
  requireAuth(user);
  const role = String(user.role).toLowerCase();
  if (role !== 'admin' && role !== 'treasurer') {
    throw new ApiError(403, 'Se requiere rol de tesorero o administrador');
  }
}

export function canManageUsers(user) {
  return String(user?.role).toLowerCase() === 'admin';
}
