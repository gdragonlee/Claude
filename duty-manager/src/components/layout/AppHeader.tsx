'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useState, useRef, useEffect } from 'react';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="bg-blue-600 text-white px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
      <Link href="/dashboard" className="text-lg font-bold">
        당직일정관리
      </Link>

      <div className="flex items-center gap-3">
        <Link href="/notifications" className="relative p-2 hover:bg-blue-700 rounded-lg transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-blue-700 rounded-lg px-3 py-1.5 transition"
          >
            <div className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.[0] || '?'}
            </div>
            <span className="hidden md:inline text-sm">{user?.name}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border text-slate-700 text-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user?.role === 'admin' ? '관리자' : '일반 사용자'}
                </p>
              </div>
              <Link
                href="/profile"
                className="block px-4 py-2.5 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                프로필 설정
              </Link>
              {user?.role === 'admin' && (
                <Link
                  href="/admin/users"
                  className="block px-4 py-2.5 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  사용자 관리
                </Link>
              )}
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="block w-full text-left px-4 py-2.5 hover:bg-slate-50 text-red-600 border-t"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
