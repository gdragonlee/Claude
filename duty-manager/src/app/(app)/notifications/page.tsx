'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';
import { NOTIFICATION_TYPE_LABELS } from '@/lib/utils/constants';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/date';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">알림</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            모두 읽음 처리
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
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
      )}
    </div>
  );
}
