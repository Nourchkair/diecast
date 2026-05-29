import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { findMatches } from '@/lib/match';
import { DeleteButton } from '@/components/delete-button';
import { requireCurrentUser } from '@/lib/auth';
import { CarSocialPanel } from '@/components/car-social-panel';
import { canonicalFriendPair, getCarComments, hasCarFavorite, hasCarWishlist } from '@/lib/social';

type Params = Promise<{ id: string }>;

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const visibleItem = await prisma.diecastItem.findUnique({
    where: { id },
    include: { images: true, tags: { include: { tag: true } }, garageLinks: { include: { garage: true } } },
  });
  if (!visibleItem) notFound();

  const friendship = visibleItem.userId ? await prisma.friendship.findUnique({
    where: { userAId_userBId: canonicalFriendPair(user.id, visibleItem.userId) },
  }).catch(() => null) : null;
  const garageAccess = await prisma.garageItem.findFirst({
    where: {
      itemId: id,
      garage: { members: { some: { userId: user.id } } },
    },
  });

  if (visibleItem.userId !== user.id && !friendship && !garageAccess) notFound();

  const canSeeDuplicates = visibleItem.userId === user.id;
  const matches = canSeeDuplicates ? (await findMatches({
    id: visibleItem.id,
    displayName: visibleItem.displayName,
    brand: visibleItem.brand,
    make: visibleItem.make,
    model: visibleItem.model,
    year: visibleItem.year,
    vehicleType: visibleItem.vehicleType,
    color: visibleItem.color,
    productCode: visibleItem.productCode,
    barcode: visibleItem.barcode,
  }, user.id)).filter((match) => match.id !== visibleItem.id).slice(0, 4) : [];
  const primaryImage = visibleItem.images.find((image) => image.isPrimary) ?? visibleItem.images[0];
  const comments = await getCarComments(visibleItem.id);
  const favorite = await hasCarFavorite(user.id, visibleItem.id);
  const wishlist = await hasCarWishlist(user.id, visibleItem.id);
  const owner = await prisma.userProfile.findUnique({ where: { userId: visibleItem.userId ?? user.id } });

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/collection" className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-200">Back</Link>
        <div className="flex gap-2">
          {visibleItem.userId === user.id ? (
            <>
              <Link href={`/collection/${visibleItem.id}/edit`} className="rounded-2xl px-4 py-2 text-sm font-semibold" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>Edit</Link>
              <DeleteButton itemId={visibleItem.id} />
            </>
          ) : null}
        </div>
      </div>

      <section className="grid gap-5 rounded-[2.25rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 md:grid-cols-[280px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-zinc-900">
          {primaryImage ? <Image src={primaryImage.filePath} alt={visibleItem.displayName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 280px" /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">No photo yet</div>}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">{visibleItem.brand}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{visibleItem.displayName}</h1>
            <p className="mt-2 text-sm text-zinc-400">{visibleItem.make} {visibleItem.model} • {visibleItem.year ?? 'Unknown year'}</p>
            {owner ? <p className="mt-2 text-xs text-zinc-500">Owned by {owner.displayName ?? owner.username}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-200">Type: {visibleItem.vehicleType}</span>
            {wishlist ? <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-200">Wishlist</span> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Brand" value={visibleItem.brand} />
            <Info label="Make" value={visibleItem.make} />
            <Info label="Model" value={visibleItem.model} />
            <Info label="Year" value={visibleItem.year ? String(visibleItem.year) : '—'} />
            <Info label="Color" value={visibleItem.color ?? '—'} />
            <Info label="Acquired" value={visibleItem.acquiredDate ? new Date(visibleItem.acquiredDate).toLocaleDateString() : '—'} />
            <Info label="Acquired from" value={visibleItem.acquiredFrom ?? '—'} />
          </div>
          {visibleItem.notes ? <p className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-sm text-zinc-300">{visibleItem.notes}</p> : null}
        </div>
      </section>

      <CarSocialPanel itemId={visibleItem.id} initialFavorite={favorite} initialWishlist={wishlist} comments={comments as unknown as Array<{ id: string; body: string; createdAt: string | Date; author: { displayName: string | null; username: string } }>} />

      {canSeeDuplicates ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Exact duplicates</h2>
            <span className="text-sm text-zinc-500">Same make, model, and year</span>
          </div>
          {matches.length ? (
            <div className="mt-4 space-y-2">
              {matches.map((match) => (
                <div key={match.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                  <div className="flex items-start gap-3">
                    {match.imagePath ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
                        <Image src={match.imagePath} alt={match.displayName} fill className="object-cover" sizes="64px" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-white">{match.displayName}</span>
                        <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] text-emerald-200">duplicate</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{match.reason.join(' • ')}</div>
                    </div>
                  </div>
                  <Link href={`/collection/${match.id}`} className="mt-2 inline-flex text-xs text-emerald-300">Open match →</Link>
                </div>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-zinc-400">No exact duplicates found.</p>}
        </section>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}
