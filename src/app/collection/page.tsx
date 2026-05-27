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
  const [items, brandRows] = await Promise.all([
    listItems(query, user.id),
    prisma.diecastItem.findMany({ where: { userId: user.id }, select: { brand: true }, orderBy: { brand: 'asc' } }),
  ]);
  const brands = Array.from(new Set(brandRows.map((row) => row.brand))).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6 pb-8">
      <CollectionFilters key={`${query.q ?? ''}|${query.brand ?? ''}|${query.type ?? ''}|${query.sort ?? ''}|${query.wishlist ?? ''}`} searchParams={query} brands={brands} />

      <Link href="/add" className="block rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-zinc-950">Add car</Link>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Collection results</h2>
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
