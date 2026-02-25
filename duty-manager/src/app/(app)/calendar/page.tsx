'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedules } from '@/lib/hooks/useSchedules';
import { useToast } from '@/lib/context/ToastContext';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import AutoAssignPanel from '@/components/schedule/AutoAssignPanel';
import { bulkCreateSchedules, deleteSchedulesByMonth } from '@/lib/api/schedules';
import { useUsers } from '@/lib/hooks/useUsers';
import type { AutoAssignOptions } from '@/lib/types';

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { schedules, mutate } = useSchedules(year, month);
  const { users } = useUsers();

  const goNext = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const goPrev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const handleGenerate = useCallback(async (options: AutoAssignOptions) => {
    try {
      const created = await bulkCreateSchedules(year, month, options);
      addToast(`${created.length}건의 당직이 배정되었습니다.`, 'success');
      mutate();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '자동 배정 실패', 'error');
    }
  }, [year, month, addToast, mutate]);

  const handleClearMonth = useCallback(async () => {
    if (!confirm('이번 달 모든 당직을 초기화하시겠습니까?')) return;
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    await deleteSchedulesByMonth(monthKey);
    addToast('이번 달 일정이 초기화되었습니다.', 'success');
    mutate();
  }, [year, month, addToast, mutate]);

  return (
    <div>
      <CalendarHeader
        year={year}
        month={month}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />
      {user?.role === 'admin' && (
        <AutoAssignPanel
          year={year}
          month={month}
          users={users}
          onGenerate={handleGenerate}
          onClearMonth={handleClearMonth}
        />
      )}
      <CalendarGrid
        year={year}
        month={month}
        schedules={schedules}
        onDayClick={(date) => router.push(`/schedule/${date}`)}
      />
    </div>
  );
}
