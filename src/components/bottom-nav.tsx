'use client';

import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CarFront, ChevronLeft, ChevronRight, GripHorizontal, Settings2 } from 'lucide-react';

type Side = 'left' | 'right';

const items = [
  { href: '/collection', label: 'Collection', icon: CarFront },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [side, setSide] = useState<Side>('right');
  const dragRef = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const activeItem = useMemo(() => items.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)) ?? items[0], [pathname]);
  if (pathname?.startsWith('/login')) return null;
  const ActiveIcon = activeItem.icon;
  const ExpandIcon = side === 'left' ? ChevronRight : ChevronLeft;

  function expand() {
    setCollapsed(false);
  }

  function collapse(nextSide: Side) {
    setSide(nextSide);
    setCollapsed(true);
  }

  function handleGripPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    dragRef.current = { startX, startY, moved: false };

    const cleanup = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dragRef.current = null;
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 24 || Math.abs(dy) > 24) dragRef.current.moved = true;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        collapse(dx < 0 ? 'left' : 'right');
        cleanup();
      }
    };

    const onPointerUp = () => {
      if (!dragRef.current) return;
      if (!dragRef.current.moved) collapse('right');
      cleanup();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  if (collapsed) {
    return (
      <nav className={`fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30 ${side === 'left' ? 'left-4' : 'right-4'}`}>
        <button
          type="button"
          onClick={expand}
          className="inline-flex h-14 items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-4 text-white shadow-2xl shadow-black/40 backdrop-blur-2xl transition hover:bg-white/10 active:scale-[0.98]"
          aria-label="Expand navigation"
          title="Expand navigation"
        >
          <ActiveIcon className="h-4 w-4 shrink-0 text-emerald-300" />
          <ExpandIcon className="h-4 w-4 shrink-0 text-zinc-400" />
        </button>
      </nav>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-30 px-2">
      <div className="relative mx-auto w-[calc(100vw-1rem)] max-w-[34rem] rounded-full border border-white/10 bg-zinc-950/50 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <button
          type="button"
          onPointerDown={handleGripPointerDown}
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-zinc-400 shadow-lg shadow-black/20"
          aria-label="Drag to collapse navigation"
          title="Drag to collapse navigation"
        >
          <GripHorizontal className="h-4 w-4" />
        </button>

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
