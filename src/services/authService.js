import { apiFetch, setAuthSession, clearAuthSession, getStoredUser, getAuthToken } from '../lib/apiClient';

export const login = async (email, password) => {
  const { token, user } = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setAuthSession(token, user);
  return user;
};

export const logout = () => {
  clearAuthSession();
};

export const getCurrentUser = () => getStoredUser();

export const validateSession = async () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const { user } = await apiFetch('/api/auth/me', { method: 'GET' });
    setAuthSession(token, user);
    return user;
  } catch {
    clearAuthSession();
    return null;
  }
};

export const isAuthenticated = () => getCurrentUser() !== null;

export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && String(user.role).toLowerCase() === String(role).toLowerCase();
};

export const isAdmin = () => hasRole('admin');
export const isLeader = () => hasRole('leader');
export const isMember = () => hasRole('member');
export const isTreasurer = () => hasRole('treasurer');

export const loginWithGoogle = async (credential) => {
  const { token, user } = await apiFetch('/api/auth/google', {
    method: 'POST',
    body: { credential },
  });
  setAuthSession(token, user);
  return user;
};

export const forgotPassword = async (email) => {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
};

export const resetPassword = async (token, password) => {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: { token, password },
  });
};
