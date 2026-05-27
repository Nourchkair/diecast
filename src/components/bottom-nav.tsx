'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CarFront, Settings2 } from 'lucide-react';

const items = [
  { href: '/collection', label: 'Collection', icon: CarFront },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/login')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30 px-2">
      <div className="relative mx-auto w-[calc(100vw-1rem)] max-w-[34rem] rounded-full border border-white/10 bg-zinc-950/50 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="grid grid-cols-3 gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex items-center justify-center gap-2 rounded-full px-3 py-3 text-[11px] font-medium tracking-[0.02em] transition ${active ? 'bg-white/10 text-emerald-300' : 'text-zinc-200 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-300' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
