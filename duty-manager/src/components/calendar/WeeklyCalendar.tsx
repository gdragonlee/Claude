'use client';

import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, eachDayOfInterval, isSameMonth } from 'date-fns';
import type { DutySchedule } from '@/lib/types';
import { formatDate, isToday } from '@/lib/utils/date';
import { getHolidaysForYear } from '@/lib/utils/holidays';
import { SHIFT_LABELS, SHIFT_COLORS, WEEKDAYS, OFF_DUTY_TYPES, OFF_DUTY_SORT_ORDER } from '@/lib/utils/constants';
import { clsx } from 'clsx';
import Button from '../ui/Button';

interface WeeklyCalendarProps {
  year: number;
  month: number;
  weekOffset: number;
  schedules: DutySchedule[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onThisWeek: () => void;
  onDayClick: (date: string) => void;
}

export default function WeeklyCalendar({
  year,
  month,
  weekOffset,
  schedules,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onDayClick,
}: WeeklyCalendarProps) {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('weekly-expanded') === 'true';
    }
    return false;
  });

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    sessionStorage.setItem('weekly-expanded', String(next));
  };
  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const holidays = useMemo(() => {
    const years = new Set(weekDays.map((d) => d.getFullYear()));
    const merged = new Map<string, string>();
    for (const y of years) {
      for (const [k, v] of getHolidaysForYear(y)) merged.set(k, v);
    }
    return merged;
  }, [weekStart.getTime()]);

  // 부재 일정만 필터 (당직오프, 연차, 연구, 학회)
  const offSchedules = useMemo(() => {
    const weekDates = new Set(weekDays.map((d) => formatDate(d, 'yyyy-MM-dd')));
    return schedules.filter(
      (s) => weekDates.has(s.date) && OFF_DUTY_TYPES.includes(s.shiftType)
    );
  }, [schedules, weekStart.getTime()]);

  // 월간 달력 날짜 배열
  const monthDays = useMemo(() => {
    const mStart = startOfMonth(new Date(year, month));
    const mEnd = endOfMonth(mStart);
    const calStart = startOfWeek(mStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(mEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [year, month]);

  const monthHolidays = useMemo(() => getHolidaysForYear(year), [year]);

  const sortOff = (list: DutySchedule[]) =>
    [...list].sort((a, b) => (OFF_DUTY_SORT_ORDER[a.shiftType] ?? 99) - (OFF_DUTY_SORT_ORDER[b.shiftType] ?? 99));

  const getOffForDate = (date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return sortOff(offSchedules.filter((s) => s.date === dateStr));
  };

  const getMonthOffForDate = (date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return sortOff(schedules.filter((s) => s.date === dateStr && OFF_DUTY_TYPES.includes(s.shiftType)));
  };

  const weekLabel = `${formatDate(weekStart, 'M/d')} ~ ${formatDate(weekEnd, 'M/d')}`;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">
            부재 현황
          </h3>
          <span className="text-xs text-slate-400">
            {expanded ? `${year}년 ${month + 1}월` : weekLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!expanded && (
            <>
              <Button variant="ghost" size="sm" onClick={onPrevWeek}>&lsaquo;</Button>
              {weekOffset !== 0 && (
                <Button variant="outline" size="sm" onClick={onThisWeek}>이번주</Button>
              )}
              <Button variant="ghost" size="sm" onClick={onNextWeek}>&rsaquo;</Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="ml-1 text-slate-400"
          >
            {expanded ? '접기 ▲' : '월간 ▼'}
          </Button>
        </div>
      </div>

      {!expanded ? (
        <>
          {/* 주간: 요일 헤더 */}
          <div className="grid grid-cols-7 bg-slate-50">
            {weekDays.map((date, i) => {
              const dayOfWeek = date.getDay();
              const holidayName = holidays.get(formatDate(date, 'yyyy-MM-dd'));
              const isRedDay = dayOfWeek === 0 || !!holidayName;
              const isTodayDate = isToday(date);

              return (
                <div
                  key={i}
                  className={clsx(
                    'py-2 text-center border-r last:border-r-0 border-slate-100',
                    isTodayDate && 'bg-blue-50'
                  )}
                >
                  <div className={clsx(
                    'text-[10px] font-medium',
                    isRedDay ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-slate-400'
                  )}>
                    {WEEKDAYS[dayOfWeek]}
                  </div>
                  <div
                    className={clsx(
                      'text-sm font-semibold mt-0.5',
                      isTodayDate && 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs',
                      !isTodayDate && isRedDay && 'text-red-500',
                      !isTodayDate && !isRedDay && dayOfWeek === 6 && 'text-blue-500',
                      !isTodayDate && !isRedDay && dayOfWeek !== 6 && 'text-slate-700'
                    )}
                  >
                    {date.getDate()}
                  </div>
                  {holidayName && (
                    <div className="text-[8px] text-red-400 truncate px-0.5 leading-tight mt-0.5">
                      {holidayName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 주간: 부재 일정 */}
          <div className="grid grid-cols-7 min-h-[60px]">
            {weekDays.map((date, i) => {
              const dayOff = getOffForDate(date);
              const isTodayDate = isToday(date);
              const dateStr = formatDate(date, 'yyyy-MM-dd');

              return (
                <div
                  key={i}
                  onClick={() => onDayClick(dateStr)}
                  className={clsx(
                    'border-r last:border-r-0 border-slate-100 p-1 cursor-pointer hover:bg-slate-50 transition-colors',
                    isTodayDate && 'bg-blue-50/40'
                  )}
                >
                  {dayOff.length === 0 ? (
                    <div className="text-[9px] text-slate-300 text-center mt-2">-</div>
                  ) : (
                    <div className="space-y-0.5">
                      {dayOff.map((s) => {
                        const color = SHIFT_COLORS[s.shiftType] || SHIFT_COLORS.leave;
                        return (
                          <div
                            key={s.id}
                            className={clsx(
                              'text-[9px] leading-tight px-1 py-0.5 rounded truncate',
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
        </>
      ) : (
        /* 월간: 달력 그리드 */
        <>
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
              const holidayName = monthHolidays.get(dateStr);
              const isRedDay = dayOfWeek === 0 || !!holidayName;
              const dayOff = isCurrentMonth ? getMonthOffForDate(date) : [];

              return (
                <div
                  key={i}
                  onClick={() => onDayClick(dateStr)}
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
        </>
      )}
    </div>
  );
}
