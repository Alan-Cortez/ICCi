import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as authLogin, logout as authLogout, validateSession, loginWithGoogle as authLoginWithGoogle } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const stored = getCurrentUser();
            if (stored) {
                const user = await validateSession();
                if (!cancelled) setCurrentUser(user);
            }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const login = async (email, password) => {
        const user = await authLogin(email, password);
        setCurrentUser(user);
        return user;
    };

    const loginGoogle = async (credential) => {
        const user = await authLoginWithGoogle(credential);
        setCurrentUser(user);
        return user;
    };

    const logout = () => {
        authLogout();
        setCurrentUser(null);
    };

    const isAuthenticated = () => {
        return currentUser !== null;
    };

    const hasRole = (role) => {
        if (!currentUser || !currentUser.role) return false;
        return String(currentUser.role).trim().toLowerCase() === String(role).trim().toLowerCase();
    };

    const isAdmin = () => {
        return hasRole('admin');
    };

    const isLeader = () => {
        return hasRole('leader');
    };

    const isMember = () => {
        return hasRole('member');
    };

    const isYouthLiderazgo = () => {
        return hasRole('youth_liderazgo');
    };

    const isYouthNoAsistencia = () => {
        return hasRole('youth_no_asistencia');
    };

    const isTreasurer = () => {
        return hasRole('treasurer');
    };

    const value = {
        currentUser,
        login,
        loginGoogle,
        logout,
        isAuthenticated,
        hasRole,
        isAdmin,
        isLeader,
        isMember,
        isYouthLiderazgo,
        isYouthNoAsistencia,
        isTreasurer,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
