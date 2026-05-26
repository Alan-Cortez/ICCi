/**
 * @deprecated La inicialización de usuarios se hace en el servidor (/api/init).
 * Configura ADMIN_EMAIL y ADMIN_PASSWORD en las variables de entorno de Vercel.
 */
export const initializeUsersTable = async () => {
  console.warn('initializeUsersTable está obsoleto. Usa /api/init en el servidor.');
  return { success: true };
};
