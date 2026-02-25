import type { Announcement, CreateAnnouncementDTO } from '../types';
import { supabase } from '../supabase';

function mapAnnouncement(row: Record<string, unknown>): Announcement {
  const author = row.author as Record<string, unknown> | null;
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    isPinned: row.is_pinned as boolean,
    authorId: row.author_id as string,
    author: author
      ? {
          id: author.id as string,
          email: author.email as string,
          name: author.name as string,
          role: author.role as 'admin' | 'user',
          position: author.position as string | null,
          phone: author.phone as string | null,
          isActive: author.is_active as boolean,
          createdAt: author.created_at as string,
          updatedAt: author.updated_at as string,
        }
      : undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles!author_id(*)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAnnouncement);
}

export async function createAnnouncement(
  dto: CreateAnnouncementDTO,
  authorId: string
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: dto.title,
      content: dto.content,
      is_pinned: dto.isPinned || false,
      author_id: authorId,
    })
    .select('*, author:profiles!author_id(*)')
    .single();

  if (error) throw new Error(error.message);
  return mapAnnouncement(data);
}

export async function updateAnnouncement(
  id: string,
  dto: Partial<CreateAnnouncementDTO>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (dto.title !== undefined) updates.title = dto.title;
  if (dto.content !== undefined) updates.content = dto.content;
  if (dto.isPinned !== undefined) updates.is_pinned = dto.isPinned;

  const { error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
