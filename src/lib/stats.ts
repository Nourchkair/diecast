import { VehicleType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getSummary(userId: string) {
  const [totalCars, uniqueCars, duplicates, wishlistCount, photoCount, items] = await prisma.$transaction([
    prisma.diecastItem.aggregate({ _sum: { quantityOwned: true }, where: { userId } }),
    prisma.diecastItem.count({ where: { userId } }),
    prisma.diecastItem.aggregate({ _sum: { quantityOwned: true }, where: { userId, quantityOwned: { gt: 1 } } }),
    prisma.diecastItem.count({ where: { userId, isWishlist: true } }),
    prisma.diecastImage.count({ where: { item: { userId } } }),
    prisma.diecastItem.findMany({ where: { userId }, select: { id: true, vehicleType: true, brand: true, year: true, rarityScore: true, quantityOwned: true } }),
  ]);

  return {
    totalCars: totalCars._sum.quantityOwned ?? 0,
    uniqueCars,
    duplicates: duplicates._sum.quantityOwned ?? 0,
    wishlistCount,
    photoCount,
    items,
  };
}

export async function getBreakdowns(userId: string) {
  const items = await prisma.diecastItem.findMany({ where: { userId }, select: { id: true, displayName: true, brand: true, vehicleType: true, year: true, scale: true, rarityScore: true, quantityOwned: true } });
  const byBrand = new Map<string, number>();
  const byType = new Map<string, number>();
  const byYear = new Map<string, number>();
  const byScale = new Map<string, number>();

  for (const item of items) {
    byBrand.set(item.brand, (byBrand.get(item.brand) ?? 0) + item.quantityOwned);
    byType.set(item.vehicleType, (byType.get(item.vehicleType) ?? 0) + item.quantityOwned);
    byYear.set(String(item.year ?? 'Unknown'), (byYear.get(String(item.year ?? 'Unknown')) ?? 0) + item.quantityOwned);
    byScale.set(item.scale ?? 'Unknown', (byScale.get(item.scale ?? 'Unknown') ?? 0) + item.quantityOwned);
  }

  return {
    byBrand: Array.from(byBrand.entries()).sort((a, b) => b[1] - a[1]),
    byType: Array.from(byType.entries()).sort((a, b) => b[1] - a[1]),
    byYear: Array.from(byYear.entries()).sort((a, b) => Number(b[0]) - Number(a[0])),
    byScale: Array.from(byScale.entries()).sort((a, b) => b[1] - a[1]),
    rarest: [...items].sort((a, b) => a.rarityScore - b.rarityScore || a.quantityOwned - b.quantityOwned),
    vehicleTypeEnum: Object.values(VehicleType),
  };
}
