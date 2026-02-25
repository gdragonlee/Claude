'use client';

import { useState } from 'react';
import type { DutySchedule, Profile, CreateScheduleDTO, ShiftType } from '@/lib/types';
import { SHIFT_LABELS } from '@/lib/utils/constants';
import Button from '../ui/Button';
import DutyBadge from '../calendar/DutyBadge';

interface DutyFormProps {
  date: string;
  existingSchedules: DutySchedule[];
  users: Profile[];
  currentUser: Profile;
  onSave: (data: CreateScheduleDTO) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function DutyForm({
  date,
  existingSchedules,
  users,
  currentUser,
  onSave,
  onDelete,
}: DutyFormProps) {
  const [userId, setUserId] = useState('');
  const [shiftType, setShiftType] = useState<ShiftType>('duty');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  const handleAdd = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await onSave({ date, userId, shiftType, note: note || undefined });
      setUserId('');
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = (schedule: DutySchedule) =>
    isAdmin || schedule.userId === currentUser.id;

  const dutySchedules = existingSchedules.filter((s) => s.shiftType === 'duty');
  const offSchedules = existingSchedules.filter((s) => s.shiftType !== 'duty');

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
              </div>
              {canEdit(s) && (
                <Button variant="danger" size="sm" onClick={() => onDelete(s.id)}>
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
              </div>
              {canEdit(s) && (
                <Button variant="danger" size="sm" onClick={() => onDelete(s.id)}>
                  삭제
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 일정 추가 (관리자만) */}
      {isAdmin && (
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
            </div>
          </div>
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
            {loading ? '저장 중...' : '추가'}
          </Button>
        </div>
      )}
    </div>
  );
}
