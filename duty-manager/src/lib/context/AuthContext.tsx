'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Profile, LoginDTO, SignupDTO } from '../types';
import { supabase } from '../supabase';
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

/** 유저 ID로 프로필 조회 (최대 3회 재시도) */
async function fetchProfile(userId: string): Promise<Profile | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        return null;
      }
      if (!data) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        position: data.position,
        phone: data.phone,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      return null;
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me);
  }, []);

  useEffect(() => {
    // onAuthStateChange 하나로 모든 세션 이벤트 처리
    // INITIAL_SESSION: 클라이언트 초기화 시 localStorage에서 세션 복원
    // SIGNED_IN: 로그인 성공
    // SIGNED_OUT: 로그아웃
    // TOKEN_REFRESHED: 토큰 갱신
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] onAuthStateChange:', event, 'session:', !!session);
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // 즉시 메타데이터로 유저 설정 (lock 블로킹 방지)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '사용자',
            role: (session.user.user_metadata?.role as 'admin' | 'user') || 'user',
            position: null,
            phone: null,
            isActive: true,
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          });
          setIsLoading(false);

          // 프로필 조회는 비동기로 별도 실행 (lock 해제 후)
          setTimeout(() => {
            fetchProfile(session.user.id).then((profile) => {
              if (profile) {
                setUser(profile);
              }
            });
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // 안전장치: 5초 후에도 로딩이면 강제 해제
    const timeout = setTimeout(() => setIsLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (data: LoginDTO) => {
    await authApi.login(data);
    // onAuthStateChange가 SIGNED_IN 이벤트로 프로필 로딩 처리
  };

  const signup = async (data: SignupDTO) => {
    await authApi.signup(data);
    // onAuthStateChange가 SIGNED_IN 이벤트로 프로필 로딩 처리
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
