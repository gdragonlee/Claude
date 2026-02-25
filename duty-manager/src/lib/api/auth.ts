import type { Profile, LoginDTO, SignupDTO } from '../types';
import { supabase } from '../supabase';

export async function signup(data: SignupDTO): Promise<void> {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        position: data.position || null,
        phone: data.phone || null,
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!authData.user) throw new Error('회원가입에 실패했습니다.');

  // 이미 가입된 이메일 감지
  if (!authData.user.identities || authData.user.identities.length === 0) {
    throw new Error('이미 가입된 이메일입니다. 로그인 페이지에서 로그인해주세요.');
  }
  // 프로필은 DB 트리거 또는 AuthProvider 폴백이 처리
}

export async function login(data: LoginDTO): Promise<void> {
  console.log('[AUTH] login 시작:', data.email);
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  console.log('[AUTH] signInWithPassword 완료, error:', error);
  if (error) throw new Error(error.message);
  console.log('[AUTH] login 성공');
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getMe(): Promise<Profile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const user = session.user;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile ? mapProfile(profile) : null;
}

export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'name' | 'position' | 'phone'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function updateUserRole(id: string, role: 'admin' | 'user'): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function resetPassword(email: string): Promise<void> {
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/reset-password/confirm`
    : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// DB snake_case → 앱 camelCase 변환
function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as 'admin' | 'user',
    position: row.position as string | null,
    phone: row.phone as string | null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
