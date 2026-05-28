import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { listItems } from '@/lib/items';
import { CollectionFilters } from '@/components/collection-filters';
import { ItemCard } from '@/components/item-card';
import { requireCurrentUser } from '@/lib/auth';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CollectionPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const query = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, first(value)]));
  let items: Awaited<ReturnType<typeof listItems>> = [];
  let brands: string[] = [];

  try {
    const [loadedItems, brandRows] = await Promise.all([
      listItems(query, user.id),
      prisma.diecastItem.findMany({ where: { userId: user.id }, select: { brand: true }, orderBy: { brand: 'asc' } }),
    ]);
    items = loadedItems;
    brands = Array.from(new Set(brandRows.map((row) => row.brand))).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Failed to load collection', error);
  }

  return (
    <div className="space-y-6 pb-8">
      <CollectionFilters key={`${query.q ?? ''}|${query.brand ?? ''}|${query.type ?? ''}|${query.sort ?? ''}|${query.wishlist ?? ''}`} searchParams={query} brands={brands} />

      <Link href="/add" className="block rounded-2xl px-4 py-3 text-center text-sm font-semibold" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>Add car</Link>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Your Garage</h2>
          <Link href="/garages" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10">
            Enter Shared garages
          </Link>
        </div>
        {items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center text-zinc-400">
            No diecasts matched your filters yet. Add your first car or clear the filters.
          </div>
        )}
      </section>
    </div>
  );
}
