'use client';

import { formatMonthTitle } from '@/lib/utils/date';
import Button from '../ui/Button';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function CalendarHeader({ year, month, onPrev, onNext, onToday }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-slate-800">
        {formatMonthTitle(year, month)}
      </h2>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev}>
          &laquo; 이전
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          오늘
        </Button>
        <Button variant="outline" size="sm" onClick={onNext}>
          다음 &raquo;
        </Button>
      </div>
    </div>
  );
}
