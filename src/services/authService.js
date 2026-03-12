import tursoClient from '../database/turso';

// Login - Autenticar usuario
export const login = async (email, password) => {
    try {
        const result = await tursoClient.execute({
            sql: `SELECT id, email, role, nombre, ministry_id FROM users WHERE email = ? AND password = ?`,
            args: [email, password]
        });

        if (result.rows.length === 0) {
            throw new Error('Credenciales inválidas');
        }

        const user = result.rows[0];

        // Guardar en localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));

        return user;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
};

// Logout - Cerrar sesión
export const logout = () => {
    localStorage.removeItem('currentUser');
};

// Obtener usuario actual
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

// Verificar si está autenticado
export const isAuthenticated = () => {
    return getCurrentUser() !== null;
};

// Verificar si tiene un rol específico
export const hasRole = (role) => {
    const user = getCurrentUser();
    return user && user.role === role;
};

// Verificar si es admin
export const isAdmin = () => {
    return hasRole('admin');
};

// Verificar si es líder
export const isLeader = () => {
    return hasRole('leader');
};

// Verificar si es miembro
export const isMember = () => {
    return hasRole('member');
};
