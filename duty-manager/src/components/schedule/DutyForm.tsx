'use client';

import { useState, useMemo } from 'react';
import type { DutySchedule, Profile, CreateScheduleDTO, ShiftType, RepeatPattern } from '@/lib/types';
import { SHIFT_LABELS } from '@/lib/utils/constants';
import Button from '../ui/Button';
import DutyBadge from '../calendar/DutyBadge';

const REPEAT_LABELS: Record<RepeatPattern, string> = {
  daily: '매일',
  weekly: '매주',
  biweekly: '격주',
  custom: 'N주 간격',
};

interface DutyFormProps {
  date: string;
  existingSchedules: DutySchedule[];
  users: Profile[];
  currentUser: Profile;
  onSave: (data: CreateScheduleDTO) => Promise<void>;
  onBulkSave?: (startDate: string, endDate: string, userId: string, shiftType: ShiftType, note?: string, repeatPattern?: RepeatPattern, weekInterval?: number) => Promise<number>;
  onDelete: (id: string) => Promise<void>;
  onDeleteGroup?: (groupId: string) => Promise<void>;
}

export default function DutyForm({
  date,
  existingSchedules,
  users,
  currentUser,
  onSave,
  onBulkSave,
  onDelete,
  onDeleteGroup,
}: DutyFormProps) {
  const isAdmin = currentUser.role === 'admin';
  const [userId, setUserId] = useState(isAdmin ? '' : currentUser.id);
  const [shiftType, setShiftType] = useState<ShiftType>('duty');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [consecutive, setConsecutive] = useState(false);
  const [endDate, setEndDate] = useState(date);
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>('daily');
  const [weekInterval, setWeekInterval] = useState(3);

  const entryCount = useMemo(() => {
    if (!consecutive || !endDate || endDate <= date) return 1;
    const start = new Date(date + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (repeatPattern === 'daily') return totalDays;
    const interval = repeatPattern === 'weekly' ? 1 : repeatPattern === 'biweekly' ? 2 : weekInterval;
    return Math.floor((totalDays - 1) / (7 * interval)) + 1;
  }, [date, endDate, consecutive, repeatPattern, weekInterval]);

  const handleAdd = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (consecutive && onBulkSave && endDate > date) {
        await onBulkSave(date, endDate, userId, shiftType, note || undefined, repeatPattern, weekInterval);
      } else {
        await onSave({ date, userId, shiftType, note: note || undefined });
      }
      setUserId(isAdmin ? '' : currentUser.id);
      setNote('');
      setConsecutive(false);
      setEndDate(date);
      setRepeatPattern('daily');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schedule: DutySchedule) => {
    if (!schedule.groupId || !onDeleteGroup) {
      if (!confirm('이 일정을 삭제하시겠습니까?')) return;
      await onDelete(schedule.id);
      return;
    }

    const choice = prompt(
      '삭제 범위를 선택하세요:\n1 - 이 항목만 삭제\n2 - 연결된 전체 일정 삭제\n\n번호를 입력하세요:',
      '1'
    );
    if (choice === '1') {
      await onDelete(schedule.id);
    } else if (choice === '2') {
      await onDeleteGroup(schedule.groupId);
    }
  };

  const canEdit = (schedule: DutySchedule) =>
    isAdmin || schedule.userId === currentUser.id;

  const dutySchedules = existingSchedules
    .filter((s) => s.shiftType === 'duty' || s.shiftType === 'night_duty')
    .sort((a, b) => (a.shiftType === 'duty' ? 0 : 1) - (b.shiftType === 'duty' ? 0 : 1));
  const offSchedules = existingSchedules.filter((s) => s.shiftType !== 'duty' && s.shiftType !== 'night_duty');

  const buttonText = useMemo(() => {
    if (loading) return '저장 중...';
    if (!consecutive || entryCount <= 1) return '추가';
    if (repeatPattern === 'daily') return `${entryCount}일 연속 추가`;
    return `${entryCount}회 반복 추가`;
  }, [loading, consecutive, entryCount, repeatPattern]);

  return (
    <div className="space-y-4">
      {/* 당직 일정 */}
      {dutySchedules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-600">당직 배정</h4>
          {dutySchedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <DutyBadge schedule={s} />
                {s.note && <span className="text-xs text-slate-400">({s.note})</span>}
                {s.groupId && <span className="text-[10px] text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">반복</span>}
              </div>
              {canEdit(s) && (
                <Button variant="danger" size="sm" onClick={() => handleDelete(s)}>
                  삭제
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 부재 일정 */}
      {offSchedules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-orange-600">부재 ({offSchedules.length}명)</h4>
          {offSchedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-orange-50/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <DutyBadge schedule={s} />
                {s.note && <span className="text-xs text-slate-400">({s.note})</span>}
                {s.groupId && <span className="text-[10px] text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">반복</span>}
              </div>
              {canEdit(s) && (
                <Button variant="danger" size="sm" onClick={() => handleDelete(s)}>
                  삭제
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 일정 추가 */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-medium text-slate-600">일정 추가</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">근무 구분</label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value as ShiftType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(SHIFT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">배정 인원</label>
            {isAdmin ? (
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.position ? `(${u.position})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700">
                {currentUser.name} (본인)
              </div>
            )}
          </div>
        </div>
        {onBulkSave && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={consecutive}
                onChange={(e) => {
                  setConsecutive(e.target.checked);
                  if (!e.target.checked) {
                    setEndDate(date);
                    setRepeatPattern('daily');
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              반복/연속 입력
            </label>
            {consecutive && (
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">시작일</label>
                    <input
                      type="date"
                      value={date}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">종료일</label>
                    <input
                      type="date"
                      value={endDate}
                      min={date}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">반복 패턴</label>
                    <select
                      value={repeatPattern}
                      onChange={(e) => setRepeatPattern(e.target.value as RepeatPattern)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(REPEAT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  {repeatPattern === 'custom' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">주 간격</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={weekInterval}
                        onChange={(e) => setWeekInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                {entryCount > 1 && (
                  <p className="text-xs text-blue-600">
                    {repeatPattern === 'daily'
                      ? `${entryCount}일 연속 생성됩니다.`
                      : `${entryCount}회 반복 생성됩니다.`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <div>
          <label className="block text-xs text-slate-500 mb-1">메모</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="메모 (선택)"
          />
        </div>
        <Button onClick={handleAdd} disabled={!userId || loading} className="w-full">
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
