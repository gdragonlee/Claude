'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useMessages } from '@/lib/hooks/useMessages';
import { formatDate } from '@/lib/utils/date';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';
import useSWR from 'swr';

export default function ChatPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { messages, send, markAsRead, isLoading } = useMessages(partnerId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 상대 정보: 메시지에서 추출, 없으면 직접 조회
  const partnerFromMsg = messages.find((m) => m.senderId === partnerId)?.sender
    || messages.find((m) => m.receiverId === partnerId)?.receiver;

  const { data: partnerProfile } = useSWR(
    !partnerFromMsg && partnerId ? `partner-profile-${partnerId}` : null,
    async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, position, email, role, phone, is_active, created_at, updated_at')
        .eq('id', partnerId)
        .single();
      if (!data) return null;
      return {
        id: data.id as string,
        email: data.email as string,
        name: data.name as string,
        role: data.role as 'admin' | 'user',
        position: data.position as string | null,
        phone: data.phone as string | null,
        isActive: data.is_active as boolean,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      };
    }
  );

  const partner = partnerFromMsg || partnerProfile;

  // 읽음 처리 & 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError('');
    setText('');
    try {
      await send(trimmed);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
      setText(trimmed); // 실패 시 입력 복원
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // 날짜 구분선
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return '오늘';
    if (d.toDateString() === yesterday.toDateString()) return '어제';
    return formatDate(dateStr, 'yyyy년 M월 d일');
  };

  let lastDateLabel = '';

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-100px)]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200 mb-3">
        <button
          onClick={() => router.push('/messages')}
          className="text-slate-400 hover:text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
          {partner?.name?.[0] || '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{partner?.name || '...'}</p>
          {partner?.position && (
            <p className="text-[10px] text-slate-400">{partner.position}</p>
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto space-y-1 pb-2">
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 text-sm">불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            첫 메시지를 보내보세요.
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            const dateLabel = getDateLabel(msg.createdAt);
            let showDateDivider = false;
            if (dateLabel !== lastDateLabel) {
              showDateDivider = true;
              lastDateLabel = dateLabel;
            }

            return (
              <div key={msg.id}>
                {showDateDivider && (
                  <div className="text-center my-3">
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      {dateLabel}
                    </span>
                  </div>
                )}
                <div className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={clsx(
                      'max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap',
                      isMine
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    )}
                  >
                    {msg.content}
                    <div
                      className={clsx(
                        'text-[9px] mt-1',
                        isMine ? 'text-blue-200 text-right' : 'text-slate-400'
                      )}
                    >
                      {formatDate(msg.createdAt, 'HH:mm')}
                      {isMine && (
                        <span className="ml-1">{msg.isRead ? '읽음' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 에러 메시지 */}
      {sendError && (
        <div className="text-xs text-red-500 px-2 py-1">{sendError}</div>
      )}

      {/* 입력 영역 */}
      <div className="flex gap-2 pt-3 border-t border-slate-200">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="메시지를 입력하세요..."
          className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
