import type { DutySchedule, CreateScheduleDTO, AutoAssignOptions, RepeatPattern } from '../types';
import { supabase } from '../supabase';
import { createNotification } from './notifications';
import { isHoliday } from '../utils/holidays';
import { OFF_DUTY_SORT_ORDER } from '../utils/constants';

/** DB row → 앱 타입 변환 */
function mapSchedule(row: Record<string, unknown>): DutySchedule {
  const user = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    date: row.date as string,
    userId: row.user_id as string,
    user: user ? {
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      role: user.role as 'admin' | 'user',
      position: user.position as string | null,
      phone: user.phone as string | null,
      isActive: user.is_active as boolean,
      createdAt: user.created_at as string,
      updatedAt: user.updated_at as string,
    } : undefined,
    shiftType: row.shift_type as DutySchedule['shiftType'],
    status: row.status as DutySchedule['status'],
    note: row.note as string | null,
    groupId: (row.group_id as string) || null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Date → YYYY-MM-DD 문자열 */
function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 다음 날 날짜 문자열 반환 (YYYY-MM-DD) */
function getNextDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return formatDateStr(d);
}

/** 반복 패턴에 따른 날짜 목록 생성 */
function generateDates(
  startDate: string,
  endDate: string,
  pattern: RepeatPattern,
  weekInterval: number = 1,
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  if (pattern === 'daily') {
    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDateStr(current));
      current.setDate(current.getDate() + 1);
    }
  } else {
    // weekly / biweekly / custom: 같은 요일 반복
    const interval = pattern === 'weekly' ? 1 : pattern === 'biweekly' ? 2 : weekInterval;
    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDateStr(current));
      current.setDate(current.getDate() + 7 * interval);
    }
  }

  return dates;
}

/** 현재 로그인 유저 ID */
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || '';
}

export async function getSchedulesByMonth(month: string): Promise<DutySchedule[]> {
  const startDate = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('duty_schedules')
    .select('*, profiles!duty_schedules_user_id_fkey(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  if (error) throw new Error(error.message);
  return (data || []).map(mapSchedule).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    // 당직(0) > 백당(1) > 부재: 학회(2) > 연차(3) > 당직오프(4) > 연구(5)
    const typeOrder = (s: DutySchedule) => {
      if (s.shiftType === 'duty') return 0;
      if (s.shiftType === 'night_duty') return 1;
      return 2 + (OFF_DUTY_SORT_ORDER[s.shiftType] ?? 99);
    };
    if (typeOrder(a) !== typeOrder(b)) return typeOrder(a) - typeOrder(b);
    // 같은 그룹 내에서 교수가 전공의보다 위
    const posOrder = (s: DutySchedule) => s.user?.position === '교수' ? 0 : 1;
    return posOrder(a) - posOrder(b);
  });
}

export async function getSchedule(id: string): Promise<DutySchedule | null> {
  const { data, error } = await supabase
    .from('duty_schedules')
    .select('*, profiles!duty_schedules_user_id_fkey(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapSchedule(data);
}

export async function createSchedule(data: CreateScheduleDTO): Promise<DutySchedule> {
  const currentUserId = await getCurrentUserId();

  // 중복 체크
  const { data: existing } = await supabase
    .from('duty_schedules')
    .select('id')
    .eq('date', data.date)
    .eq('user_id', data.userId)
    .eq('shift_type', data.shiftType)
    .maybeSingle();

  if (existing) {
    throw new Error('동일한 날짜/사용자/근무 유형의 일정이 이미 존재합니다.');
  }

  const { data: row, error } = await supabase
    .from('duty_schedules')
    .insert({
      date: data.date,
      user_id: data.userId,
      shift_type: data.shiftType,
      note: data.note || null,
      created_by: currentUserId,
    })
    .select('*, profiles!duty_schedules_user_id_fkey(*)')
    .single();

  if (error) throw new Error(error.message);

  // 교수 월~목 당직이면 다음날 당직오프 자동 생성
  if (data.shiftType === 'duty') {
    await createDutyOffIfNeeded(data.date, data.userId, currentUserId);
  }

  // 알림 생성
  if (data.userId !== currentUserId) {
    await createNotification({
      userId: data.userId,
      type: 'assignment',
      title: '새 당직 배정',
      message: `${data.date} 당직이 배정되었습니다.`,
      relatedId: row.id,
    });
  }

  return mapSchedule(row);
}

/** 교수 월~목 당직 시 다음날 당직오프 자동 생성 */
async function createDutyOffIfNeeded(
  dateStr: string,
  userId: string,
  createdBy: string
): Promise<void> {
  const { data: user } = await supabase
    .from('profiles')
    .select('position')
    .eq('id', userId)
    .single();

  if (!user || user.position !== '교수') return;

  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  if (dayOfWeek < 1 || dayOfWeek > 4) return; // 월~목만

  const nextDate = getNextDate(dateStr);

  const { data: existing } = await supabase
    .from('duty_schedules')
    .select('id')
    .eq('date', nextDate)
    .eq('user_id', userId)
    .eq('shift_type', 'duty_off')
    .maybeSingle();

  if (existing) return;

  await supabase
    .from('duty_schedules')
    .insert({
      date: nextDate,
      user_id: userId,
      shift_type: 'duty_off',
      status: 'assigned',
      note: '당직 다음날 오프',
      created_by: createdBy,
    });
}

/** 시작일~종료일 반복 일정 배치 생성 (중복 skip, group_id 부여) */
export async function createConsecutiveSchedules(
  startDate: string,
  endDate: string,
  userId: string,
  shiftType: DutySchedule['shiftType'],
  note?: string,
  repeatPattern: RepeatPattern = 'daily',
  weekInterval: number = 1,
): Promise<number> {
  const currentUserId = await getCurrentUserId();
  const dates = generateDates(startDate, endDate, repeatPattern, weekInterval);

  if (dates.length === 0) return 0;

  // 기존 중복 조회
  const { data: existingRows } = await supabase
    .from('duty_schedules')
    .select('date')
    .eq('user_id', userId)
    .eq('shift_type', shiftType)
    .in('date', dates);

  const existingDates = new Set((existingRows || []).map((r: Record<string, unknown>) => r.date as string));

  const nonDuplicateDates = dates.filter((date) => !existingDates.has(date));
  if (nonDuplicateDates.length === 0) return 0;

  // 2건 이상이면 group_id 부여
  const groupId = nonDuplicateDates.length >= 2 ? crypto.randomUUID() : null;

  const inserts = nonDuplicateDates.map((date) => ({
    date,
    user_id: userId,
    shift_type: shiftType,
    note: note || null,
    status: 'assigned',
    group_id: groupId,
    created_by: currentUserId,
  }));

  const { error } = await supabase
    .from('duty_schedules')
    .insert(inserts);

  if (error) throw new Error(error.message);

  // 교수 당직이면 각 날짜에 대해 duty_off 자동 생성
  if (shiftType === 'duty') {
    for (const ins of inserts) {
      await createDutyOffIfNeeded(ins.date, userId, currentUserId);
    }
  }

  // 알림 생성
  if (userId !== currentUserId) {
    await createNotification({
      userId,
      type: 'assignment',
      title: '새 당직 배정',
      message: `${startDate} ~ ${endDate} 일정이 배정되었습니다. (${inserts.length}건)`,
    });
  }

  return inserts.length;
}

/** 그룹 일정 개수 조회 */
export async function getGroupScheduleCount(groupId: string): Promise<number> {
  const { count, error } = await supabase
    .from('duty_schedules')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if (error) return 0;
  return count || 0;
}

/** 그룹 일정 일괄 삭제 */
export async function deleteScheduleGroup(groupId: string): Promise<void> {
  // 그룹 내 당직들의 다음날 duty_off도 삭제
  const { data: dutyRows } = await supabase
    .from('duty_schedules')
    .select('date, user_id, shift_type')
    .eq('group_id', groupId)
    .eq('shift_type', 'duty');

  if (dutyRows) {
    for (const row of dutyRows) {
      const nextDate = getNextDate(row.date as string);
      await supabase
        .from('duty_schedules')
        .delete()
        .eq('date', nextDate)
        .eq('user_id', row.user_id as string)
        .eq('shift_type', 'duty_off');
    }
  }

  await supabase
    .from('duty_schedules')
    .delete()
    .eq('group_id', groupId);
}

export async function updateSchedule(
  id: string,
  updates: Partial<Pick<DutySchedule, 'userId' | 'shiftType' | 'status' | 'note'>>
): Promise<DutySchedule> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.userId !== undefined) dbUpdates.user_id = updates.userId;
  if (updates.shiftType !== undefined) dbUpdates.shift_type = updates.shiftType;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.note !== undefined) dbUpdates.note = updates.note;

  const { data, error } = await supabase
    .from('duty_schedules')
    .update(dbUpdates)
    .eq('id', id)
    .select('*, profiles!duty_schedules_user_id_fkey(*)')
    .single();

  if (error) throw new Error(error.message);
  return mapSchedule(data);
}

export async function deleteSchedule(id: string): Promise<void> {
  const { data: target } = await supabase
    .from('duty_schedules')
    .select('*')
    .eq('id', id)
    .single();

  // 당직 삭제 시 연결된 다음날 당직오프도 함께 삭제
  if (target && target.shift_type === 'duty') {
    const nextDate = getNextDate(target.date);
    await supabase
      .from('duty_schedules')
      .delete()
      .eq('date', nextDate)
      .eq('user_id', target.user_id)
      .eq('shift_type', 'duty_off');
  }

  await supabase.from('duty_schedules').delete().eq('id', id);
}

export async function deleteSchedulesByMonth(month: string): Promise<void> {
  const startDate = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

  await supabase
    .from('duty_schedules')
    .delete()
    .gte('date', startDate)
    .lte('date', endDate);
}

export async function bulkCreateSchedules(
  year: number,
  month: number,
  options: AutoAssignOptions
): Promise<DutySchedule[]> {
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true);

  const profiles = (profileRows || []).filter(
    (p: Record<string, unknown>) => !options.excludeUserIds?.includes(p.id as string)
  );
  if (profiles.length === 0) throw new Error('배정 가능한 사용자가 없습니다.');

  const currentUserId = await getCurrentUserId();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data: existingRows } = await supabase
    .from('duty_schedules')
    .select('date, shift_type')
    .gte('date', `${monthStr}-01`)
    .lte('date', `${monthStr}-${String(daysInMonth).padStart(2, '0')}`)
    .eq('shift_type', 'duty');

  const existingDates = new Set((existingRows || []).map((r: Record<string, unknown>) => r.date));

  const inserts: Record<string, unknown>[] = [];
  let userIdx = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, day).getDay();

    if (options.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
    if (options.excludeHolidays && isHoliday(date)) continue;
    if (existingDates.has(date)) continue;

    const user = profiles[userIdx % profiles.length];
    userIdx++;

    inserts.push({
      date,
      user_id: user.id,
      shift_type: 'duty',
      status: 'assigned',
      created_by: currentUserId,
    });

    if (user.position === '교수' && dayOfWeek >= 1 && dayOfWeek <= 4) {
      const nextDate = getNextDate(date);
      inserts.push({
        date: nextDate,
        user_id: user.id,
        shift_type: 'duty_off',
        status: 'assigned',
        note: '당직 다음날 오프',
        created_by: currentUserId,
      });
    }
  }

  if (inserts.length === 0) return [];

  const { data: rows, error } = await supabase
    .from('duty_schedules')
    .insert(inserts)
    .select('*, profiles!duty_schedules_user_id_fkey(*)');

  if (error) throw new Error(error.message);
  return (rows || []).map(mapSchedule);
}
