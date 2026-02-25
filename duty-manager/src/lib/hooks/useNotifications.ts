'use client';

import useSWR from 'swr';
import { useAuth } from '../context/AuthContext';
import * as notifApi from '../api/notifications';

export function useNotifications() {
  const { user } = useAuth();

  const { data, mutate } = useSWR(
    user ? `notifications-${user.id}` : null,
    () => notifApi.getNotifications(user!.id),
    { refreshInterval: 15000 }
  );

  const { data: unreadCount = 0, mutate: mutateCount } = useSWR(
    user ? `notifications-unread-${user.id}` : null,
    () => notifApi.getUnreadCount(user!.id),
    { refreshInterval: 15000 }
  );

  const markAsRead = async (id: string) => {
    await notifApi.markAsRead(id);
    mutate();
    mutateCount();
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await notifApi.markAllAsRead(user.id);
    mutate();
    mutateCount();
  };

  return {
    notifications: data || [],
    unreadCount,
    markAsRead,
    markAllAsRead,
    mutate,
  };
}
