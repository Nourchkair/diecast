'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CarFront, Settings2, Users2 } from 'lucide-react';

const items = [
  { href: '/collection', label: 'Collection', icon: CarFront },
  { href: '/friends', label: 'Network', icon: Users2 },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/login')) return null;

  return (
    <nav
      className="z-[80] px-3 sm:px-2"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) * 0.5)',
      }}
    >
      <div className="relative mx-auto w-full max-w-[34rem] rounded-full border border-white/15 bg-zinc-950/90 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
        <div className="grid grid-cols-4 gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] font-medium tracking-[0.02em] transition sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-[11px] ${active ? 'bg-white/10 text-emerald-300' : 'text-zinc-100 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-300' : 'text-zinc-300'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
