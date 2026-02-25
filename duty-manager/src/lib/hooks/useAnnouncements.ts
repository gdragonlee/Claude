'use client';

import useSWR from 'swr';
import * as api from '../api/announcements';
import type { CreateAnnouncementDTO } from '../types';
import { useAuth } from '../context/AuthContext';

export function useAnnouncements() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    'announcements',
    () => api.getAnnouncements(),
    { refreshInterval: 60000 }
  );

  const create = async (dto: CreateAnnouncementDTO) => {
    if (!user) return;
    await api.createAnnouncement(dto, user.id);
    mutate();
  };

  const update = async (id: string, dto: Partial<CreateAnnouncementDTO>) => {
    await api.updateAnnouncement(id, dto);
    mutate();
  };

  const remove = async (id: string) => {
    await api.deleteAnnouncement(id);
    mutate();
  };

  return {
    announcements: data || [],
    isLoading,
    error,
    create,
    update,
    remove,
    mutate,
  };
}
