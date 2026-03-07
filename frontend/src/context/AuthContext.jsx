import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/bankService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { setLoading(false); return; }
        try {
            const { data } = await authService.getProfile();
            setUser(data);
        } catch {
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadUser(); }, [loadUser]);

    const login = (tokens, userData) => {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        setUser(userData);
    };

    const logout = async () => {
        try {
            const refresh = localStorage.getItem('refresh_token');
            await authService.logout(refresh);
        } catch { }
        localStorage.clear();
        setUser(null);
    };

    const updateUser = (userData) => setUser(prev => ({ ...prev, ...userData }));

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
