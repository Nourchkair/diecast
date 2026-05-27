import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await prisma.diecastItem.findMany({ where: { userId: user.id }, include: { images: true, tags: { include: { tag: true } } } });
  const tagsById = new Map<string, (typeof items)[number]['tags'][number]['tag']>();
  for (const item of items) {
    for (const link of item.tags) tagsById.set(link.tag.id, link.tag);
  }
  const tags = Array.from(tagsById.values());
  const images = items.flatMap((item) => item.images);
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), items, tags, images }, null, 2);
  return new NextResponse(payload, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="diecast-collection-export.json"',
    },
  });
}
