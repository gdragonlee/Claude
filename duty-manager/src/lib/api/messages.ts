import type { Message, Conversation } from '../types';
import { supabase } from '../supabase';

function mapMessage(row: Record<string, unknown>): Message {
  const sender = row.sender as Record<string, unknown> | null;
  const receiver = row.receiver as Record<string, unknown> | null;
  const mapProfile = (p: Record<string, unknown> | null) =>
    p
      ? {
          id: p.id as string,
          email: p.email as string,
          name: p.name as string,
          role: p.role as 'admin' | 'user',
          position: p.position as string | null,
          phone: p.phone as string | null,
          isActive: p.is_active as boolean,
          createdAt: p.created_at as string,
          updatedAt: p.updated_at as string,
        }
      : undefined;

  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    sender: mapProfile(sender),
    receiverId: row.receiver_id as string,
    receiver: mapProfile(receiver),
    content: row.content as string,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  };
}

/** 대화 목록 조회 (최근 메시지 기준) */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const messages = (data || []).map(mapMessage);

  // 상대방별로 그룹화
  const convMap = new Map<string, Conversation>();
  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;

    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        partner,
        lastMessage: msg.content,
        lastAt: msg.createdAt,
        unreadCount: 0,
      });
    }

    // 안 읽은 수신 메시지 카운트
    if (msg.receiverId === userId && !msg.isRead) {
      const conv = convMap.get(partnerId)!;
      conv.unreadCount++;
    }
  }

  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );
}

/** 특정 상대와의 메시지 조회 */
export async function getMessagesWith(userId: string, partnerId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapMessage);
}

/** 메시지 전송 */
export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*)')
    .single();

  if (error) throw new Error(error.message);
  return mapMessage(data);
}

/** 특정 상대의 메시지 읽음 처리 */
export async function markMessagesAsRead(userId: string, senderId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', senderId)
    .eq('is_read', false);

  if (error) throw new Error(error.message);
}

/** 전체 안 읽은 메시지 수 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}
