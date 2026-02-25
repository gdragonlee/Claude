'use client';

import useSWR from 'swr';
import { useAuth } from '../context/AuthContext';
import * as swapApi from '../api/swapRequests';

export function useSwapRequests() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? `swap-requests-${user.id}` : null,
    () => swapApi.getSwapRequests(user!.id),
    { refreshInterval: 60000 }
  );

  const create = async (data: {
    scheduleId: string;
    requesterId: string;
    targetUserId: string;
    targetDate: string;
  }) => {
    const result = await swapApi.createSwapRequest(data);
    mutate();
    return result;
  };

  const respond = async (id: string, status: 'approved' | 'rejected') => {
    const result = await swapApi.respondSwapRequest(id, status);
    mutate();
    return result;
  };

  return {
    requests: data || [],
    isLoading,
    error,
    create,
    respond,
    mutate,
  };
}
