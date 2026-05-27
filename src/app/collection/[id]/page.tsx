import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { findMatches } from '@/lib/match';
import { DeleteButton } from '@/components/delete-button';
import { requireCurrentUser } from '@/lib/auth';

type Params = Promise<{ id: string }>;

export default async function ItemDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const item = await prisma.diecastItem.findFirst({
    where: { id, userId: user.id },
    include: { images: true, tags: { include: { tag: true } } },
  });
  if (!item) notFound();

  const matches = (await findMatches({
    id: item.id,
    displayName: item.displayName,
    brand: item.brand,
    make: item.make,
    model: item.model,
    year: item.year,
    vehicleType: item.vehicleType,
    color: item.color,
    productCode: item.productCode,
    barcode: item.barcode,
  }, user.id)).filter((match) => match.id !== item.id).slice(0, 4);
  const primaryImage = item.images.find((image) => image.isPrimary) ?? item.images[0];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/collection" className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-200">Back</Link>
        <div className="flex gap-2">
          <Link href={`/collection/${item.id}/edit`} className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950">Edit</Link>
          <DeleteButton itemId={item.id} />
        </div>
      </div>

      <section className="grid gap-5 rounded-[2.25rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 md:grid-cols-[280px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-zinc-900">
          {primaryImage ? <Image src={primaryImage.filePath} alt={item.displayName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 280px" /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">No photo yet</div>}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">{item.brand}</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{item.displayName}</h1>
            <p className="mt-2 text-sm text-zinc-400">{item.make} {item.model} • {item.year ?? 'Unknown year'}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-200">Type: {item.vehicleType}</span>
            {item.isWishlist ? <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-200">Wishlist</span> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Brand" value={item.brand} />
            <Info label="Make" value={item.make} />
            <Info label="Model" value={item.model} />
            <Info label="Year" value={item.year ? String(item.year) : '—'} />
            <Info label="Color" value={item.color ?? '—'} />
            <Info label="Acquired" value={item.acquiredDate ? new Date(item.acquiredDate).toLocaleDateString() : '—'} />
            <Info label="Acquired from" value={item.acquiredFrom ?? '—'} />
          </div>
          {item.notes ? <p className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-sm text-zinc-300">{item.notes}</p> : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Possible duplicates</h2>
          <span className="text-sm text-zinc-500">Auto-ranked from your collection</span>
        </div>
        {matches.length ? (
          <div className="mt-4 space-y-2">
            {matches.map((match) => (
              <div key={match.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{match.displayName}</span>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] text-emerald-200">score {match.score}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">{match.reason.join(' • ')}</div>
                <Link href={`/collection/${match.id}`} className="mt-2 inline-flex text-xs text-emerald-300">Open match →</Link>
              </div>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-zinc-400">No close duplicates found.</p>}
      </section>
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
