import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'pink' | 'purple' | 'green' | 'amber' | 'red' | 'slate';
  className?: string;
}

const variants = {
  blue: 'bg-blue-100 text-blue-800',
  pink: 'bg-pink-100 text-pink-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  slate: 'bg-slate-100 text-slate-700',
};

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block text-xs font-medium px-2 py-0.5 rounded',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
