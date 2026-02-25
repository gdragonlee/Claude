'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useAnnouncements } from '@/lib/hooks/useAnnouncements';
import { useToast } from '@/lib/context/ToastContext';
import { formatDate } from '@/lib/utils/date';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const { announcements, create, update, remove } = useAnnouncements();
  const { addToast } = useToast();

  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

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

  const handleTogglePin = async (id: string, current: boolean) => {
    await update(id, { isPinned: !current });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">공지사항 관리</h1>
        {!isWriting && (
          <Button size="sm" onClick={() => setIsWriting(true)}>
            새 공지 작성
          </Button>
        )}
      </div>

      {/* 작성/수정 폼 */}
      {isWriting && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
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
              rows={6}
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

      {/* 공지 목록 */}
      {announcements.length === 0 ? (
        <EmptyState message="등록된 공지가 없습니다." />
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.isPinned && <Badge variant="red">고정</Badge>}
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{ann.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-3">{ann.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span>{ann.author?.name || '관리자'}</span>
                    <span>{formatDate(ann.createdAt, 'yyyy.MM.dd HH:mm')}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(ann.id, ann.isPinned)}
                  >
                    {ann.isPinned ? '고정해제' : '고정'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(ann)}>
                    수정
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(ann.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
