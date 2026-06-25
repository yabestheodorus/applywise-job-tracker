import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Cal_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ThemeScript } from '@/components/theme/theme-script';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Analytics } from '@vercel/analytics/next';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});
const calSans = Cal_Sans({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'ApplyWise',
  description: 'AI-assisted job application tracker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(jakarta.variable, calSans.variable)}
    >
      <body className="font-sans antialiased">
        <ThemeScript />
        <ThemeProvider defaultTheme="system" disableTransitionOnChange>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
