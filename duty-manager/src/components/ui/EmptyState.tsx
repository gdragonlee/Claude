interface EmptyStateProps {
  message: string;
  sub?: string;
}

export default function EmptyState({ message, sub }: EmptyStateProps) {
  return (
    <div className="text-center py-10 text-slate-400">
      <p className="mb-1">{message}</p>
      {sub && <p className="text-sm">{sub}</p>}
    </div>
  );
}
