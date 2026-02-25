'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { updateUserRole } from '@/lib/api/auth';
import { toggleUserActive } from '@/lib/api/users';
import { useAllUsers } from '@/lib/hooks/useUsers';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const { users, mutate } = useAllUsers();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const handleRoleToggle = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateUserRole(id, newRole as 'admin' | 'user');
    addToast(`역할이 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경되었습니다.`, 'success');
    mutate();
  };

  const handleActiveToggle = async (id: string) => {
    await toggleUserActive(id);
    addToast('상태가 변경되었습니다.', 'success');
    mutate();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">사용자 관리</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">이름</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">이메일</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">직급</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">역할</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">상태</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">{u.position || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'admin' ? 'blue' : 'slate'}>
                      {u.role === 'admin' ? '관리자' : '사용자'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'green' : 'red'}>
                      {u.isActive ? '활성' : '비활성'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {u.id !== user.id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleToggle(u.id, u.role)}
                          >
                            {u.role === 'admin' ? '사용자로' : '관리자로'}
                          </Button>
                          <Button
                            size="sm"
                            variant={u.isActive ? 'danger' : 'success'}
                            onClick={() => handleActiveToggle(u.id)}
                          >
                            {u.isActive ? '비활성화' : '활성화'}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
