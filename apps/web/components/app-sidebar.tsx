'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarClock,
  FileText,
  GraduationCap,
  Layers,
  LayoutGrid,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Workspace',
    items: [
      { href: '/board', label: 'Board', icon: LayoutGrid },
      { href: '/upcoming', label: 'Upcoming', icon: CalendarClock },
    ],
  },
  {
    heading: 'Library',
    items: [
      { href: '/profile', label: 'Profile', icon: User },
      { href: '/skills', label: 'Skills', icon: GraduationCap },
      { href: '/stages', label: 'Stages', icon: Layers },
      { href: '/templates', label: 'Templates', icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/board" className="flex items-center">
          <Image
            src="/logo.png"
            alt="ApplyWise"
            width={850}
            height={208}
            priority
            className="h-7 w-auto dark:brightness-0 dark:invert"
          />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-6 px-3 py-3">
        {NAV.map((group) => (
          <div key={group.heading} className="flex flex-col gap-1">
            <p className="text-muted-foreground/70 px-3 pb-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase">
              {group.heading}
            </p>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
                  )}
                >
                  {/* active accent bar */}
                  <span
                    className={cn(
                      'bg-primary absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full transition-all',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* footer tip card */}
      <div className="p-3">
        <div className="from-primary/10 border-primary/15 relative overflow-hidden rounded-xl border bg-linear-to-br to-transparent p-3.5">
          <div className="text-primary mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            AI-powered
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Paste any recruiter message — ApplyWise extracts and tracks it for
            you.
          </p>
        </div>
      </div>
    </aside>
  );
}
