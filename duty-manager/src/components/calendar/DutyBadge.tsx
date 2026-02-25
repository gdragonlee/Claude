import type { DutySchedule } from '@/lib/types';
import { SHIFT_LABELS, SHIFT_COLORS, POSITION_COLORS } from '@/lib/utils/constants';
import { clsx } from 'clsx';

interface DutyBadgeProps {
  schedule: DutySchedule;
  showName?: boolean;
  inline?: boolean;
}

const DEFAULT_POS_COLOR = { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };

export default function DutyBadge({ schedule, showName = true, inline }: DutyBadgeProps) {
  const label = SHIFT_LABELS[schedule.shiftType] || schedule.shiftType;
  const position = schedule.user?.position || '';
  const userName = schedule.user?.name || '미지정';
  const isDuty = schedule.shiftType === 'duty';

  // 당직: 직급별 색상, 부재: 근무구분별 색상
  const posColor = POSITION_COLORS[position] || DEFAULT_POS_COLOR;
  const shiftColor = SHIFT_COLORS[schedule.shiftType] || SHIFT_COLORS.duty;

  if (inline) {
    if (isDuty) {
      return (
        <span
          className={clsx(
            'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap',
            posColor.bg,
            posColor.text
          )}
          title={`${label} - ${userName} (${position || '미지정'})`}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', posColor.dot)} />
          {userName}
        </span>
      );
    }
    // 부재 (연차/연구/학회)
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap',
          shiftColor.bg,
          shiftColor.text
        )}
        title={`${label} - ${userName}`}
      >
        {label} {userName}
      </span>
    );
  }

  // 블록 모드
  const bg = isDuty ? posColor.bg : shiftColor.bg;
  const text = isDuty ? posColor.text : shiftColor.text;

  return (
    <div
      className={clsx('text-[11px] px-1.5 py-0.5 rounded mb-0.5 truncate cursor-pointer', bg, text)}
      title={`${label} - ${userName} (${position || '미지정'})`}
    >
      {showName ? `${label} ${userName}` : label}
    </div>
  );
}
