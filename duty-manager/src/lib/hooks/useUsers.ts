'use client';

import useSWR from 'swr';
import { getUsers, getAllUsers } from '../api/users';

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR(
    'users',
    getUsers,
    { refreshInterval: 300000 }
  );

  return {
    users: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useAllUsers() {
  const { data, error, isLoading, mutate } = useSWR(
    'all-users',
    getAllUsers,
    { refreshInterval: 300000 }
  );

  return {
    users: data || [],
    isLoading,
    error,
    mutate,
  };
}
