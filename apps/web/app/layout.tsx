import type { Metadata } from 'next';
import { Inter, Cal_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const calSans = Cal_Sans({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'TrackJob',
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
      className={cn(inter.variable, calSans.variable)}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
