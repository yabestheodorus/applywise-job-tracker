'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarClock, FileText, Layers, LayoutGrid, User } from 'lucide-react';

import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Board', icon: LayoutGrid },
  { href: '/upcoming', label: 'Upcoming', icon: CalendarClock },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/stages', label: 'Stages', icon: Layers },
  { href: '/templates', label: 'Templates', icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-60 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center px-5">
        <Image
          src="/logo.png"
          alt="ApplyWise"
          width={850}
          height={208}
          priority
          className="h-7 w-auto dark:brightness-0 dark:invert"
        />
      </div>
      <nav className="flex flex-col gap-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
