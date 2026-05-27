import { Prisma, type VehicleType, type Condition } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildDisplayName, normalizeTerm } from '@/lib/normalize';

export type ItemPayload = {
  id?: string;
  displayName?: string;
  brand?: string;
  make?: string;
  model?: string;
  year?: number | string | null;
  scale?: string | null;
  series?: string | null;
  vehicleType?: VehicleType;
  color?: string | null;
  variant?: string | null;
  productCode?: string | null;
  barcode?: string | null;
  condition?: Condition;
  quantityOwned?: number | string;
  isWishlist?: boolean;
  acquiredDate?: string | null;
  acquiredFrom?: string | null;
  storageLocation?: string | null;
  notes?: string | null;
  tagNames?: string[];
  imagePaths?: string[];
};

export const itemInclude = {
  images: { orderBy: [{ isPrimary: 'desc' as const }, { createdAt: 'asc' as const }] },
  tags: { include: { tag: true } },
} satisfies Prisma.DiecastItemInclude;

export function normalizeItemInput(input: ItemPayload) {
  const year = input.year === '' || input.year === null || typeof input.year === 'undefined' ? null : Number(input.year);
  const quantityOwned = input.quantityOwned === '' || typeof input.quantityOwned === 'undefined' ? 1 : Number(input.quantityOwned);
  const displayName = (input.displayName ?? '').trim() || buildDisplayName({
    year,
    brand: input.brand,
    make: input.make,
    model: input.model,
    variant: input.variant,
  });

  return {
    displayName,
    brand: (input.brand ?? '').trim(),
    make: (input.make ?? '').trim(),
    model: (input.model ?? '').trim(),
    year: Number.isFinite(year as number) ? year : null,
    scale: (input.scale ?? '').trim() || null,
    series: (input.series ?? '').trim() || null,
    vehicleType: input.vehicleType ?? 'OTHER',
    color: (input.color ?? '').trim() || null,
    variant: (input.variant ?? '').trim() || null,
    productCode: (input.productCode ?? '').trim() || null,
    barcode: (input.barcode ?? '').trim() || null,
    condition: input.condition ?? 'NEAR_MINT',
    quantityOwned: Number.isFinite(quantityOwned) ? quantityOwned : 1,
    isWishlist: Boolean(input.isWishlist),
    acquiredDate: input.acquiredDate ? new Date(input.acquiredDate) : null,
    acquiredFrom: (input.acquiredFrom ?? '').trim() || null,
    storageLocation: (input.storageLocation ?? '').trim() || null,
    notes: (input.notes ?? '').trim() || null,
    tagNames: (input.tagNames ?? []).map((tag) => tag.trim()).filter(Boolean),
    imagePaths: (input.imagePaths ?? []).filter(Boolean),
  };
}

export function computeRarityScore(input: Pick<ItemPayload, 'quantityOwned' | 'isWishlist' | 'vehicleType' | 'year' | 'brand' | 'productCode' | 'barcode'>) {
  const qty = Number(input.quantityOwned ?? 1) || 1;
  let score = 100 - Math.min(qty, 10) * 12;
  if (input.isWishlist) score += 8;
  if (input.productCode) score += 4;
  if (input.barcode) score += 4;
  if (input.vehicleType && ['JDM', 'SUPERCAR', 'EXOTIC', 'RACE'].includes(String(input.vehicleType))) score += 6;
  if (input.year && Number(input.year) < 2000) score += 8;
  if (input.brand && /chase|limited|special/i.test(input.brand)) score += 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildSearchWhere(params: URLSearchParams | Record<string, string | undefined>, userId: string) {
  const get = (key: string) => params instanceof URLSearchParams ? params.get(key) ?? undefined : params[key];
  const q = normalizeTerm(get('q'));
  const brand = get('brand');
  const type = get('type');
  const year = get('year');
  const scale = get('scale');
  const wishlist = get('wishlist');
  const hasPhoto = get('hasPhoto');
  const sort = get('sort') ?? 'created-desc';

  const where: Prisma.DiecastItemWhereInput = {
    AND: [
      { userId },
      brand ? { brand: { contains: brand } } : {},
      type ? { vehicleType: type as VehicleType } : {},
      year ? { year: Number(year) } : {},
      scale ? { scale: { contains: scale } } : {},
      wishlist === '1' ? { isWishlist: true } : {},
      hasPhoto === '1' ? { images: { some: {} } } : {},
      q
        ? {
            OR: [
              { displayName: { contains: q } },
              { brand: { contains: q } },
              { make: { contains: q } },
              { model: { contains: q } },
              { series: { contains: q } },
              { productCode: { contains: q } },
              { barcode: { contains: q } },
              { notes: { contains: q } },
            ],
          }
        : {},
    ],
  };

  const orderBy: Prisma.DiecastItemOrderByWithRelationInput[] =
    sort === 'created-desc'
      ? [{ createdAt: 'desc' }]
      : sort === 'name-asc'
      ? [{ displayName: 'asc' }]
      : sort === 'name-desc'
        ? [{ displayName: 'desc' }]
        : sort === 'year-desc'
          ? [{ year: 'desc' }, { updatedAt: 'desc' }]
          : sort === 'year-asc'
            ? [{ year: 'asc' }, { updatedAt: 'desc' }]
            : sort === 'quantity-desc'
              ? [{ quantityOwned: 'desc' }, { updatedAt: 'desc' }]
              : [{ updatedAt: 'desc' }];

  return { where, orderBy };
}

export async function listItems(params: URLSearchParams | Record<string, string | undefined> = {}, userId: string) {
  const { where, orderBy } = buildSearchWhere(params, userId);
  return prisma.diecastItem.findMany({
    where,
    orderBy,
    include: itemInclude,
  });
}

export async function getItemById(id: string, userId: string) {
  return prisma.diecastItem.findFirst({ where: { id, userId }, include: itemInclude });
}

export async function createOrUpdateTags(tagNames: string[], userId: string) {
  if (!tagNames.length) return [];
  return Promise.all(
    tagNames.map(async (name) => {
      const existing = await prisma.tag.findFirst({ where: { userId, name } });
      return existing ?? prisma.tag.create({ data: { userId, name } });
    })
  );
}

export async function createItemFromPayload(payload: ItemPayload, userId: string) {
  const data = normalizeItemInput(payload);
  const rarityScore = computeRarityScore(data);
  const tags = await createOrUpdateTags(data.tagNames, userId);

  return prisma.diecastItem.create({
    data: {
      userId,
      displayName: data.displayName,
      brand: data.brand,
      make: data.make,
      model: data.model,
      year: data.year,
      scale: data.scale,
      series: data.series,
      vehicleType: data.vehicleType,
      color: data.color,
      variant: data.variant,
      productCode: data.productCode,
      barcode: data.barcode,
      condition: data.condition,
      quantityOwned: data.quantityOwned,
      isWishlist: data.isWishlist,
      acquiredDate: data.acquiredDate,
      acquiredFrom: data.acquiredFrom,
      storageLocation: data.storageLocation,
      notes: data.notes,
      rarityScore,
      images: data.imagePaths.length
        ? {
            create: data.imagePaths.map((filePath, index) => ({
              filePath,
              isPrimary: index === 0,
            })),
          }
        : undefined,
      tags: tags.length
        ? {
            create: tags.map((tag) => ({ tagId: tag.id })),
          }
        : undefined,
    },
    include: itemInclude,
  });
}

export async function updateItemFromPayload(id: string, payload: ItemPayload, userId: string) {
  const data = normalizeItemInput(payload);
  const rarityScore = computeRarityScore(data);
  const tags = await createOrUpdateTags(data.tagNames, userId);

  const existing = await prisma.diecastItem.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return null;

  await prisma.itemTag.deleteMany({ where: { itemId: id } });
  if (tags.length) {
    await prisma.itemTag.createMany({ data: tags.map((tag) => ({ itemId: id, tagId: tag.id })) });
  }

  return prisma.diecastItem.update({
    where: { id },
    data: {
      displayName: data.displayName,
      brand: data.brand,
      make: data.make,
      model: data.model,
      year: data.year,
      scale: data.scale,
      series: data.series,
      vehicleType: data.vehicleType,
      color: data.color,
      variant: data.variant,
      productCode: data.productCode,
      barcode: data.barcode,
      condition: data.condition,
      quantityOwned: data.quantityOwned,
      isWishlist: data.isWishlist,
      acquiredDate: data.acquiredDate,
      acquiredFrom: data.acquiredFrom,
      storageLocation: data.storageLocation,
      notes: data.notes,
      rarityScore,
    },
    include: itemInclude,
  });
}
