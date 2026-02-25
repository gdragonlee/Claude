'use client';

import { useMemo } from 'react';
import type { DutySchedule } from '@/lib/types';
import { getCalendarDays, formatDate, isSameMonthCheck } from '@/lib/utils/date';
import { getHolidaysForYear } from '@/lib/utils/holidays';
import { WEEKDAYS } from '@/lib/utils/constants';
import CalendarDay from './CalendarDay';

interface CalendarGridProps {
  year: number;
  month: number;
  schedules: DutySchedule[];
  onDayClick: (date: string) => void;
  compact?: boolean;
}

export default function CalendarGrid({
  year,
  month,
  schedules,
  onDayClick,
  compact,
}: CalendarGridProps) {
  const days = getCalendarDays(year, month);
  const holidays = useMemo(() => getHolidaysForYear(year), [year]);

  const getSchedulesForDate = (date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return schedules.filter((s) => s.date === dateStr);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div className="grid grid-cols-7 bg-slate-100">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2.5 text-center text-xs font-semibold ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => (
          <CalendarDay
            key={date.toISOString()}
            date={date}
            isCurrentMonth={isSameMonthCheck(date, year, month)}
            schedules={getSchedulesForDate(date)}
            holidayName={holidays.get(formatDate(date, 'yyyy-MM-dd')) || null}
            onClick={() => onDayClick(formatDate(date, 'yyyy-MM-dd'))}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
