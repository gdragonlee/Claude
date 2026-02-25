'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { useSchedules } from '@/lib/hooks/useSchedules';
import { formatDate, isToday } from '@/lib/utils/date';
import { getHolidaysForYear } from '@/lib/utils/holidays';
import { SHIFT_LABELS, SHIFT_COLORS, WEEKDAYS, OFF_DUTY_TYPES, OFF_DUTY_SORT_ORDER } from '@/lib/utils/constants';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import type { DutySchedule } from '@/lib/types';

export default function AbsencePage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { schedules } = useSchedules(year, month);

  const goNext = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };
  const goPrev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const monthDays = useMemo(() => {
    const mStart = startOfMonth(new Date(year, month));
    const mEnd = endOfMonth(mStart);
    const calStart = startOfWeek(mStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(mEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [year, month]);

  const holidays = useMemo(() => getHolidaysForYear(year), [year]);

  const sortOff = (list: DutySchedule[]) =>
    [...list].sort((a, b) => (OFF_DUTY_SORT_ORDER[a.shiftType] ?? 99) - (OFF_DUTY_SORT_ORDER[b.shiftType] ?? 99));

  const getOffForDate = (date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return sortOff(schedules.filter((s) => s.date === dateStr && OFF_DUTY_TYPES.includes(s.shiftType)));
  };

  const LEGEND = [
    { type: 'conference', label: '학회' },
    { type: 'leave', label: '연차' },
    { type: 'duty_off', label: '당직오프' },
    { type: 'research', label: '연구' },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">부재 현황</h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goPrev}>&lsaquo;</Button>
          <span className="text-sm font-semibold min-w-[100px] text-center">
            {year}년 {month + 1}월
          </span>
          <Button variant="ghost" size="sm" onClick={goNext}>&rsaquo;</Button>
          {(year !== now.getFullYear() || month !== now.getMonth()) && (
            <Button variant="outline" size="sm" onClick={goToday}>이번달</Button>
          )}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-slate-500">
        {LEGEND.map((item) => {
          const color = SHIFT_COLORS[item.type];
          return (
            <span key={item.type} className="flex items-center gap-1">
              <span className={clsx('w-2.5 h-2.5 rounded-sm', color.bg)} />
              {item.label}
            </span>
          );
        })}
      </div>

      {/* 월간 달력 */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <div className="grid grid-cols-7 bg-slate-50">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={clsx(
                'py-2 text-center text-[10px] font-medium',
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'
              )}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDays.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, new Date(year, month));
            const dayOfWeek = date.getDay();
            const isTodayDate = isToday(date);
            const dateStr = formatDate(date, 'yyyy-MM-dd');
            const holidayName = holidays.get(dateStr);
            const isRedDay = dayOfWeek === 0 || !!holidayName;
            const dayOff = isCurrentMonth ? getOffForDate(date) : [];

            return (
              <div
                key={i}
                onClick={() => router.push(`/schedule/${dateStr}`)}
                className={clsx(
                  'border border-slate-100 min-h-[70px] p-1 cursor-pointer transition-colors hover:bg-slate-50',
                  !isCurrentMonth && 'bg-slate-50/50 text-slate-300',
                  isTodayDate && 'bg-blue-50/60',
                  holidayName && isCurrentMonth && !isTodayDate && 'bg-red-50/30'
                )}
              >
                <div className="flex items-center gap-0.5">
                  <div
                    className={clsx(
                      'text-xs font-medium',
                      isTodayDate && 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]',
                      !isTodayDate && isRedDay && isCurrentMonth && 'text-red-500',
                      !isTodayDate && !isRedDay && dayOfWeek === 6 && isCurrentMonth && 'text-blue-500',
                      !isTodayDate && !isCurrentMonth && 'text-slate-300'
                    )}
                  >
                    {date.getDate()}
                  </div>
                  {holidayName && isCurrentMonth && (
                    <span className="text-[7px] text-red-400 truncate leading-tight">{holidayName}</span>
                  )}
                </div>
                {dayOff.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {dayOff.map((s) => {
                      const color = SHIFT_COLORS[s.shiftType] || SHIFT_COLORS.leave;
                      return (
                        <div
                          key={s.id}
                          className={clsx(
                            'text-[8px] leading-tight px-1 py-0.5 rounded truncate',
                            color.bg,
                            color.text
                          )}
                          title={`${SHIFT_LABELS[s.shiftType]} - ${s.user?.name || '미지정'} (${s.user?.position || ''})`}
                        >
                          {s.user?.name || '미지정'}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
