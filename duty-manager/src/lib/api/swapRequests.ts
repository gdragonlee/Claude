import type { SwapRequest, Profile, DutySchedule } from '../types';
import { generateId, getStore, setStore } from './client';
import { createNotification } from './notifications';

const SWAP_KEY = 'duty_swap_requests';
const PROFILES_KEY = 'duty_profiles';
const SCHEDULES_KEY = 'duty_schedules';

function enrichSwapRequest(sr: SwapRequest): SwapRequest {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
  return {
    ...sr,
    requester: profiles.find((p) => p.id === sr.requesterId),
    targetUser: profiles.find((p) => p.id === sr.targetUserId),
    schedule: schedules.find((s) => s.id === sr.scheduleId),
  };
}

export async function getSwapRequests(userId: string): Promise<SwapRequest[]> {
  const requests = getStore<SwapRequest>(SWAP_KEY);
  return requests
    .filter((r) => r.requesterId === userId || r.targetUserId === userId)
    .map(enrichSwapRequest)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createSwapRequest(data: {
  scheduleId: string;
  requesterId: string;
  targetUserId: string;
  targetDate: string;
}): Promise<SwapRequest> {
  const requests = getStore<SwapRequest>(SWAP_KEY);
  const schedules = getStore<DutySchedule>(SCHEDULES_KEY);

  const schedule = schedules.find((s) => s.id === data.scheduleId);
  if (!schedule) throw new Error('일정을 찾을 수 없습니다.');

  const request: SwapRequest = {
    id: generateId(),
    scheduleId: data.scheduleId,
    requesterId: data.requesterId,
    targetUserId: data.targetUserId,
    targetDate: data.targetDate,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  requests.push(request);
  setStore(SWAP_KEY, requests);

  // 일정 상태 업데이트
  const sIdx = schedules.findIndex((s) => s.id === data.scheduleId);
  if (sIdx !== -1) {
    schedules[sIdx].status = 'swap_requested';
    setStore(SCHEDULES_KEY, schedules);
  }

  // 대상자에게 알림
  const profiles = getStore<Profile>(PROFILES_KEY);
  const requester = profiles.find((p) => p.id === data.requesterId);
  await createNotification({
    userId: data.targetUserId,
    type: 'swap_request',
    title: '교대 요청',
    message: `${requester?.name || ''}님이 ${schedule.date} 당직 교대를 요청했습니다.`,
    relatedId: request.id,
  });

  return enrichSwapRequest(request);
}

export async function respondSwapRequest(
  id: string,
  status: 'approved' | 'rejected'
): Promise<SwapRequest> {
  const requests = getStore<SwapRequest>(SWAP_KEY);
  const idx = requests.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('교대 요청을 찾을 수 없습니다.');

  requests[idx].status = status;
  setStore(SWAP_KEY, requests);

  const request = requests[idx];

  if (status === 'approved') {
    // 일정 교환
    const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
    const sIdx = schedules.findIndex((s) => s.id === request.scheduleId);
    if (sIdx !== -1) {
      schedules[sIdx].userId = request.targetUserId;
      schedules[sIdx].status = 'assigned';
      schedules[sIdx].updatedAt = new Date().toISOString();
      setStore(SCHEDULES_KEY, schedules);
    }
  } else {
    // 거절 시 일정 상태 복원
    const schedules = getStore<DutySchedule>(SCHEDULES_KEY);
    const sIdx = schedules.findIndex((s) => s.id === request.scheduleId);
    if (sIdx !== -1) {
      schedules[sIdx].status = 'assigned';
      setStore(SCHEDULES_KEY, schedules);
    }
  }

  // 요청자에게 결과 알림
  await createNotification({
    userId: request.requesterId,
    type: 'swap_result',
    title: status === 'approved' ? '교대 승인' : '교대 거절',
    message: `${request.targetDate} 당직 교대가 ${status === 'approved' ? '승인' : '거절'}되었습니다.`,
    relatedId: request.id,
  });

  return enrichSwapRequest(requests[idx]);
}
