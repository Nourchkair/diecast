import Link from 'next/link';
import type { DiecastItem } from '@prisma/client';
import { DiecastForm } from '@/components/diecast-form';
import { requireCurrentUser } from '@/lib/auth';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddPage({ searchParams }: { searchParams: SearchParams }) {
  await requireCurrentUser();
  const params = await searchParams;
  const initialItem: Partial<DiecastItem> & { tagNames?: string[] } = {
    displayName: first(params.displayName),
    brand: first(params.brand),
    make: first(params.make),
    model: first(params.model),
    barcode: first(params.barcode),
    productCode: first(params.productCode),
    year: first(params.year) ? Number(first(params.year)) : undefined,
    vehicleType: first(params.vehicleType) as DiecastItem['vehicleType'] | undefined,
    color: first(params.color),
    acquiredDate: first(params.acquiredDate) ? new Date(first(params.acquiredDate) as string) : undefined,
    acquiredFrom: first(params.acquiredFrom),
    notes: first(params.notes),
    isWishlist: first(params.wishlist) === '1',
  };
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/collection" className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-200">Back</Link>
        <h1 className="text-lg font-semibold text-white">Add a diecast</h1>
      </div>
      <DiecastForm mode="create" initialItem={initialItem} />
    </div>
  );
}
