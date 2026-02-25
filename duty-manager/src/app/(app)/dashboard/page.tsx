'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedules } from '@/lib/hooks/useSchedules';
import { useNotifications } from '@/lib/hooks/useNotifications';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import Badge from '@/components/ui/Badge';
import { SHIFT_LABELS, POSITION_COLORS, OFF_DUTY_TYPES } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/date';
import { getRemainingRooms, upsertRemainingRooms } from '@/lib/api/remainingRooms';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  // 항상 현재 날짜 기준으로 표시 (state 사용하지 않아 캐시 문제 방지)
  const [, setTick] = useState(0);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const { schedules } = useSchedules(year, month);

  // 페이지 visibility 변경 시 강제 갱신 (다른 페이지에서 돌아올 때)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setTick((n) => n + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', () => setTick((n) => n + 1));
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const { notifications } = useNotifications();

  // 당직 교대 기준: 아침 8시. 8시 이전이면 어제 당직자가 근무 중
  const dutyDate = now.getHours() < 8
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    : now;
  const dutyDateStr = formatDate(dutyDate, 'yyyy-MM-dd');
  const today = formatDate(now, 'yyyy-MM-dd');
  const dutySchedules = schedules.filter((s) => s.date === dutyDateStr);
  const todayDuty = dutySchedules.filter((s) => s.shiftType === 'duty' || s.shiftType === 'night_duty');
  const todayOff = dutySchedules.filter((s) => OFF_DUTY_TYPES.includes(s.shiftType));
  const mySchedules = schedules.filter((s) => s.userId === user?.id && (s.shiftType === 'duty' || s.shiftType === 'night_duty'));
  const monthAbsencesRaw = schedules.filter((s) => s.shiftType === 'leave' || s.shiftType === 'conference');

  // 연속 날짜 병합: 같은 사람+같은 타입의 연속 날짜를 범위로 합침
  const monthAbsences = (() => {
    if (monthAbsencesRaw.length === 0) return [];
    const sorted = [...monthAbsencesRaw].sort((a, b) => {
      const key = (s: typeof a) => `${s.userId}-${s.shiftType}-${s.date}`;
      return key(a).localeCompare(key(b));
    });
    const groups: { startDate: string; endDate: string; shiftType: string; user: typeof sorted[0]['user']; note?: string | null; ids: string[] }[] = [];
    for (const s of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.user?.id === s.user?.id && last.shiftType === s.shiftType) {
        // 연속 날짜인지 확인
        const lastEnd = new Date(last.endDate + 'T00:00:00');
        const cur = new Date(s.date + 'T00:00:00');
        const diffDays = (cur.getTime() - lastEnd.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          last.endDate = s.date;
          last.ids.push(s.id);
          continue;
        }
      }
      groups.push({ startDate: s.date, endDate: s.date, shiftType: s.shiftType, user: s.user, note: s.note, ids: [s.id] });
    }
    return groups;
  })();
  const recentNotifs = notifications.slice(0, 5);

  // 남은 방수
  const [roomCount, setRoomCount] = useState<number | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);

  useEffect(() => {
    getRemainingRooms(dutyDateStr).then((data) => {
      setRoomCount(data?.count ?? null);
    });
  }, [dutyDateStr]);

  const handleRoomChange = useCallback(async (value: number) => {
    setRoomCount(value);
    setRoomLoading(true);
    await upsertRemainingRooms(dutyDateStr, value);
    setRoomLoading(false);
  }, [dutyDateStr]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">대시보드</h1>

      {/* 오늘의 당직 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500">
            오늘의 당직 ({dutyDateStr})
            {dutyDateStr !== today && <span className="text-xs text-blue-500 ml-1">08시 교대 전</span>}
          </h2>
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
              const isNightDuty = s.shiftType === 'night_duty';
              return (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg ${isNightDuty ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isNightDuty ? 'bg-indigo-100 text-indigo-700' : posColor ? posColor.bg + ' ' + posColor.text : 'bg-blue-100 text-blue-700'}`}>
                    {s.user?.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {s.user?.name || '미지정'}
                      {isNightDuty && <span className="ml-1 text-xs text-indigo-500">(백당)</span>}
                    </p>
                    <Badge variant={isNightDuty ? 'indigo' : pos === '교수' ? 'green' : pos === '전공의' ? 'amber' : 'slate'}>
                      {isNightDuty ? '백당' : pos || '미지정'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 17:30 남은 방수 */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
          <span className="text-sm font-semibold text-slate-500">5:30PM 남은 방수</span>
          <select
            value={roomCount ?? ''}
            onChange={(e) => handleRoomChange(Number(e.target.value))}
            disabled={roomLoading}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>선택</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          {roomCount !== null && (
            <span className="text-sm text-slate-400">방</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 통계 카드 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 text-center">
            <p className="text-3xl font-bold text-blue-600">{mySchedules.length}</p>
            <p className="text-xs text-slate-500 mt-1">이번달 내 당직</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 text-center">
            <p className="text-3xl font-bold text-orange-500">{todayOff.length}</p>
            <p className="text-xs text-slate-500 mt-1">금일 부재자</p>
            {todayOff.length > 0 && (
              <div className="mt-2 space-y-1">
                {todayOff.map((s) => (
                  <div key={s.id} className="text-xs text-slate-500">
                    {s.user?.name} <span className="text-slate-400">({SHIFT_LABELS[s.shiftType]})</span>
                  </div>
                ))}
              </div>
            )}
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

      {/* 이번달 연차/학회 */}
      {monthAbsences.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-500 mb-3">
            이번달 연차/학회 ({monthAbsences.length}건)
          </h2>
          <div className="space-y-2">
            {monthAbsences.map((g) => {
              const shiftColor = g.shiftType === 'leave'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-violet-100 text-violet-800';
              const startObj = new Date(g.startDate + 'T00:00:00');
              const startWd = ['일', '월', '화', '수', '목', '금', '토'][startObj.getDay()];
              const isRange = g.startDate !== g.endDate;
              let dateDisplay: string;
              if (isRange) {
                const endObj = new Date(g.endDate + 'T00:00:00');
                const endWd = ['일', '월', '화', '수', '목', '금', '토'][endObj.getDay()];
                dateDisplay = `${g.startDate.slice(5)}(${startWd})~${g.endDate.slice(5)}(${endWd})`;
              } else {
                dateDisplay = `${g.startDate.slice(5)} (${startWd})`;
              }
              return (
                <div key={g.ids[0]} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500 shrink-0">
                    {dateDisplay}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${shiftColor}`}>
                    {SHIFT_LABELS[g.shiftType]}
                  </span>
                  <span className="text-slate-700">{g.user?.name || '미지정'}</span>
                  {g.user?.position && (
                    <span className="text-xs text-slate-400">{g.user.position}</span>
                  )}
                  {g.note && (
                    <span className="text-xs text-slate-400">({g.note})</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
