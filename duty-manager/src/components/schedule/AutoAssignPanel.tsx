'use client';

import { useState } from 'react';
import type { Profile, AutoAssignOptions } from '@/lib/types';
import Button from '../ui/Button';

interface AutoAssignPanelProps {
  year: number;
  month: number;
  users: Profile[];
  onGenerate: (options: AutoAssignOptions) => Promise<void>;
  onClearMonth: () => Promise<void>;
}

export default function AutoAssignPanel({
  users,
  onGenerate,
  onClearMonth,
}: AutoAssignPanelProps) {
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  const [excludeUserIds, setExcludeUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate({ excludeWeekends, excludeHolidays, excludeUserIds });
    } finally {
      setLoading(false);
    }
  };

  const toggleExcludeUser = (userId: string) => {
    setExcludeUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-4 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={excludeWeekends}
            onChange={(e) => setExcludeWeekends(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          주말 제외
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={excludeHolidays}
            onChange={(e) => setExcludeHolidays(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          공휴일 제외
        </label>
        <Button variant="success" onClick={handleGenerate} disabled={loading || users.length === 0}>
          {loading ? '배정 중...' : '당직 자동 배정'}
        </Button>
        <Button variant="outline" onClick={onClearMonth}>
          이달 초기화
        </Button>
      </div>

      {users.length === 0 ? (
        <span className="text-xs text-amber-600">등록된 사용자가 없습니다.</span>
      ) : (
        <div>
          <p className="text-xs text-slate-500 mb-2">제외할 사용자 (선택)</p>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <label
                key={u.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                  excludeUserIds.includes(u.id)
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={excludeUserIds.includes(u.id)}
                  onChange={() => toggleExcludeUser(u.id)}
                  className="sr-only"
                />
                {u.name} {u.position ? `(${u.position})` : ''}
                {excludeUserIds.includes(u.id) && (
                  <span className="text-red-400">x</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
