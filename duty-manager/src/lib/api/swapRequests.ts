import type { SwapRequest, DutySchedule } from '../types';
import { supabase } from '../supabase';
import { createNotification } from './notifications';

function mapSwapRequest(row: Record<string, unknown>): SwapRequest {
  const requester = row.requester as Record<string, unknown> | null;
  const targetUser = row.target_user as Record<string, unknown> | null;
  const schedule = row.schedule as Record<string, unknown> | null;

  return {
    id: row.id as string,
    scheduleId: row.schedule_id as string,
    requesterId: row.requester_id as string,
    targetUserId: row.target_user_id as string,
    targetDate: row.target_date as string,
    status: row.status as SwapRequest['status'],
    createdAt: row.created_at as string,
    requester: requester ? {
      id: requester.id as string,
      email: requester.email as string,
      name: requester.name as string,
      role: requester.role as 'admin' | 'user',
      position: requester.position as string | null,
      phone: requester.phone as string | null,
      isActive: requester.is_active as boolean,
      createdAt: requester.created_at as string,
      updatedAt: requester.updated_at as string,
    } : undefined,
    targetUser: targetUser ? {
      id: targetUser.id as string,
      email: targetUser.email as string,
      name: targetUser.name as string,
      role: targetUser.role as 'admin' | 'user',
      position: targetUser.position as string | null,
      phone: targetUser.phone as string | null,
      isActive: targetUser.is_active as boolean,
      createdAt: targetUser.created_at as string,
      updatedAt: targetUser.updated_at as string,
    } : undefined,
    schedule: schedule ? {
      id: schedule.id as string,
      date: schedule.date as string,
      userId: schedule.user_id as string,
      shiftType: schedule.shift_type as DutySchedule['shiftType'],
      status: schedule.status as DutySchedule['status'],
      note: schedule.note as string | null,
      groupId: (schedule.group_id as string) || null,
      createdBy: schedule.created_by as string,
      createdAt: schedule.created_at as string,
      updatedAt: schedule.updated_at as string,
    } : undefined,
  };
}

export async function getSwapRequests(userId: string): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(`
      *,
      requester:profiles!swap_requests_requester_id_fkey(*),
      target_user:profiles!swap_requests_target_user_id_fkey(*),
      schedule:duty_schedules!swap_requests_schedule_id_fkey(*)
    `)
    .or(`requester_id.eq.${userId},target_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapSwapRequest);
}

export async function createSwapRequest(data: {
  scheduleId: string;
  requesterId: string;
  targetUserId: string;
  targetDate: string;
}): Promise<SwapRequest> {
  const { data: row, error } = await supabase
    .from('swap_requests')
    .insert({
      schedule_id: data.scheduleId,
      requester_id: data.requesterId,
      target_user_id: data.targetUserId,
      target_date: data.targetDate,
    })
    .select(`
      *,
      requester:profiles!swap_requests_requester_id_fkey(*),
      target_user:profiles!swap_requests_target_user_id_fkey(*),
      schedule:duty_schedules!swap_requests_schedule_id_fkey(*)
    `)
    .single();

  if (error) throw new Error(error.message);

  // 일정 상태 업데이트
  await supabase
    .from('duty_schedules')
    .update({ status: 'swap_requested' })
    .eq('id', data.scheduleId);

  // 대상자에게 알림
  const { data: schedule } = await supabase
    .from('duty_schedules')
    .select('date')
    .eq('id', data.scheduleId)
    .single();

  const { data: requester } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', data.requesterId)
    .single();

  await createNotification({
    userId: data.targetUserId,
    type: 'swap_request',
    title: '교대 요청',
    message: `${requester?.name || ''}님이 ${schedule?.date || ''} 당직 교대를 요청했습니다.`,
    relatedId: row.id,
  });

  return mapSwapRequest(row);
}

export async function respondSwapRequest(
  id: string,
  status: 'approved' | 'rejected'
): Promise<SwapRequest> {
  const { data: request, error: fetchError } = await supabase
    .from('swap_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !request) throw new Error('교대 요청을 찾을 수 없습니다.');

  // 상태 업데이트
  await supabase
    .from('swap_requests')
    .update({ status })
    .eq('id', id);

  if (status === 'approved') {
    // 일정 교환: 담당자를 대상자로 변경
    await supabase
      .from('duty_schedules')
      .update({ user_id: request.target_user_id, status: 'assigned' })
      .eq('id', request.schedule_id);
  } else {
    // 거절 시 일정 상태 복원
    await supabase
      .from('duty_schedules')
      .update({ status: 'assigned' })
      .eq('id', request.schedule_id);
  }

  // 요청자에게 결과 알림
  await createNotification({
    userId: request.requester_id,
    type: 'swap_result',
    title: status === 'approved' ? '교대 승인' : '교대 거절',
    message: `${request.target_date} 당직 교대가 ${status === 'approved' ? '승인' : '거절'}되었습니다.`,
    relatedId: id,
  });

  // 최종 데이터 반환
  const { data: updated } = await supabase
    .from('swap_requests')
    .select(`
      *,
      requester:profiles!swap_requests_requester_id_fkey(*),
      target_user:profiles!swap_requests_target_user_id_fkey(*),
      schedule:duty_schedules!swap_requests_schedule_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  return mapSwapRequest(updated!);
}
