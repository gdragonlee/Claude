'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

const SETTINGS_KEY = 'duty_settings';

interface AppSettings {
  defaultShiftType: 'day' | 'night' | 'both';
  excludeWeekendsByDefault: boolean;
  schedulePollingInterval: number;
  notificationPollingInterval: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultShiftType: 'day',
  excludeWeekendsByDefault: false,
  schedulePollingInterval: 30,
  notificationPollingInterval: 15,
};

function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
    setSettings(getSettings());
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const handleSave = () => {
    setLoading(true);
    try {
      saveSettings(settings);
      addToast('설정이 저장되었습니다.', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    addToast('설정이 초기화되었습니다.', 'info');
  };

  const handleClearAllData = () => {
    if (!confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('정말로 초기화하시겠습니까? 모든 일정, 알림, 교대 요청이 삭제됩니다.')) return;

    localStorage.removeItem('duty_schedules');
    localStorage.removeItem('duty_swap_requests');
    localStorage.removeItem('duty_notifications');
    addToast('일정 데이터가 초기화되었습니다.', 'success');
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">설정</h1>
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">자동 배정 기본값</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">기본 당직 유형</label>
              <select
                value={settings.defaultShiftType}
                onChange={(e) => setSettings({ ...settings, defaultShiftType: e.target.value as AppSettings['defaultShiftType'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">주간당직</option>
                <option value="night">야간당직</option>
                <option value="both">주간+야간</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.excludeWeekendsByDefault}
                onChange={(e) => setSettings({ ...settings, excludeWeekendsByDefault: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              기본적으로 주말 제외
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">동기화 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">일정 새로고침 주기 (초)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={settings.schedulePollingInterval}
                onChange={(e) => setSettings({ ...settings, schedulePollingInterval: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">알림 새로고침 주기 (초)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={settings.notificationPollingInterval}
                onChange={(e) => setSettings({ ...settings, notificationPollingInterval: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">데이터 관리</h2>
          <p className="text-xs text-slate-500 mb-3">
            일정, 교대 요청, 알림 데이터를 초기화합니다. 사용자 계정은 유지됩니다.
          </p>
          <Button variant="danger" onClick={handleClearAllData}>
            일정 데이터 초기화
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? '저장 중...' : '설정 저장'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            기본값 복원
          </Button>
        </div>
      </div>
    </div>
  );
}
