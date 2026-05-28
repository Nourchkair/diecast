'use client';

import { useRef, useState, type TouchEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type DiecastItem } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, PencilLine, Star, Trash2 } from 'lucide-react';

type ItemCardProps = {
  item: DiecastItem & {
    images: { id: string; filePath: string; isPrimary: boolean; altText: string | null }[];
    tags: { tag: { name: string; color: string | null } }[];
  };
};

export function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlist, setIsWishlist] = useState(item.isWishlist);
  const [busyAction, setBusyAction] = useState<'wishlist' | 'delete' | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const images = item.images.length ? item.images : [];
  const displayedImageIndex = images.length ? activeImageIndex % images.length : 0;
  const activeImage = images[displayedImageIndex] ?? images[0] ?? null;

  async function toggleWishlist() {
    const nextValue = !isWishlist;
    setBusyAction('wishlist');
    setIsWishlist(nextValue);
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWishlist: nextValue }),
      });
      if (!response.ok) throw new Error('Could not update favorite');
      router.refresh();
    } catch {
      setIsWishlist(!nextValue);
    } finally {
      setBusyAction(null);
    }
  }

  async function deleteItem() {
    const confirmed = window.confirm(`Delete ${item.displayName}? This cannot be undone.`);
    if (!confirmed) return;

    setBusyAction('delete');
    try {
      const response = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      router.refresh();
    } finally {
      setBusyAction(null);
    }
  }

  function goToImage(nextIndex: number) {
    if (!images.length) return;
    setActiveImageIndex((nextIndex + images.length) % images.length);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX === null || !images.length) return;

    const endX = event.changedTouches[0]?.clientX ?? startX;
    const delta = endX - startX;
    if (Math.abs(delta) < 40) return;

    goToImage(delta < 0 ? displayedImageIndex + 1 : displayedImageIndex - 1);
  }

  return (
    <article className="group rounded-[1.8rem] border border-white/8 bg-white/5 p-3 transition hover:-translate-y-0.5 hover:bg-white/8">
      <div className="space-y-3">
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-zinc-900"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          {activeImage ? (
            <Image src={activeImage.filePath} alt={item.displayName} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">No photo</div>
          )}

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goToImage(displayedImageIndex - 1)}
                className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goToImage(displayedImageIndex + 1)}
                className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
                aria-label="Next photo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}

          <div className="absolute inset-x-0 bottom-2 flex items-center justify-between gap-2 px-2">
            <div className="rounded-full bg-zinc-950/80 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-black/30 backdrop-blur">
              {images.length ? `${displayedImageIndex + 1}/${images.length}` : '0/0'}
            </div>
            {item.quantityOwned > 1 ? (
              <div className="rounded-full bg-zinc-950/80 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-black/30 backdrop-blur">
                x{item.quantityOwned}
              </div>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="absolute inset-x-0 bottom-10 flex justify-center gap-1.5">
              {images.map((image, index) => (
                <span
                  key={image.id}
                  className={`h-1.5 rounded-full transition-all ${index === displayedImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/45'}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-3 px-1 pb-1">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{item.displayName}</h3>
            <p className="mt-1 truncate text-xs text-zinc-400">{item.brand} {item.year ?? ''}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link href={`/collection/${item.id}/edit`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10" aria-label="Edit listing">
              <PencilLine className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => void toggleWishlist()}
              disabled={busyAction === 'wishlist'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-50"
              aria-label={isWishlist ? 'Remove from favourites' : 'Add to favourites'}
              aria-pressed={isWishlist}
            >
              <Star className="h-4 w-4" fill={isWishlist ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => void deleteItem()}
              disabled={busyAction === 'delete'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
              aria-label="Delete listing"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
