import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createItemFromPayload } from '@/lib/items';
import type { Condition, VehicleType } from '@prisma/client';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export const runtime = 'nodejs';

type ImportTag = { name?: unknown; color?: unknown };
type ImportImage = { filePath?: unknown };
type ImportItem = {
  displayName?: unknown;
  brand?: unknown;
  make?: unknown;
  model?: unknown;
  year?: unknown;
  scale?: unknown;
  series?: unknown;
  vehicleType?: unknown;
  color?: unknown;
  variant?: unknown;
  productCode?: unknown;
  barcode?: unknown;
  condition?: unknown;
  quantityOwned?: unknown;
  isWishlist?: unknown;
  acquiredDate?: unknown;
  acquiredFrom?: unknown;
  storageLocation?: unknown;
  notes?: unknown;
  tags?: unknown;
  images?: unknown;
};

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isVehicleType(value: unknown): value is VehicleType {
  return typeof value === 'string' && ['JDM','MUSCLE','SUPERCAR','EXOTIC','CLASSIC','RACE','TRUCK','SUV','VAN','OFFROAD','RALLY','TUNER','HOT_ROD','FANTASY','MOVIE','OTHER'].includes(value);
}

function isCondition(value: unknown): value is Condition {
  return typeof value === 'string' && ['SEALED','MINT','NEAR_MINT','GOOD','FAIR','POOR'].includes(value);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Import file required' }, { status: 400 });
  const raw = await file.text();
  const parsed = JSON.parse(raw) as { tags?: unknown; items?: unknown };
  const tags = asArray<ImportTag>(parsed.tags);
  const items = asArray<ImportItem>(parsed.items);

  for (const tag of tags) {
    const name = String(tag.name ?? '').trim();
    if (!name) continue;
    const existing = await prisma.tag.findFirst({ where: { userId: user.id, name } });
    if (existing) {
      await prisma.tag.update({ where: { id: existing.id }, data: { color: tag.color ? String(tag.color) : null } });
    } else {
      await prisma.tag.create({ data: { userId: user.id, name, color: tag.color ? String(tag.color) : null } });
    }
  }

  for (const item of items) {
    const brand = String(item.brand ?? '').trim();
    const make = String(item.make ?? '').trim();
    const model = String(item.model ?? '').trim();
    if (!brand || !make || !model) continue;
    await createItemFromPayload({
      displayName: item.displayName ? String(item.displayName) : undefined,
      brand,
      make,
      model,
      year: typeof item.year === 'number' ? item.year : undefined,
      scale: item.scale ? String(item.scale) : undefined,
      series: item.series ? String(item.series) : undefined,
      vehicleType: isVehicleType(item.vehicleType) ? item.vehicleType : 'OTHER',
      color: item.color ? String(item.color) : undefined,
      variant: item.variant ? String(item.variant) : undefined,
      productCode: item.productCode ? String(item.productCode) : undefined,
      barcode: item.barcode ? String(item.barcode) : undefined,
      condition: isCondition(item.condition) ? item.condition : 'NEAR_MINT',
      quantityOwned: typeof item.quantityOwned === 'number' ? item.quantityOwned : undefined,
      isWishlist: Boolean(item.isWishlist),
      acquiredDate: item.acquiredDate ? String(item.acquiredDate) : undefined,
      acquiredFrom: item.acquiredFrom ? String(item.acquiredFrom) : undefined,
      storageLocation: item.storageLocation ? String(item.storageLocation) : undefined,
      notes: item.notes ? String(item.notes) : undefined,
      tagNames: asArray<ImportTag>(item.tags)
        .map((link) => String(link?.name ?? '').trim())
        .filter(Boolean),
      imagePaths: asArray<ImportImage>(item.images)
        .map((image) => String(image?.filePath ?? '').trim())
        .filter(Boolean),
    }, user.id);
  }

  return NextResponse.json({ ok: true, importedItems: items.length, importedTags: tags.length });
}
