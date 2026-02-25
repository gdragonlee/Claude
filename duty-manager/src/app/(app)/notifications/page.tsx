'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { useToast } from '@/lib/context/ToastContext';
import { NOTIFICATION_TYPE_LABELS } from '@/lib/utils/constants';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/date';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const { announcements, create, update, remove } = useAnnouncements();
  const { addToast } = useToast();
  const [tab, setTab] = useState<'notices' | 'notifications'>('notices');

  const isAdmin = user?.role === 'admin';

  // 작성/수정 폼 상태
  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const pinnedAnnouncements = announcements.filter((a) => a.isPinned);
  const normalAnnouncements = announcements.filter((a) => !a.isPinned);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsWriting(false);
    setEditingId(null);
  };

  const startEdit = (ann: typeof announcements[0]) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setIsPinned(ann.isPinned);
    setIsWriting(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      addToast('제목과 내용을 입력하세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await update(editingId, { title, content, isPinned });
        addToast('공지가 수정되었습니다.', 'success');
      } else {
        await create({ title, content, isPinned });
        addToast('공지가 등록되었습니다.', 'success');
      }
      resetForm();
    } catch {
      addToast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 공지를 삭제하시겠습니까?')) return;
    try {
      await remove(id);
      addToast('공지가 삭제되었습니다.', 'success');
    } catch {
      addToast('삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">알림</h1>
        <div className="flex items-center gap-2">
          {tab === 'notices' && isAdmin && !isWriting && (
            <Button size="sm" onClick={() => setIsWriting(true)}>
              공지 작성
            </Button>
          )}
          {tab === 'notifications' && unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              모두 읽음 처리
            </Button>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setTab('notices')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'notices'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          공지사항
          {pinnedAnnouncements.length > 0 && (
            <span className="ml-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
              {pinnedAnnouncements.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('notifications')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'notifications'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          내 알림
          {unreadCount > 0 && (
            <span className="ml-1 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'notices' ? (
        /* 공지사항 탭 */
        <>
          {/* 작성/수정 폼 */}
          {isWriting && isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">
                {editingId ? '공지 수정' : '새 공지 작성'}
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="내용을 입력하세요..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  상단 고정
                </label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? '저장 중...' : editingId ? '수정' : '등록'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    취소
                  </Button>
                </div>
              </div>
            </div>
          )}

          {announcements.length === 0 && !isWriting ? (
            <EmptyState message="등록된 공지가 없습니다." />
          ) : (
            <div className="space-y-3">
              {pinnedAnnouncements.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  announcement={ann}
                  pinned
                  isAdmin={isAdmin}
                  onEdit={() => startEdit(ann)}
                  onDelete={() => handleDelete(ann.id)}
                />
              ))}
              {normalAnnouncements.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  announcement={ann}
                  isAdmin={isAdmin}
                  onEdit={() => startEdit(ann)}
                  onDelete={() => handleDelete(ann.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* 내 알림 탭 */
        notifications.length === 0 ? (
          <EmptyState message="알림이 없습니다." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${
                  n.isRead ? 'border-slate-200 opacity-60' : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={n.isRead ? 'slate' : 'blue'}>
                        {NOTIFICATION_TYPE_LABELS[n.type] || n.type}
                      </Badge>
                      {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </div>
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    {n.message && <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDate(n.createdAt, 'MM/dd HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function AnnouncementCard({
  announcement: ann,
  pinned,
  isAdmin,
  onEdit,
  onDelete,
}: {
  announcement: {
    id: string;
    title: string;
    content: string;
    isPinned: boolean;
    author?: { name: string } | undefined;
    createdAt: string;
  };
  pinned?: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
        pinned ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {pinned && <Badge variant="red">고정</Badge>}
            <Badge variant="purple">공지</Badge>
            <h3 className="text-sm font-semibold text-slate-800 truncate">{ann.title}</h3>
          </div>
          <p
            className={`text-xs text-slate-600 whitespace-pre-wrap ${
              expanded ? '' : 'line-clamp-2'
            }`}
          >
            {ann.content}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>{ann.author?.name || '관리자'}</span>
              <span>{formatDate(ann.createdAt, 'yyyy.MM.dd HH:mm')}</span>
            </div>
            {expanded && isAdmin && (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={onEdit}>수정</Button>
                <Button variant="ghost" size="sm" onClick={onDelete}>삭제</Button>
              </div>
            )}
          </div>
        </div>
        <span className="text-slate-300 ml-2 text-xs shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </div>
    </div>
  );
}
