import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, linkGrower as apiLinkGrower } from '../services/authApi';

const AuthContext = createContext(null);

function parseToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            userId:   payload.sub,
            email:    payload.email,
            role:     payload.role,
            name:     payload.name,
            growerId: payload.growerId ?? null,
        };
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => sessionStorage.getItem('_auth_token'));
    const [user, setUser]   = useState(() => {
        const t = sessionStorage.getItem('_auth_token');
        return t ? parseToken(t) : null;
    });

    const login = useCallback(async (email, password) => {
        const data = await apiLogin(email, password);
        sessionStorage.setItem('_auth_token', data.token);
        setToken(data.token);
        setUser(parseToken(data.token));
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem('_auth_token');
        setToken(null);
        setUser(null);
    }, []);

    // Called after grower completes Step 1 — links their account to the grower record
    const linkGrower = useCallback(async (growerId) => {
        const data = await apiLinkGrower(growerId, token);
        sessionStorage.setItem('_auth_token', data.token);
        setToken(data.token);
        setUser(parseToken(data.token));
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, linkGrower }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
