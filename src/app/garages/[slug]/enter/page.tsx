import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser } from '@/lib/auth';
import { getGarageBySlug } from '@/lib/social';
import { CollectionFilters } from '@/components/collection-filters';
import { GarageAddCarsPanel } from '@/components/garage-add-cars-panel';
import { GarageInviteButton } from '@/components/garage-invite-button';
import { SharedGarageItemCard } from '@/components/shared-garage-item-card';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

export default async function GarageEnterPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const queryParams = await searchParams;

  const [garage, ownedItems] = await Promise.all([
    getGarageBySlug(slug, user.id),
    prisma.diecastItem.findMany({
      where: { userId: user.id },
      include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  if (!garage || garage.type !== 'SHARED') notFound();

  const query = Object.fromEntries(Object.entries(queryParams).map(([key, value]) => [key, first(value)]));
  const q = normalize(query.q);
  const brand = normalize(query.brand);
  const type = normalize(query.type);
  const sort = query.sort ?? 'created-desc';
  const wishlist = query.wishlist === '1';

  const filteredItems = garage.items.filter((entry) => {
    const item = entry.item;
    if (brand && item.brand.toLowerCase() !== brand) return false;
    if (type && item.vehicleType.toLowerCase() !== type) return false;
    if (wishlist && !item.isWishlist) return false;
    if (q) {
      const haystack = [item.displayName, item.brand, item.make, item.model, item.series ?? '', item.productCode ?? '', item.barcode ?? '', item.notes ?? ''].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    const itemA = a.item;
    const itemB = b.item;
    switch (sort) {
      case 'name-asc': return itemA.displayName.localeCompare(itemB.displayName);
      case 'name-desc': return itemB.displayName.localeCompare(itemA.displayName);
      case 'year-asc': return (itemA.year ?? 0) - (itemB.year ?? 0);
      case 'year-desc': return (itemB.year ?? 0) - (itemA.year ?? 0);
      case 'quantity-desc': return itemB.quantityOwned - itemA.quantityOwned;
      default: return new Date(itemB.createdAt).getTime() - new Date(itemA.createdAt).getTime();
    }
  });

  const brands = Array.from(new Set(garage.items.map((entry) => entry.item.brand))).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-2 px-1 pt-1">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Shared garage</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{garage.name}</h1>
        {garage.description ? <p className="mt-2 text-sm text-zinc-300">{garage.description}</p> : null}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-300">
          {garage.members.map((member) => (
            <span key={member.userId}>{member.user.username}</span>
          ))}
        </div>
      </section>

      <CollectionFilters searchParams={query as Record<string, string | undefined>} brands={brands} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-4">
        <GarageAddCarsPanel
          slug={garage.slug}
          linkedItemIds={garage.items.map((entry) => entry.itemId)}
          ownedItems={ownedItems as unknown as Array<{ id: string; displayName: string; images: Array<{ id: string; filePath: string; isPrimary: boolean }> }>}
        />

        <div className="px-1 lg:pt-1">
          <GarageInviteButton slug={garage.slug} label="Add member" className="text-center" />
        </div>
      </div>

      {filteredItems.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredItems.map((entry) => (
            <SharedGarageItemCard key={entry.itemId} entry={entry as unknown as { itemId: string; item: { id: string; displayName: string; brand: string; make: string; model: string; year: number | null; images: Array<{ id: string; filePath: string; isPrimary: boolean }>; user: { displayName: string | null; username: string } | null } }} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center text-zinc-400">
          No cars matched your filters yet.
        </div>
      )}
    </div>
  );
}
