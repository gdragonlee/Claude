'use client';

import type { DutySchedule } from '@/lib/types';
import { isToday } from '@/lib/utils/date';
import { POSITION_COLORS } from '@/lib/utils/constants';
import { clsx } from 'clsx';
import DutyBadge from './DutyBadge';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  schedules: DutySchedule[];
  holidayName: string | null;
  onClick: () => void;
  compact?: boolean;
}

export default function CalendarDay({
  date,
  isCurrentMonth,
  schedules,
  holidayName,
  onClick,
  compact,
}: CalendarDayProps) {
  const today = isToday(date);
  const dayOfWeek = date.getDay();
  const dayNum = date.getDate();
  const isRedDay = dayOfWeek === 0 || !!holidayName;

  const dutySchedules = schedules.filter((s) => s.shiftType === 'duty' || s.shiftType === 'night_duty');

  return (
    <div
      onClick={onClick}
      className={clsx(
        'border border-slate-200 cursor-pointer transition-colors hover:bg-slate-50',
        compact ? 'min-h-[60px] p-1' : 'min-h-[110px] lg:min-h-[130px] p-2',
        !isCurrentMonth && 'bg-slate-50/50 text-slate-300',
        today && 'bg-blue-50/60',
        holidayName && isCurrentMonth && !today && 'bg-red-50/40'
      )}
    >
      <div className="flex items-center gap-1">
        <div
          className={clsx(
            'text-sm lg:text-base font-medium',
            today && 'bg-blue-600 text-white w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs lg:text-sm',
            !today && isRedDay && isCurrentMonth && 'text-red-500',
            !today && !isRedDay && dayOfWeek === 6 && isCurrentMonth && 'text-blue-500'
          )}
        >
          {dayNum}
        </div>
        {!compact && holidayName && isCurrentMonth && (
          <span className="text-[10px] lg:text-xs text-red-400 truncate leading-tight">
            {holidayName}
          </span>
        )}
      </div>

      {!compact && isCurrentMonth && (
        <div className="mt-1 space-y-0.5">
          {/* 당직/백당만 표시 */}
          {dutySchedules.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {dutySchedules.map((s) => (
                <DutyBadge key={s.id} schedule={s} inline />
              ))}
            </div>
          )}
        </div>
      )}

      {compact && isCurrentMonth && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {holidayName && (
            <div className="w-full h-0.5 rounded-full bg-red-300" />
          )}
          {dutySchedules.length > 0 && (
            <div className="flex gap-0.5">
              {dutySchedules.slice(0, 4).map((s) => {
                const isNightDuty = s.shiftType === 'night_duty';
                const pos = s.user?.position || '';
                const dotColor = isNightDuty ? 'bg-indigo-500' : (POSITION_COLORS[pos]?.dot || 'bg-slate-400');
                return (
                  <div
                    key={s.id}
                    className={clsx('w-1.5 h-1.5 rounded-full', dotColor)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
