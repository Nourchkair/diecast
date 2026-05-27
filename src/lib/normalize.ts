export function normalizeTerm(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function buildDisplayName(input: {
  year?: number | null;
  brand?: string | null;
  make?: string | null;
  model?: string | null;
  variant?: string | null;
}) {
  const parts = [input.year, input.brand, input.make, input.model, input.variant]
    .filter(Boolean)
    .map((part) => String(part).trim());
  return parts.join(' ');
}

export function titleCase(value?: string | null) {
  if (!value) return '';
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function slugify(value: string) {
  return normalizeTerm(value).replace(/\s+/g, '-');
}
