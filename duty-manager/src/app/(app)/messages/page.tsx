'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useConversations } from '@/lib/hooks/useMessages';
import { formatDate } from '@/lib/utils/date';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';

export default function MessagesPage() {
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();
  const [showNewChat, setShowNewChat] = useState(false);

  // 전체 사용자 목록 (새 대화 시작용)
  const { data: allUsers } = useSWR(
    showNewChat ? 'all-users' : null,
    async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, position')
        .eq('is_active', true)
        .order('name');
      return (data || []) as { id: string; name: string; position: string | null }[];
    }
  );

  const existingPartnerIds = new Set(conversations.map((c) => c.partnerId));
  const availableUsers = (allUsers || []).filter(
    (u) => u.id !== user?.id && !existingPartnerIds.has(u.id)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">메시지</h1>
        <Button size="sm" onClick={() => setShowNewChat(!showNewChat)}>
          {showNewChat ? '닫기' : '새 대화'}
        </Button>
      </div>

      {/* 새 대화 시작 */}
      {showNewChat && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">대화 상대 선택</h2>
          {availableUsers.length === 0 ? (
            <p className="text-xs text-slate-400">새로 대화를 시작할 사용자가 없습니다.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/messages/${u.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.name}</p>
                    {u.position && <p className="text-[10px] text-slate-400">{u.position}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 대화 목록 */}
      {isLoading ? (
        <div className="text-center py-10 text-slate-400 text-sm">불러오는 중...</div>
      ) : conversations.length === 0 ? (
        <EmptyState message="대화가 없습니다." />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.partnerId}
              href={`/messages/${conv.partnerId}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {conv.partner?.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">
                    {conv.partner?.name || '알 수 없음'}
                    {conv.partner?.position && (
                      <span className="ml-1 text-[10px] text-slate-400 font-normal">
                        {conv.partner.position}
                      </span>
                    )}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDate(conv.lastAt, 'MM/dd HH:mm')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
