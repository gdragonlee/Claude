'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Profile, LoginDTO, SignupDTO } from '../types';
import * as authApi from '../api/auth';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDTO) => Promise<void>;
  signup: (data: SignupDTO) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'name' | 'position' | 'phone'>>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me);
  }, []);

  useEffect(() => {
    authApi.getMe().then((me) => {
      setUser(me);
      setIsLoading(false);
    });
  }, []);

  const login = async (data: LoginDTO) => {
    const profile = await authApi.login(data);
    setUser(profile);
  };

  const signup = async (data: SignupDTO) => {
    const profile = await authApi.signup(data);
    setUser(profile);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'name' | 'position' | 'phone'>>) => {
    if (!user) return;
    const updated = await authApi.updateProfile(user.id, updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
