'use client';

import { useEffect, useState } from 'react';
import { Plus, UserPlus, Warehouse, X } from 'lucide-react';
import { FriendRequestForm } from '@/components/friend-request-form';
import { GarageCreateForm } from '@/components/garage-create-form';

type PanelKey = 'friend' | 'garage' | null;

export function NetworkActionPanels() {
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);

  useEffect(() => {
    if (!openPanel) return undefined;
    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [openPanel]);

  return (
    <>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpenPanel('friend')}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-foreground)] transition hover:opacity-90"
          aria-label="Add friend"
        >
          <UserPlus className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setOpenPanel('garage')}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-[var(--app-accent-foreground)] transition hover:opacity-90"
          aria-label="Create shared garage"
        >
          <span className="relative inline-flex h-5 w-5 items-center justify-center">
            <Warehouse className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--app-accent)] text-[var(--app-accent-foreground)]">
              <Plus className="h-2.5 w-2.5" aria-hidden="true" />
            </span>
          </span>
        </button>
      </div>

      <div className={`fixed inset-0 z-[100] transition ${openPanel ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!openPanel}>
        <button
          type="button"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${openPanel ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpenPanel(null)}
        />

        <div
          className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl rounded-t-[2rem] border border-white/10 bg-zinc-950/96 shadow-2xl shadow-black/60 backdrop-blur-2xl ${openPanel ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: openPanel ? 'translateY(0)' : 'translateY(140%)', transition: 'transform 300ms ease-out, opacity 300ms ease-out' }}
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Network</p>
              <h2 className="mt-2 text-lg font-semibold text-white">{openPanel === 'friend' ? 'Add friend' : 'Create shared garage'}</h2>
            </div>
            <button type="button" onClick={() => setOpenPanel(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {openPanel === 'friend' ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">Search by email, username, or user code and send a request.</p>
                <FriendRequestForm />
              </div>
            ) : null}

            {openPanel === 'garage' ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">Create a shared garage and invite friends later.</p>
                <GarageCreateForm />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
