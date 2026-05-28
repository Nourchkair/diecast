'use client';

import { useState } from 'react';
import { GarageItemManager } from '@/components/garage-item-manager';

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

export function GarageAddCarsPanel({ slug, ownedItems, linkedItemIds }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setOpen((current) => !current)} className="w-full rounded-2xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
        {open ? 'Close add car' : 'Add car'}
      </button>
      {open ? <GarageItemManager slug={slug} ownedItems={ownedItems} linkedItemIds={linkedItemIds} /> : null}
    </div>
  );
}
