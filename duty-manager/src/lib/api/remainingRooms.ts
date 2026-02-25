import { supabase } from '../supabase';

export interface RemainingRoom {
  id: string;
  date: string;
  timeSlot: string;
  count: number;
  updatedBy: string | null;
  updatedAt: string;
}

export async function getRemainingRooms(date: string): Promise<RemainingRoom | null> {
  const { data, error } = await supabase
    .from('remaining_rooms')
    .select('*')
    .eq('date', date)
    .eq('time_slot', '17:30')
    .maybeSingle();

  if (error) {
    console.error('[RemainingRooms] fetch error:', error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    date: data.date,
    timeSlot: data.time_slot,
    count: data.count,
    updatedBy: data.updated_by,
    updatedAt: data.updated_at,
  };
}

export async function upsertRemainingRooms(date: string, count: number): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('remaining_rooms')
    .upsert(
      {
        date,
        time_slot: '17:30',
        count,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'date,time_slot' }
    );

  if (error) {
    console.error('[RemainingRooms] upsert error:', error);
    return false;
  }
  return true;
}
