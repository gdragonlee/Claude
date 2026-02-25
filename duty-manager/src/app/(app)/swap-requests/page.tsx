'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useSwapRequests } from '@/lib/hooks/useSwapRequests';
import SwapRequestCard from '@/components/schedule/SwapRequestCard';
import EmptyState from '@/components/ui/EmptyState';

export default function SwapRequestsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { requests, respond } = useSwapRequests();

  const handleApprove = async (id: string) => {
    try {
      await respond(id, 'approved');
      addToast('교대 요청을 승인했습니다.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '승인 실패', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await respond(id, 'rejected');
      addToast('교대 요청을 거절했습니다.', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '거절 실패', 'error');
    }
  };

  if (!user) return null;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">교대 요청</h1>
      {requests.length === 0 ? (
        <EmptyState message="교대 요청이 없습니다." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <SwapRequestCard
              key={r.id}
              request={r}
              currentUserId={user.id}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
