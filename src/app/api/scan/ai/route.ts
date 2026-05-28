import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { VehicleType } from '@prisma/client';
import { buildDisplayName } from '@/lib/normalize';
import { inferDiecastFields } from '@/lib/diecast-inference';
import { findMatches } from '@/lib/match';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export const runtime = 'nodejs';

const vehicleTypeValues = ['JDM', 'MUSCLE', 'SUPERCAR', 'EXOTIC', 'CLASSIC', 'RACE', 'TRUCK', 'SUV', 'VAN', 'OFFROAD', 'RALLY', 'TUNER', 'HOT_ROD', 'FANTASY', 'MOVIE', 'OTHER'] as const;

function normalizeVehicleType(value: unknown): VehicleType {
  if (typeof value !== 'string') return 'OTHER';
  const normalized = value.trim().toUpperCase().replace(/[^A-Z_]/g, '') as VehicleType;
  return vehicleTypeValues.includes(normalized) ? normalized : 'OTHER';
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
  return false;
}

function parseConfidence(value: unknown) {
  const numeric = typeof value === 'string' ? Number(value) : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}

function parseYear(value: unknown) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  const numeric = typeof value === 'string' ? Number(value) : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.trunc(numeric);
}

const scanSchema = z.object({
  isDiecast: z.unknown().transform(parseBoolean),
  confidence: z.unknown().transform(parseConfidence),
  brand: z.unknown().transform((value) => safeString(value)).default(''),
  make: z.unknown().transform((value) => safeString(value)).default(''),
  model: z.unknown().transform((value) => safeString(value)).default(''),
  year: z.unknown().transform(parseYear).default(null),
  scale: z.unknown().transform((value) => safeString(value) || null).default(null),
  series: z.unknown().transform((value) => safeString(value) || null).default(null),
  vehicleType: z.unknown().transform(normalizeVehicleType).default('OTHER'),
  color: z.unknown().transform((value) => safeString(value) || null).default(null),
  variant: z.unknown().transform((value) => safeString(value) || null).default(null),
  productCode: z.unknown().transform((value) => safeString(value) || null).default(null),
  barcode: z.unknown().transform((value) => safeString(value) || null).default(null),
  displayName: z.unknown().transform((value) => safeString(value)).default(''),
  summary: z.unknown().transform((value) => safeString(value)).default(''),
  signals: z.array(z.unknown()).default([]).transform((values) => values.map((value) => safeString(value)).filter(Boolean)),
});

function makeDataUrl(file: File, bytes: Buffer) {
  return `data:${file.type || 'image/jpeg'};base64,${bytes.toString('base64')}`;
}

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Image file required' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const dataUrl = makeDataUrl(file, bytes);

    const prompt = [
    'Analyze this image for a diecast toy car or diecast packaging.',
    'Return only JSON.',
    'If the photo is not clearly a diecast toy car, diecast package, or diecast-related card/box, set isDiecast to false and confidence low.',
    'Do not invent details. Use empty strings or null when unsure.',
    'Prefer details visible in the image itself.',
    'Fields:',
    '- isDiecast (boolean)',
    '- confidence (0 to 1)',
    '- brand, make, model, year, scale, series, vehicleType, color, variant, productCode, barcode, displayName, summary, signals',
    'Use vehicleType from: JDM, MUSCLE, SUPERCAR, EXOTIC, CLASSIC, RACE, TRUCK, SUV, VAN, OFFROAD, RALLY, TUNER, HOT_ROD, FANTASY, MOVIE, OTHER',
    'If the year is not visible, set it to null.',
  ].join(' ');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a precise diecast toy car vision assistant.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          ],
        },
      ],
    }),
  });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json({ error: errorText || 'OpenAI request failed' }, { status: 502 });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty OpenAI response' }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: `Invalid JSON from OpenAI: ${content.slice(0, 200)}` }, { status: 502 });
    }

    const analysisResult = scanSchema.safeParse(parsed);
    if (!analysisResult.success) {
      return NextResponse.json({ error: 'OpenAI returned unusable scan data', issues: analysisResult.error.issues }, { status: 502 });
    }

    const analysis = analysisResult.data;
    const inferred = inferDiecastFields(analysis.displayName || [analysis.brand, analysis.make, analysis.model].filter(Boolean).join(' '));
    const suggestions = {
      displayName: analysis.displayName || buildDisplayName({
        year: analysis.year ?? null,
        brand: analysis.brand || inferred.brand,
        make: analysis.make || inferred.make,
        model: analysis.model || inferred.model,
        variant: analysis.variant,
      }),
      brand: analysis.brand || inferred.brand || '',
      make: analysis.make || inferred.make || '',
      model: analysis.model || inferred.model || '',
      year: analysis.year ? String(analysis.year) : inferred.year || '',
      vehicleType: (analysis.vehicleType === 'OTHER' ? inferred.vehicleType : analysis.vehicleType) as VehicleType | 'OTHER',
      scale: safeString(analysis.scale),
      series: safeString(analysis.series),
      color: safeString(analysis.color),
      variant: safeString(analysis.variant),
      productCode: safeString(analysis.productCode),
      barcode: safeString(analysis.barcode),
    };

    const matches = await findMatches({
      displayName: suggestions.displayName,
      brand: suggestions.brand,
      make: suggestions.make,
      model: suggestions.model,
      year: suggestions.year ? Number(suggestions.year) : null,
      scale: suggestions.scale,
      series: suggestions.series,
      vehicleType: suggestions.vehicleType,
      color: suggestions.color,
      variant: suggestions.variant,
      productCode: suggestions.productCode,
      barcode: suggestions.barcode,
    }, user.id);

    return NextResponse.json({
      ...analysis,
      suggestions,
      matches,
    });
  } catch (error) {
    console.error('AI scan route failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI scan route failed' }, { status: 500 });
  }
}
