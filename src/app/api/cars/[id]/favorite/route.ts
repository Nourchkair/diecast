import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

type Params = Promise<{ id: string }>;

export async function POST(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.carFavorite.upsert({
    where: { userId_itemId: { userId: user.id, itemId: id } },
    create: { userId: user.id, itemId: id },
    update: {},
  });

  await prisma.activityEvent.create({
    data: { actorUserId: user.id, type: 'FAVORITED_CAR', itemId: id, note: 'Favorited a car' },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.carFavorite.deleteMany({ where: { userId: user.id, itemId: id } });
  return NextResponse.json({ ok: true });
}
