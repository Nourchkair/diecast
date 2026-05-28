'use client';

import Link from 'next/link';
import Image from 'next/image';

type SharedGarageItem = {
  itemId: string;
  item: {
    id: string;
    displayName: string;
    brand: string;
    make: string;
    model: string;
    year: number | null;
    images: Array<{ id: string; filePath: string; isPrimary: boolean }>;
    user: { displayName: string | null; username: string } | null;
  };
};

type Props = {
  entry: SharedGarageItem;
};

export function SharedGarageItemCard({ entry }: Props) {
  const image = entry.item.images.find((current) => current.isPrimary) ?? entry.item.images[0];
  const owner = entry.item.user?.displayName ?? entry.item.user?.username ?? 'Unknown';

  return (
    <div className="space-y-2">
      <Link href={`/collection/${entry.itemId}`} className="block rounded-[1.8rem] border border-white/8 bg-white/5 p-3 transition hover:-translate-y-0.5 hover:bg-white/8">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-zinc-900">
            {image ? (
              <Image src={image.filePath} alt={entry.item.displayName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">No photo</div>
            )}
          </div>

          <div className="flex items-start justify-between gap-3 px-1 pb-1">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-white">{entry.item.displayName}</h3>
              <p className="mt-1 truncate text-xs text-zinc-400">{entry.item.brand} {entry.item.year ?? ''}</p>
            </div>
          </div>
        </div>
      </Link>

      <div className="px-1">
        <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200">For {owner}</span>
      </div>
    </div>
  );
}
