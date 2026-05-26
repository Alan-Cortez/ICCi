/**
 * La base de datos solo es accesible desde el servidor (API).
 * Este módulo conserva initializeDatabase para compatibilidad con App.jsx.
 */
import { initializeAppDatabase } from '../lib/apiClient';

export const initializeDatabase = initializeAppDatabase;

/** @deprecated No usar en el cliente — todas las consultas van por /api/execute */
const tursoClient = {
  execute: () => {
    throw new Error('Acceso directo a Turso deshabilitado. Usa los servicios con apiExecute.');
  },
};

export default tursoClient;
