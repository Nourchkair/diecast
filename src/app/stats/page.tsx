import Link from 'next/link';
import { getBreakdowns, getSummary } from '@/lib/stats';
import { StatCard } from '@/components/stat-card';
import { requireCurrentUser } from '@/lib/auth';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StatsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const showAllRarest = first(params.rarest) === 'all';
  const [summary, breakdowns] = await Promise.all([getSummary(user.id), getBreakdowns(user.id)]);
  const rarestItems = showAllRarest ? breakdowns.rarest : breakdowns.rarest.slice(0, 3);

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-lg font-semibold text-white">Stats</h1>

      <section className="grid grid-cols-3 gap-2 sm:grid-cols-3 xl:grid-cols-3">
        <StatCard label="Total cars" value={summary.totalCars} />
        <StatCard label="Unique cars" value={summary.uniqueCars} />
        <StatCard label="Wishlist" value={summary.wishlistCount} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="By brand" rows={breakdowns.byBrand} />
        <Panel title="By type" rows={breakdowns.byType} />
        <Panel title="By year" rows={breakdowns.byYear} />
        <Panel title="By scale" rows={breakdowns.byScale} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Rarest in your collection</h2>
          <Link href={`/stats?rarest=${showAllRarest ? 'top' : 'all'}`} className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-zinc-200">
            {showAllRarest ? 'Show top 3' : 'Show all'}
          </Link>
        </div>
        <div className="mt-4 grid gap-2">
          {rarestItems.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-white">{index + 1}. {item.displayName}</span>
                <span className="rounded-full bg-amber-400/15 px-2 py-1 text-[11px] text-amber-200">rarity {item.rarityScore}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Quantity owned: {item.quantityOwned} • {item.vehicleType}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Panel({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.slice(0, 8).map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-900">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
