/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

/**
 * Auth state for the eccuity OAuth login. Mirrors the lightweight provider+hook
 * pattern used by lib/theme.ts. The session lives in an httpOnly cookie set by
 * the backend after OAuth — JS never sees a token; it only knows logged-in or not.
 *
 * `authEnabled` is reported by the backend (/auth/me): when OAuth isn't
 * configured yet, the app behaves as fully open (no login UI, no gating).
 */
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

interface AuthState {
  authEnabled: boolean;
  isLoggedIn: boolean;
  user: AuthUser | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_URL || '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    authEnabled: false,
    isLoggedIn: false,
    user: null,
    isLoading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/me');
      const data = res.data as { authEnabled?: boolean; user?: AuthUser | null };
      setState({
        authEnabled: !!data.authEnabled,
        isLoggedIn: !!data.user,
        user: data.user ?? null,
        isLoading: false,
      });
    } catch {
      setState({ authEnabled: false, isLoggedIn: false, user: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Full-page redirect into the backend-driven OAuth flow.
  const login = useCallback(() => {
    window.location.href = `${API_BASE}/api/v1/auth/login`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      /* ignore */
    }
    await refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
