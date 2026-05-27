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
    brand: normalizeTerm(input.brand),
    make: normalizeTerm(input.make),
    model: normalizeTerm(input.model),
    year: input.year ?? null,
    scale: normalizeTerm(input.scale),
    series: normalizeTerm(input.series),
    variant: normalizeTerm(input.variant),
    productCode: normalizeTerm(input.productCode),
    barcode: normalizeTerm(input.barcode),
  };

  return candidates
    .map((candidate) => {
      const reasons: string[] = [];
      let score = 0;

      if (normalized.barcode && normalizeTerm(candidate.barcode) === normalized.barcode) {
        reasons.push('barcode match');
        score += 65;
      }
      if (normalized.productCode && normalizeTerm(candidate.productCode) === normalized.productCode) {
        reasons.push('product code match');
        score += 55;
      }
      if (normalized.brand && normalizeTerm(candidate.brand) === normalized.brand) {
        reasons.push('brand match');
        score += 18;
      }
      if (normalized.make && normalizeTerm(candidate.make) === normalized.make) {
        reasons.push('make match');
        score += 16;
      }
      if (normalized.model && normalizeTerm(candidate.model) === normalized.model) {
        reasons.push('model match');
        score += 16;
      }
      if (normalized.year && candidate.year === normalized.year) {
        reasons.push('year match');
        score += 12;
      }
      if (normalized.scale && normalizeTerm(candidate.scale) === normalized.scale) {
        reasons.push('scale match');
        score += 6;
      }
      if (normalized.variant && normalizeTerm(candidate.variant) === normalized.variant) {
        reasons.push('variant match');
        score += 10;
      }
      if (normalized.series && normalizeTerm(candidate.series) === normalized.series) {
        reasons.push('series match');
        score += 6;
      }

      const candidateName = [candidate.brand, candidate.make, candidate.model].map(normalizeTerm).join(' ');
      const inputName = [normalized.brand, normalized.make, normalized.model].filter(Boolean).join(' ');
      if (inputName && candidateName.includes(inputName)) {
        reasons.push('name overlap');
        score += 8;
      }

      if (input.id && candidate.id === input.id) {
        score = 0;
      }

      return {
        id: candidate.id,
        displayName: candidate.displayName,
        brand: candidate.brand,
        make: candidate.make,
        model: candidate.model,
        year: candidate.year,
        scale: candidate.scale,
        variant: candidate.variant,
        quantityOwned: candidate.quantityOwned,
        score,
        reason: reasons,
      } satisfies MatchCandidate;
    })
    .filter((candidate) => candidate.score >= 18)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
