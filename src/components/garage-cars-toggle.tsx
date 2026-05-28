'use client';

import { useState } from 'react';
import Link from 'next/link';

type GarageItem = {
  itemId: string;
  item: {
    id: string;
    displayName: string;
    brand: string;
    make: string;
    model: string;
    images: Array<{ id: string; filePath: string; isPrimary: boolean }>;
  };
  addedBy: { displayName: string | null; username: string };
};

type Props = {
  items: GarageItem[];
};

export function GarageCarsToggle({ items }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-2xl px-4 py-3 text-sm font-semibold"
        style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}
      >
        {open ? 'Close garage' : 'Enter garage'}
      </button>

      {open ? (
        items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((link) => {
              const image = link.item.images.find((entry) => entry.isPrimary) ?? link.item.images[0];
              return (
                <Link key={link.itemId} href={`/collection/${link.itemId}`} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300 transition hover:bg-zinc-900/80">
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                      {image ? <img src={image.filePath} alt={link.item.displayName} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white">{link.item.displayName}</div>
                      <div className="text-xs text-zinc-500">{link.item.brand} {link.item.make} {link.item.model}</div>
                      <div className="mt-1 text-xs text-zinc-500">Added by {link.addedBy.displayName ?? link.addedBy.username}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : <p className="text-sm text-zinc-400">No cars added yet.</p>
      ) : null}
    </div>
  );
}
