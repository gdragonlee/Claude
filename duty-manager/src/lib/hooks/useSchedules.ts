'use client';

import useSWR from 'swr';
import { getSchedulesByMonth } from '../api/schedules';

export function useSchedules(year: number, month: number) {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data, error, isLoading, mutate } = useSWR(
    `schedules-${monthKey}`,
    () => getSchedulesByMonth(monthKey),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  return {
    schedules: data || [],
    isLoading,
    error,
    mutate,
  };
}
