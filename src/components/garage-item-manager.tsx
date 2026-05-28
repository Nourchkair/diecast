'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type OwnedItem = {
  id: string;
  displayName: string;
  images: Array<{ id: string; filePath: string; isPrimary: boolean }>;
};

type Props = {
  slug: string;
  ownedItems: OwnedItem[];
  linkedItemIds: string[];
};

export function GarageItemManager({ slug, ownedItems, linkedItemIds }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(itemId: string, linked: boolean) {
    setBusyId(itemId);
    try {
      const response = await fetch(`/api/garages/${slug}/items`, {
        method: linked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Could not update garage');
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (!ownedItems.length) return <p className="text-sm text-zinc-400">No owned cars to share yet.</p>;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {ownedItems.map((item) => {
        const linked = linkedItemIds.includes(item.id);
        const image = item.images.find((entry) => entry.isPrimary) ?? item.images[0];
        return (
          <div key={item.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl bg-white/5">
                {image ? <img src={image.filePath} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{item.displayName}</p>
                <p className="text-xs text-zinc-500">{linked ? 'In this garage' : 'Not in this garage'}</p>
              </div>
            </div>
            <button type="button" onClick={() => void toggle(item.id, linked)} disabled={busyId === item.id} className="mt-3 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white disabled:opacity-50">
              {busyId === item.id ? 'Updating…' : linked ? 'Remove from garage' : 'Add to garage'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
