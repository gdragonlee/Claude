'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedules } from '@/lib/hooks/useSchedules';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar';

export default function CalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = sessionStorage.getItem('calendar-month');
    if (saved) {
      const [y, m] = saved.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && (y !== year || m !== month)) {
        setYear(y);
        setMonth(m);
      }
    }
  }, []);
  const [weekOffset, setWeekOffset] = useState(0);
  const { schedules } = useSchedules(year, month);

  // 주간 달력이 월 경계를 넘을 수 있으므로 인접 월 데이터도 가져옴
  const weekTarget = addWeeks(now, weekOffset);
  const weekStart = startOfWeek(weekTarget, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekTarget, { weekStartsOn: 0 });

  const needPrevMonth = weekStart.getMonth() !== month || weekStart.getFullYear() !== year;
  const needNextMonth = weekEnd.getMonth() !== month || weekEnd.getFullYear() !== year;

  const prevMonthVal = month === 0 ? 11 : month - 1;
  const prevYearVal = month === 0 ? year - 1 : year;
  const nextMonthVal = month === 11 ? 0 : month + 1;
  const nextYearVal = month === 11 ? year + 1 : year;

  const { schedules: prevSchedules } = useSchedules(
    needPrevMonth ? prevYearVal : year,
    needPrevMonth ? prevMonthVal : month
  );
  const { schedules: nextSchedules } = useSchedules(
    needNextMonth ? nextYearVal : year,
    needNextMonth ? nextMonthVal : month
  );

  // 주간 달력용 통합 스케줄
  const weeklySchedules = useMemo(() => {
    if (!needPrevMonth && !needNextMonth) return schedules;
    const map = new Map<string, typeof schedules[0]>();
    for (const s of schedules) map.set(s.id, s);
    if (needPrevMonth) for (const s of prevSchedules) map.set(s.id, s);
    if (needNextMonth) for (const s of nextSchedules) map.set(s.id, s);
    return Array.from(map.values());
  }, [schedules, prevSchedules, nextSchedules, needPrevMonth, needNextMonth]);

  const saveCalendarMonth = (y: number, m: number) => {
    sessionStorage.setItem('calendar-month', `${y}-${m}`);
  };

  const goNext = useCallback(() => {
    const newYear = month === 11 ? year + 1 : year;
    const newMonth = month === 11 ? 0 : month + 1;
    setYear(newYear); setMonth(newMonth);
    saveCalendarMonth(newYear, newMonth);
  }, [year, month]);

  const goPrev = useCallback(() => {
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? 11 : month - 1;
    setYear(newYear); setMonth(newMonth);
    saveCalendarMonth(newYear, newMonth);
  }, [year, month]);

  const goToday = () => {
    const y = now.getFullYear();
    const m = now.getMonth();
    setYear(y); setMonth(m);
    saveCalendarMonth(y, m);
  };

  // 스와이프 핸들링
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) goPrev();
      else goNext();
    }
  }, [goPrev, goNext]);

  return (
    <div className="space-y-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <CalendarHeader
        year={year}
        month={month}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />
      <CalendarGrid
        year={year}
        month={month}
        schedules={schedules}
        onDayClick={(date) => router.push(`/schedule/${date}`)}
      />
      <WeeklyCalendar
        year={year}
        month={month}
        weekOffset={weekOffset}
        schedules={weeklySchedules}
        onPrevWeek={() => setWeekOffset(weekOffset - 1)}
        onNextWeek={() => setWeekOffset(weekOffset + 1)}
        onThisWeek={() => setWeekOffset(0)}
        onDayClick={(date) => router.push(`/schedule/${date}`)}
      />
    </div>
  );
}
