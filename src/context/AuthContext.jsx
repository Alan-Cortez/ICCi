import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, login as authLogin, logout as authLogout } from '../services/authService';

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
        // Cargar usuario desde localStorage al iniciar
        const user = getCurrentUser();
        setCurrentUser(user);
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const user = await authLogin(email, password);
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
        return currentUser && currentUser.role === role;
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

    const value = {
        currentUser,
        login,
        logout,
        isAuthenticated,
        hasRole,
        isAdmin,
        isLeader,
        isMember,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
