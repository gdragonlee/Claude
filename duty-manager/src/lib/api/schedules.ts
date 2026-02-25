import type { DutySchedule, CreateScheduleDTO, AutoAssignOptions, Profile } from '../types';
import { generateId, getStore, setStore, getCurrentUser } from './client';
import { createNotification } from './notifications';
import { isHoliday } from '../utils/holidays';

const SCHEDULES_KEY = 'duty_schedules';
const PROFILES_KEY = 'duty_profiles';

function enrichSchedule(schedule: DutySchedule): DutySchedule {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const user = profiles.find((p) => p.id === schedule.userId);
  return { ...schedule, user: user || undefined };
}

/** 다음 날 날짜 문자열 반환 (YYYY-MM-DD) */
function getNextDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 교수 월~목 당직 시 다음날 당직오프 자동 생성 */
function createDutyOffIfNeeded(
  dateStr: string,
  userId: string,
  schedules: DutySchedule[],
  createdBy: string,
): DutySchedule | null {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const user = profiles.find((p) => p.id === userId);
  if (!user || user.position !== '교수') return null;

  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu
  if (dayOfWeek < 1 || dayOfWeek > 4) return null; // 월~목만

  const nextDate = getNextDate(dateStr);
  const existing = schedules.find(
    (s) => s.date === nextDate && s.userId === userId && s.shiftType === 'duty_off'
  );
  if (existing) return null;

  const now = new Date().toISOString();
  return {
    id: generateId(),
    date: nextDate,
    userId,
    shiftType: 'duty_off',
    status: 'assigned',
    note: '당직 다음날 오프',
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSchedulesByMonth(month: string): Promise<DutySchedule[]> {
  // month format: YYYY-MM
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  return schedules
    .filter((s) => s.date.startsWith(month))
    .map(enrichSchedule)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getSchedule(id: string): Promise<DutySchedule | null> {
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  const s = schedules.find((s) => s.id === id);
  return s ? enrichSchedule(s) : null;
}

export async function createSchedule(data: CreateScheduleDTO): Promise<DutySchedule> {
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  const currentUser = getCurrentUser();

  // 중복 체크
  const existing = schedules.find(
    (s) => s.date === data.date && s.userId === data.userId && s.shiftType === data.shiftType
  );
  if (existing) {
    throw new Error('동일한 날짜/사용자/근무 유형의 일정이 이미 존재합니다.');
  }

  const now = new Date().toISOString();
  const schedule: DutySchedule = {
    id: generateId(),
    date: data.date,
    userId: data.userId,
    shiftType: data.shiftType,
    status: 'assigned',
    note: data.note || null,
    createdBy: currentUser?.id || '',
    createdAt: now,
    updatedAt: now,
  };

  schedules.push(schedule);

  // 교수 월~목 당직이면 다음날 당직오프 자동 생성
  if (data.shiftType === 'duty') {
    const dutyOff = createDutyOffIfNeeded(data.date, data.userId, schedules, currentUser?.id || '');
    if (dutyOff) {
      schedules.push(dutyOff);
    }
  }

  setStore(SCHEDULES_KEY, schedules);

  // 알림 생성
  if (data.userId !== currentUser?.id) {
    const profiles = getStore<Profile>(PROFILES_KEY);
    const targetUser = profiles.find((p) => p.id === data.userId);
    if (targetUser) {
      await createNotification({
        userId: data.userId,
        type: 'assignment',
        title: '새 당직 배정',
        message: `${data.date} 당직이 배정되었습니다.`,
        relatedId: schedule.id,
      });
    }
  }

  return enrichSchedule(schedule);
}

export async function updateSchedule(
  id: string,
  updates: Partial<Pick<DutySchedule, 'userId' | 'shiftType' | 'status' | 'note'>>
): Promise<DutySchedule> {
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('일정을 찾을 수 없습니다.');

  schedules[idx] = { ...schedules[idx], ...updates, updatedAt: new Date().toISOString() };
  setStore(SCHEDULES_KEY, schedules);

  return enrichSchedule(schedules[idx]);
}

export async function deleteSchedule(id: string): Promise<void> {
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  const filtered = schedules.filter((s) => s.id !== id);
  setStore(SCHEDULES_KEY, filtered);
}

export async function deleteSchedulesByMonth(month: string): Promise<void> {
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  const filtered = schedules.filter((s) => !s.date.startsWith(month));
  setStore(SCHEDULES_KEY, filtered);
}

export async function bulkCreateSchedules(
  year: number,
  month: number,
  options: AutoAssignOptions
): Promise<DutySchedule[]> {
  const profiles = getStore<Profile>(PROFILES_KEY).filter(
    (p) => p.isActive && !options.excludeUserIds?.includes(p.id)
  );
  if (profiles.length === 0) throw new Error('배정 가능한 사용자가 없습니다.');

  const currentUser = getCurrentUser();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const created: DutySchedule[] = [];
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  let userIdx = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, day).getDay();

    if (options.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
    if (options.excludeHolidays && isHoliday(date)) continue;

    // 이미 당직이 배정된 날은 건너뛰기
    const existing = schedules.find(
      (s) => s.date === date && s.shiftType === 'duty'
    );
    if (existing) continue;

    const user = profiles[userIdx % profiles.length];
    userIdx++;

    const now = new Date().toISOString();
    const schedule: DutySchedule = {
      id: generateId(),
      date,
      userId: user.id,
      shiftType: 'duty',
      status: 'assigned',
      note: null,
      createdBy: currentUser?.id || '',
      createdAt: now,
      updatedAt: now,
    };

    schedules.push(schedule);
    created.push(schedule);

    // 교수 월~목 당직이면 다음날 당직오프 자동 생성
    const dutyOff = createDutyOffIfNeeded(date, user.id, schedules, currentUser?.id || '');
    if (dutyOff) {
      schedules.push(dutyOff);
      created.push(dutyOff);
    }
  }

  setStore(SCHEDULES_KEY, schedules);
  return created.map(enrichSchedule);
}
