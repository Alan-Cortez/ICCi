const TOKEN_KEY = 'icci_auth_token';
const USER_KEY = 'currentUser';

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = { ...options, headers };
  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let res;
  try {
    res = await fetch(path, fetchOptions);
  } catch {
    throw new Error(
      'No se pudo conectar con la API local. Ejecuta en la raíz del proyecto: npm run dev (inicia API + interfaz).'
    );
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Error ${res.status}`);
  }
  return json;
}

export async function apiExecute(operation, args = {}) {
  const json = await apiFetch('/api/execute', {
    method: 'POST',
    body: { operation, args },
  });
  return json.data;
}

export async function initializeAppDatabase() {
  await apiFetch('/api/init', { method: 'POST' });
}
