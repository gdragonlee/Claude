'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useUnreadMessages } from '@/lib/hooks/useMessages';
import { clsx } from 'clsx';

const ITEMS = [
  { href: '/dashboard', label: '홈', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/calendar', label: '캘린더', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/absence', label: '부재', icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M10 7a4 4 0 100-8 4 4 0 000 8M17 8l4 4m0-4l-4 4' },
  { href: '/messages', label: '메시지', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/notifications', label: '알림', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { unreadCount: unreadMessages } = useUnreadMessages();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex-1 flex flex-col items-center py-2 text-[10px] transition-colors relative',
                active ? 'text-blue-600' : 'text-slate-400'
              )}
            >
              <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2 : 1.5} d={item.icon} />
              </svg>
              {item.label}
              {item.href === '/notifications' && unreadCount > 0 && (
                <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {item.href === '/messages' && unreadMessages > 0 && (
                <span className="absolute top-1 right-1/4 bg-blue-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
