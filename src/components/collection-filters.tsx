'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { vehicleTypes } from '@/lib/constants';

type Props = {
  searchParams: Record<string, string | undefined>;
  brands: string[];
};

type FilterState = {
  q: string;
  brand: string;
  type: string;
  sort: string;
  wishlist: boolean;
};

const sortOptions = [
  { value: 'created-desc', label: 'Recently added' },
  { value: 'name-asc', label: 'Name A→Z' },
  { value: 'name-desc', label: 'Name Z→A' },
] as const;

function toState(searchParams: Record<string, string | undefined>): FilterState {
  return {
    q: searchParams.q ?? '',
    brand: searchParams.brand ?? '',
    type: searchParams.type ?? '',
    sort: searchParams.sort ?? 'created-desc',
    wishlist: searchParams.wishlist === '1',
  };
}

function filterPillClass(active = false) {
  return `rounded-full border px-3 py-1.5 text-xs font-medium ${active ? 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200' : 'border-white/10 bg-white/5 text-zinc-300'}`;
}

export function CollectionFilters({ searchParams, brands }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const closeTimerRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [draft, setDraft] = useState<FilterState>(() => toState(searchParams));
  const applied = toState(searchParams);

  useEffect(() => {
    if (!panelOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [panelOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  function closePanel() {
    setPanelVisible(false);
    setPanelExpanded(false);
    closeTimerRef.current = window.setTimeout(() => setPanelOpen(false), 220);
  }

  function openPanel() {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setPanelExpanded(false);
    setPanelOpen(true);
    window.requestAnimationFrame(() => setPanelVisible(true));
  }

  function applyFilters(next = draft) {
    const params = new URLSearchParams();
    const q = next.q.trim();
    if (q) params.set('q', q);
    if (next.brand) params.set('brand', next.brand);
    if (next.type) params.set('type', next.type);
    if (next.sort) params.set('sort', next.sort);
    if (next.wishlist) params.set('wishlist', '1');
    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(url);
    closePanel();
  }

  function resetFilters() {
    const next = { q: '', brand: '', type: '', sort: 'created-desc', wishlist: false };
    setDraft(next);
    applyFilters(next);
  }

  function handleSheetPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    dragRef.current = { startX, startY };

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
      if (Math.abs(dy) < 24 && Math.abs(dx) < 24) return;
      if (dy < -60 && !panelExpanded) {
        setPanelExpanded(true);
      }
      if (dy > 70) {
        closePanel();
        cleanup();
      }
    };

    const onPointerUp = () => {
      cleanup();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  const activePills = [
    applied.q ? { key: 'q', label: `Search: ${applied.q}` } : null,
    applied.brand ? { key: 'brand', label: applied.brand } : null,
    applied.type ? { key: 'type', label: vehicleTypes.find((type) => type.value === applied.type)?.label ?? applied.type } : null,
    applied.sort && applied.sort !== 'created-desc' ? { key: 'sort', label: sortOptions.find((option) => option.value === applied.sort)?.label ?? applied.sort } : null,
    applied.wishlist ? { key: 'wishlist', label: 'Wishlist only' } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="relative">
          <input
            type="search"
            value={draft.q}
            onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
            placeholder="Search cars"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 py-3 pl-4 pr-16 text-white placeholder:text-zinc-600 outline-none"
          />
          <button
            type="button"
            onClick={openPanel}
            aria-label="Open filters"
            className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 active:scale-[0.98]"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button type="submit" className="sr-only">
            Search
          </button>
        </div>

        {activePills.length ? (
          <div className="flex flex-wrap gap-2">
            {activePills.map((pill) => (
              <span key={pill.key} className={filterPillClass(true)}>
                {pill.label}
              </span>
            ))}
          </div>
        ) : null}
      </form>

      {panelOpen ? (
        <div className="fixed inset-0 z-[90] bg-black/60" onClick={closePanel}>
          <div
            ref={sheetRef}
            className={`absolute inset-x-0 bottom-0 mx-auto w-[min(42rem,calc(100vw-0.75rem))] overflow-hidden rounded-t-[2rem] border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/60 backdrop-blur-2xl transition-all duration-300 ease-out ${panelExpanded ? 'top-0 h-full w-full rounded-none' : 'h-[78vh] max-h-[78vh]'} ${panelVisible ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <button
                type="button"
                onPointerDown={handleSheetPointerDown}
                className="flex items-center justify-center py-3"
                aria-label="Drag panel"
                title="Drag up to expand or down to close"
              >
                <span className="h-1.5 w-12 rounded-full bg-white/15" />
              </button>

              <div className="flex items-start justify-between gap-3 px-4 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Filters</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Refine collection</h3>
                </div>
                <button type="button" onClick={closePanel} className="rounded-2xl border border-white/10 p-2 text-white" aria-label="Close filters">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm text-zinc-300">Brand</span>
                    <select
                      value={draft.brand}
                      onChange={(event) => setDraft((current) => ({ ...current, brand: event.target.value }))}
                      className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                    >
                      <option value="">All brands</option>
                      {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm text-zinc-300">Type</span>
                    <select
                      value={draft.type}
                      onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                      className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                    >
                      <option value="">All types</option>
                      {vehicleTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm text-zinc-300">Sort</span>
                    <select
                      value={draft.sort}
                      onChange={(event) => setDraft((current) => ({ ...current, sort: event.target.value }))}
                      className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white"
                    >
                      {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white md:col-span-2">
                    <input type="checkbox" checked={draft.wishlist} onChange={(event) => setDraft((current) => ({ ...current, wishlist: event.target.checked }))} />
                    Wishlist only
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                   <button type="button" onClick={() => applyFilters()} className="rounded-2xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
                    Apply filters
                  </button>
                  <button type="button" onClick={resetFilters} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
