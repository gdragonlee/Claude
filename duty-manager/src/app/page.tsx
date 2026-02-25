'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import LoginForm from '@/components/auth/LoginForm';

function HomeContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">로딩 중...</div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">당직일정관리</h1>
          <p className="text-sm text-slate-500">온라인 당직 관리 시스템</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HomeContent />
      </AuthProvider>
    </ToastProvider>
  );
}
