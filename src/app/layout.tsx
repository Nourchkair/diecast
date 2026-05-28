import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/bottom-nav';
import { getCurrentUser } from '@/lib/auth';
import { getUserThemeSettings } from '@/lib/preferences';
import { buildBodyBackground, buildThemeVariables, defaultThemeSettings } from '@/lib/theme';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Diecast Collection',
  description: 'Mobile-first diecast collection tracker',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const theme = user ? getUserThemeSettings(user) : defaultThemeSettings;
  const bodyStyle = buildBodyBackground(theme);
  const themeVariables = buildThemeVariables(theme);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body
        className="min-h-full text-white"
        style={{
          ...bodyStyle,
          ...themeVariables,
        } as CSSProperties}
      >
        <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
