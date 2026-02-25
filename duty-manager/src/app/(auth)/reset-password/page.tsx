'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/api/auth';
import Button from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">당직일정관리</h1>
          <p className="text-sm text-slate-500">비밀번호 재설정</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.
              </div>
              <Link href="/login" className="text-blue-600 hover:underline text-sm">
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}
              <p className="text-sm text-slate-600">
                가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '전송 중...' : '재설정 링크 전송'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                <Link href="/login" className="text-blue-600 hover:underline">
                  로그인으로 돌아가기
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
