'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type DiecastItem } from '@prisma/client';

type ItemCardProps = {
  item: DiecastItem & {
    images: { id: string; filePath: string; isPrimary: boolean; altText: string | null }[];
    tags: { tag: { name: string; color: string | null } }[];
  };
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

export function ItemCard({ item }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const primaryImage = item.images.find((image) => image.isPrimary) ?? item.images[0];

  return (
    <button
      type="button"
      onClick={() => setExpanded((current) => !current)}
      aria-expanded={expanded}
      className="group block rounded-[1.8rem] border border-white/8 bg-white/5 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white/8"
    >
      <div className="space-y-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-zinc-900">
          {primaryImage ? (
            <Image src={primaryImage.filePath} alt={item.displayName} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">No photo</div>
          )}
          {item.quantityOwned > 1 ? (
            <div className="absolute bottom-2 right-2 rounded-full bg-zinc-950/80 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-black/30 backdrop-blur">
              x{item.quantityOwned}
            </div>
          ) : null}
        </div>

        <div className="px-1 pb-1">
          <h3 className="truncate text-sm font-semibold text-white">{item.displayName}</h3>
          <p className="mt-1 truncate text-xs text-zinc-400">{item.brand}</p>
        </div>

        {expanded ? (
          <div className="space-y-2 border-t border-white/8 pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Info label="Brand" value={item.brand} />
              <Info label="Make" value={item.make} />
              <Info label="Model" value={item.model} />
              <Info label="Year" value={item.year ? String(item.year) : '—'} />
              <Info label="Vehicle type" value={item.vehicleType} />
              <Info label="Color" value={item.color ?? '—'} />
              <Info label="Acquired" value={item.acquiredDate ? new Date(item.acquiredDate).toLocaleDateString() : '—'} />
              <Info label="Source" value={item.acquiredFrom ?? '—'} />
              <Info label="Wishlist" value={item.isWishlist ? 'Yes' : 'No'} />
            </div>
            {item.notes ? <p className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">{item.notes}</p> : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}
