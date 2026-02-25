import type { Profile } from '../types';
import { getStore, setStore } from './client';

const PROFILES_KEY = 'duty_profiles';

export async function getUsers(): Promise<Profile[]> {
  return getStore<Profile>(PROFILES_KEY).filter((p) => p.isActive);
}

export async function getAllUsers(): Promise<Profile[]> {
  return getStore<Profile>(PROFILES_KEY);
}

export async function getUser(id: string): Promise<Profile | null> {
  const profiles = getStore<Profile>(PROFILES_KEY);
  return profiles.find((p) => p.id === id) || null;
}

export async function toggleUserActive(id: string): Promise<Profile> {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('사용자를 찾을 수 없습니다.');

  profiles[idx].isActive = !profiles[idx].isActive;
  profiles[idx].updatedAt = new Date().toISOString();
  setStore(PROFILES_KEY, profiles);
  return profiles[idx];
}
