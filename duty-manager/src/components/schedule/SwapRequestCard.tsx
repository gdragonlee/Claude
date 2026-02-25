'use client';

import type { SwapRequest } from '@/lib/types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { SHIFT_LABELS } from '@/lib/utils/constants';

interface SwapRequestCardProps {
  request: SwapRequest;
  currentUserId: string;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export default function SwapRequestCard({
  request,
  currentUserId,
  onApprove,
  onReject,
}: SwapRequestCardProps) {
  const isTarget = request.targetUserId === currentUserId;
  const statusBadge = {
    pending: { variant: 'amber' as const, label: '대기중' },
    approved: { variant: 'green' as const, label: '승인됨' },
    rejected: { variant: 'red' as const, label: '거절됨' },
  }[request.status];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-slate-800">
            {request.requester?.name || '알 수 없음'} → {request.targetUser?.name || '알 수 없음'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {request.schedule?.date} {SHIFT_LABELS[request.schedule?.shiftType || ''] || ''}
          </p>
        </div>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>
      {request.status === 'pending' && isTarget && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="success" onClick={() => onApprove(request.id)}>
            승인
          </Button>
          <Button size="sm" variant="danger" onClick={() => onReject(request.id)}>
            거절
          </Button>
        </div>
      )}
    </div>
  );
}
