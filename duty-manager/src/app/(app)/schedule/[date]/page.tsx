'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useSchedules } from '@/lib/hooks/useSchedules';
import DutyForm from '@/components/schedule/DutyForm';
import Button from '@/components/ui/Button';
import { createSchedule, deleteSchedule } from '@/lib/api/schedules';
import { useUsers } from '@/lib/hooks/useUsers';
import type { CreateScheduleDTO } from '@/lib/types';
import { parseISO } from '@/lib/utils/date';

export default function ScheduleDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const parsed = parseISO(date);
  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const { schedules, mutate } = useSchedules(year, month);
  const { users } = useUsers();

  const daySchedules = schedules.filter((s) => s.date === date);

  const handleSave = async (data: CreateScheduleDTO) => {
    try {
      await createSchedule(data);
      addToast('당직이 배정되었습니다.', 'success');
      mutate();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '저장 실패', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 당직을 삭제하시겠습니까?')) return;
    await deleteSchedule(id);
    addToast('당직이 삭제되었습니다.', 'success');
    mutate();
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          &larr; 뒤로
        </Button>
        <h1 className="text-lg font-bold">{date} 당직</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <DutyForm
          date={date}
          existingSchedules={daySchedules}
          users={users}
          currentUser={user}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
