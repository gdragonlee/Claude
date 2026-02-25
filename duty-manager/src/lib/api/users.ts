import type { Profile } from '../types';
import { supabase } from '../supabase';

export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []).map(mapProfile);
}

export async function getAllUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return (data || []).map(mapProfile);
}

export async function getUser(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapProfile(data);
}

export async function toggleUserActive(id: string): Promise<Profile> {
  // 현재 상태 조회
  const { data: current, error: fetchError } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchError || !current) throw new Error('사용자를 찾을 수 없습니다.');

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: !current.is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function updateUserPosition(id: string, position: string | null): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ position })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_user_by_admin', { p_user_id: id });
  if (error) throw new Error(error.message);
}

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
