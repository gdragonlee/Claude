'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedules } from '@/lib/hooks/useSchedules';
import { useNotifications } from '@/lib/hooks/useNotifications';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import Badge from '@/components/ui/Badge';
import { SHIFT_LABELS, POSITION_COLORS, OFF_DUTY_TYPES } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/date';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth());
  const { schedules } = useSchedules(year, month);
  const { notifications } = useNotifications();

  const today = formatDate(now, 'yyyy-MM-dd');
  const todaySchedules = schedules.filter((s) => s.date === today);
  const todayDuty = todaySchedules.filter((s) => s.shiftType === 'duty');
  const todayOff = todaySchedules.filter((s) => OFF_DUTY_TYPES.includes(s.shiftType));
  const mySchedules = schedules.filter((s) => s.userId === user?.id && s.shiftType === 'duty');
  const recentNotifs = notifications.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">대시보드</h1>

      {/* 오늘의 당직 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500">오늘의 당직 ({today})</h2>
          {todayOff.length > 0 && (
            <span className="text-xs text-orange-500">
              부재 {todayOff.length}명
              ({todayOff.map((s) => `${SHIFT_LABELS[s.shiftType]} ${s.user?.name || ''}`).join(', ')})
            </span>
          )}
        </div>
        {todayDuty.length === 0 ? (
          <p className="text-sm text-slate-400">오늘 배정된 당직이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayDuty.map((s) => {
              const pos = s.user?.position || '';
              const posColor = POSITION_COLORS[pos];
              return (
                <div key={s.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${posColor ? posColor.bg + ' ' + posColor.text : 'bg-blue-100 text-blue-700'}`}>
                    {s.user?.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.user?.name || '미지정'}</p>
                    <Badge variant={pos === '교수' ? 'green' : pos === '전공의' ? 'amber' : 'slate'}>
                      {pos || '미지정'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 통계 카드 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 text-center">
            <p className="text-3xl font-bold text-blue-600">{mySchedules.length}</p>
            <p className="text-xs text-slate-500 mt-1">이번달 내 당직</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 text-center">
            <p className="text-3xl font-bold text-blue-600">{schedules.length}</p>
            <p className="text-xs text-slate-500 mt-1">이번달 전체 당직</p>
          </div>
        </div>

        {/* 미니 캘린더 */}
        <div className="lg:col-span-2">
          <CalendarGrid
            year={year}
            month={month}
            schedules={schedules}
            onDayClick={(date) => router.push(`/schedule/${date}`)}
            compact
          />
        </div>
      </div>

      {/* 최근 알림 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">최근 알림</h2>
        {recentNotifs.length === 0 ? (
          <p className="text-sm text-slate-400">알림이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {recentNotifs.map((n) => (
              <div key={n.id} className={`text-sm p-2 rounded ${n.isRead ? 'text-slate-400' : 'text-slate-700 bg-blue-50'}`}>
                <span className="font-medium">{n.title}</span>
                {n.message && <span className="text-slate-500"> - {n.message}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
