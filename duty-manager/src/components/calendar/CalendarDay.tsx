'use client';

import type { DutySchedule } from '@/lib/types';
import { isToday } from '@/lib/utils/date';
import { POSITION_COLORS, SHIFT_LABELS, OFF_DUTY_TYPES } from '@/lib/utils/constants';
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

function OffDutyByPosition({ schedules }: { schedules: DutySchedule[] }) {
  const byPosition: Record<string, { total: number; types: Record<string, number> }> = {};

  for (const s of schedules) {
    const pos = s.user?.position || '미지정';
    if (!byPosition[pos]) byPosition[pos] = { total: 0, types: {} };
    byPosition[pos].total++;
    byPosition[pos].types[s.shiftType] = (byPosition[pos].types[s.shiftType] || 0) + 1;
  }

  return (
    <div className="space-y-px">
      {Object.entries(byPosition).map(([pos, data]) => {
        const isProf = pos === '교수';
        return (
          <div key={pos} className={clsx('text-[9px] leading-tight', isProf ? 'text-emerald-500' : 'text-amber-500')}>
            {pos} -{data.total}
            <span className={clsx('ml-0.5', isProf ? 'text-emerald-400' : 'text-amber-400')}>
              ({Object.entries(data.types).map(([t, c]) => `${SHIFT_LABELS[t]}${c}`).join(' ')})
            </span>
          </div>
        );
      })}
    </div>
  );
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

  const dutySchedules = schedules.filter((s) => s.shiftType === 'duty');
  const offSchedules = schedules.filter((s) => OFF_DUTY_TYPES.includes(s.shiftType));

  return (
    <div
      onClick={onClick}
      className={clsx(
        'border border-slate-200 cursor-pointer transition-colors hover:bg-slate-50',
        compact ? 'min-h-[60px] p-1' : 'min-h-[110px] p-2',
        !isCurrentMonth && 'bg-slate-50/50 text-slate-300',
        today && 'bg-blue-50/60',
        holidayName && isCurrentMonth && !today && 'bg-red-50/40'
      )}
    >
      <div className="flex items-center gap-1">
        <div
          className={clsx(
            'text-sm font-medium',
            today && 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs',
            !today && isRedDay && isCurrentMonth && 'text-red-500',
            !today && !isRedDay && dayOfWeek === 6 && isCurrentMonth && 'text-blue-500'
          )}
        >
          {dayNum}
        </div>
        {!compact && holidayName && isCurrentMonth && (
          <span className="text-[10px] text-red-400 truncate leading-tight">
            {holidayName}
          </span>
        )}
      </div>

      {!compact && isCurrentMonth && (
        <div className="mt-1 space-y-0.5">
          {/* 당직자 일렬 표시 */}
          {dutySchedules.length > 0 && (
            <div className="flex flex-wrap gap-0.5">
              {dutySchedules.map((s) => (
                <DutyBadge key={s.id} schedule={s} inline />
              ))}
            </div>
          )}
          {/* 부재 인원: 교수/전공의 분리 */}
          {offSchedules.length > 0 && (
            <OffDutyByPosition schedules={offSchedules} />
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
                const pos = s.user?.position || '';
                const dotColor = POSITION_COLORS[pos]?.dot || 'bg-slate-400';
                return (
                  <div
                    key={s.id}
                    className={clsx('w-1.5 h-1.5 rounded-full', dotColor)}
                  />
                );
              })}
            </div>
          )}
          {offSchedules.length > 0 && (
            <div className="text-[8px] text-orange-400 leading-none">
              -{offSchedules.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
