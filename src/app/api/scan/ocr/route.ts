import { NextResponse } from 'next/server';
import { findMatches } from '@/lib/match';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

function extractFields(rawText: string) {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const joined = lines.join(' ');
  const yearMatch = joined.match(/\b(19|20)\d{2}\b/);
  const codeMatch = joined.match(/\b[A-Z0-9]{5,}\b/);
  const firstLine = lines[0] ?? '';
  return {
    displayName: firstLine,
    year: yearMatch ? Number(yearMatch[0]) : null,
    productCode: codeMatch?.[0] ?? null,
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const rawText = String(body.rawText ?? '').trim();
  if (!rawText) return NextResponse.json({ error: 'OCR text required' }, { status: 400 });
  const extracted = extractFields(rawText);
  const matches = await findMatches({
    displayName: extracted.displayName,
    brand: body.brand,
    make: body.make,
    model: body.model,
    year: extracted.year,
    series: body.series,
    productCode: extracted.productCode,
    barcode: body.barcode,
  }, user.id);
  return NextResponse.json({ rawText, extracted, matches });
}
