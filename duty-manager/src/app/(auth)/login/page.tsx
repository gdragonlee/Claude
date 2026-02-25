'use client';

import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <ToastProvider>
      <AuthProvider>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-slate-100">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <img src="/cnuh-logo.svg" alt="충남대학교병원" className="w-20 h-20 mx-auto mb-4 object-contain" />
              <p className="text-sm font-semibold text-blue-800 tracking-wider mb-1">CNUH APM</p>
              <h1 className="text-2xl font-bold text-blue-600 mb-1">당직일정관리</h1>
              <p className="text-sm text-slate-500">로그인</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </AuthProvider>
    </ToastProvider>
  );
}
