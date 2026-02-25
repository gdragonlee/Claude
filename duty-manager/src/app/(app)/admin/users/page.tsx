'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { updateUserRole } from '@/lib/api/auth';
import { toggleUserActive, deleteUser, updateUserPosition } from '@/lib/api/users';
import { useAllUsers } from '@/lib/hooks/useUsers';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { POSITION_OPTIONS } from '@/lib/utils/constants';
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

  const handlePositionChange = async (id: string, position: string) => {
    try {
      await updateUserPosition(id, position || null);
      addToast('직급이 변경되었습니다.', 'success');
      mutate();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '직급 변경에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 사용자를 삭제하시겠습니까?\n관련된 당직 일정, 알림 등 모든 데이터가 함께 삭제됩니다.`)) return;
    try {
      await deleteUser(id);
      addToast(`${name} 사용자가 삭제되었습니다.`, 'success');
      mutate();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '삭제에 실패했습니다.', 'error');
    }
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
                  <td className="px-4 py-3">
                    <select
                      value={u.position || ''}
                      onChange={(e) => handlePositionChange(u.id, e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">미지정</option>
                      {POSITION_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </td>
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
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(u.id, u.name)}
                          >
                            삭제
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
