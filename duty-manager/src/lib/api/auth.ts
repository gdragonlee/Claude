import type { Profile, LoginDTO, SignupDTO } from '../types';
import { generateId, getStore, setStore } from './client';

const PROFILES_KEY = 'duty_profiles';
const PASSWORDS_KEY = 'duty_passwords';

export async function signup(data: SignupDTO): Promise<Profile> {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const passwords = getStore<{ email: string; password: string }>(PASSWORDS_KEY);

  if (profiles.find((p) => p.email === data.email)) {
    throw new Error('이미 등록된 이메일입니다.');
  }

  const isFirstUser = profiles.length === 0;
  const now = new Date().toISOString();
  const profile: Profile = {
    id: generateId(),
    email: data.email,
    name: data.name,
    role: isFirstUser ? 'admin' : 'user',
    position: data.position || null,
    phone: data.phone || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  profiles.push(profile);
  passwords.push({ email: data.email, password: data.password });
  setStore(PROFILES_KEY, profiles);
  setStore(PASSWORDS_KEY, passwords);
  localStorage.setItem('currentUser', JSON.stringify(profile));

  return profile;
}

export async function login(data: LoginDTO): Promise<Profile> {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const passwords = getStore<{ email: string; password: string }>(PASSWORDS_KEY);

  const pwEntry = passwords.find((p) => p.email === data.email);
  if (!pwEntry || pwEntry.password !== data.password) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const profile = profiles.find((p) => p.email === data.email);
  if (!profile) throw new Error('사용자를 찾을 수 없습니다.');
  if (!profile.isActive) throw new Error('비활성화된 계정입니다.');

  localStorage.setItem('currentUser', JSON.stringify(profile));
  return profile;
}

export async function logout(): Promise<void> {
  localStorage.removeItem('currentUser');
}

export async function getMe(): Promise<Profile | null> {
  const data = localStorage.getItem('currentUser');
  return data ? JSON.parse(data) : null;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'name' | 'position' | 'phone'>>
): Promise<Profile> {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('사용자를 찾을 수 없습니다.');

  profiles[idx] = { ...profiles[idx], ...updates, updatedAt: new Date().toISOString() };
  setStore(PROFILES_KEY, profiles);

  const currentUser = await getMe();
  if (currentUser && currentUser.id === id) {
    localStorage.setItem('currentUser', JSON.stringify(profiles[idx]));
  }

  return profiles[idx];
}

export async function updateUserRole(id: string, role: 'admin' | 'user'): Promise<Profile> {
  const profiles = getStore<Profile>(PROFILES_KEY);
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('사용자를 찾을 수 없습니다.');

  profiles[idx] = { ...profiles[idx], role, updatedAt: new Date().toISOString() };
  setStore(PROFILES_KEY, profiles);
  return profiles[idx];
}
