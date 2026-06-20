import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="ApplyWise"
            width={850}
            height={208}
            priority
            className="h-8 w-auto dark:brightness-0 dark:invert"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
