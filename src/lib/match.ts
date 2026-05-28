import { prisma } from '@/lib/prisma';
import { normalizeTerm } from '@/lib/normalize';

export type MatchInput = {
  id?: string;
  displayName?: string;
  brand?: string;
  make?: string;
  model?: string;
  year?: number | null;
  scale?: string | null;
  series?: string | null;
  vehicleType?: string | null;
  color?: string | null;
  variant?: string | null;
  productCode?: string | null;
  barcode?: string | null;
};

export type MatchCandidate = {
  id: string;
  displayName: string;
  brand: string;
  make: string;
  model: string;
  year: number | null;
  scale: string | null;
  variant: string | null;
  quantityOwned: number;
  imagePath: string | null;
  score: number;
  reason: string[];
};

export async function findMatches(input: MatchInput, userId: string): Promise<MatchCandidate[]> {
  const candidates = await prisma.diecastItem.findMany({
    where: { userId },
    include: { images: true },
    take: 200,
  });

  const normalized = {
    make: normalizeTerm(input.make),
    model: normalizeTerm(input.model),
    year: input.year ?? null,
  };

  if (!normalized.make || !normalized.model || normalized.year === null) return [];

  return candidates
    .flatMap((candidate) => {
      const isExactDuplicate = candidate.id !== input.id
        && normalizeTerm(candidate.make) === normalized.make
        && normalizeTerm(candidate.model) === normalized.model
        && candidate.year === normalized.year;

      if (!isExactDuplicate) return [];

      return [{
        id: candidate.id,
        displayName: candidate.displayName,
        brand: candidate.brand,
        make: candidate.make,
        model: candidate.model,
        year: candidate.year,
        scale: candidate.scale,
        variant: candidate.variant,
        quantityOwned: candidate.quantityOwned,
        imagePath: candidate.images.find((image) => image.isPrimary)?.filePath ?? candidate.images[0]?.filePath ?? null,
        score: 100,
        reason: ['exact make/model/year match'],
      } satisfies MatchCandidate];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
