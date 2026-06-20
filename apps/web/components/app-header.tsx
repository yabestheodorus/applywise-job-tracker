import Image from 'next/image';

import { AddApplicationDialog } from '@/components/board/add-application-dialog';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { UserMenu } from '@/components/auth/user-menu';

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-6">
        {/* Logo shows only on mobile; the sidebar carries it on desktop. */}
        <Image
          src="/logo.png"
          alt="ApplyWise"
          width={850}
          height={208}
          priority
          className="h-7 w-auto md:hidden dark:brightness-0 dark:invert"
        />

        <div className="ml-auto flex items-center gap-1.5">
          <AddApplicationDialog />
          <ModeToggle />
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
