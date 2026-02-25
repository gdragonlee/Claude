'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { POSITION_OPTIONS } from '@/lib/utils/constants';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [position, setPosition] = useState(user?.position || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, position, phone });
      addToast('프로필이 업데이트되었습니다.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '업데이트 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">프로필 설정</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.name[0]}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <Badge variant={user.role === 'admin' ? 'blue' : 'slate'}>
              {user.role === 'admin' ? '관리자' : '일반 사용자'}
            </Badge>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">직급</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-0000-0000"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </form>
      </div>
    </div>
  );
}
