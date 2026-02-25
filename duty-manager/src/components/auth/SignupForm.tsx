'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { POSITION_OPTIONS } from '@/lib/utils/constants';
import Button from '../ui/Button';

export default function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    position: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        position: form.position || undefined,
        phone: form.phone || undefined,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">이름 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="홍길동"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">이메일 *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="example@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 *</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="6자 이상"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호 확인 *</label>
        <input
          type="password"
          value={form.passwordConfirm}
          onChange={(e) => update('passwordConfirm', e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">직급</label>
        <select
          value={form.position}
          onChange={(e) => update('position', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택</option>
          {POSITION_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="010-0000-0000"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '가입 중...' : '회원가입'}
      </Button>
      <p className="text-center text-sm text-slate-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
