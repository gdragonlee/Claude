'use client';

import useSWR from 'swr';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/messages';

export function useConversations() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? `conversations-${user.id}` : null,
    () => api.getConversations(user!.id),
    { refreshInterval: 10000 }
  );

  return {
    conversations: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useMessages(partnerId: string | null) {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user && partnerId ? `messages-${user.id}-${partnerId}` : null,
    () => api.getMessagesWith(user!.id, partnerId!),
    { refreshInterval: 5000 }
  );

  const send = async (content: string) => {
    if (!user || !partnerId) return;
    await api.sendMessage(user.id, partnerId, content);
    mutate();
  };

  const markAsRead = async () => {
    if (!user || !partnerId) return;
    await api.markMessagesAsRead(user.id, partnerId);
    mutate();
  };

  return {
    messages: data || [],
    isLoading,
    error,
    send,
    markAsRead,
    mutate,
  };
}

export function useUnreadMessages() {
  const { user } = useAuth();

  const { data } = useSWR(
    user ? `unread-messages-${user.id}` : null,
    () => api.getUnreadMessageCount(user!.id),
    { refreshInterval: 15000 }
  );

  return { unreadCount: data || 0 };
}
