import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findMatches } from '@/lib/match';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const barcode = String(body.barcode ?? '').trim();
  if (!barcode) return NextResponse.json({ error: 'Barcode required' }, { status: 400 });

  const directMatches = await prisma.diecastItem.findMany({
    where: {
      userId: user.id,
      OR: [
        { barcode },
        { productCode: barcode },
      ],
    },
    include: { images: true, tags: { include: { tag: true } } },
  });

  const matches = await findMatches({ barcode }, user.id);
  return NextResponse.json({ barcode, directMatches, matches });
}
