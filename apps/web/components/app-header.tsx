import Image from 'next/image';

import { AddApplicationDialog } from '@/components/board/add-application-dialog';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { UserMenu } from '@/components/auth/user-menu';

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="bg-background/70 supports-backdrop-filter:bg-background/55 sticky top-0 z-20 border-b backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Logo shows only on mobile; the sidebar carries it on desktop. */}
        <Image
          src="/logo.png"
          alt="ApplyWise"
          width={850}
          height={208}
          priority
          className="h-7 w-auto md:hidden dark:brightness-0 dark:invert"
        />

        <div className="ml-auto flex items-center gap-2">
          <AddApplicationDialog />
          <div className="bg-border mx-0.5 hidden h-6 w-px sm:block" />
          <ModeToggle />
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
