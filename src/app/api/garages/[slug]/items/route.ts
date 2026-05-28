import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

type Params = Promise<{ slug: string }>;

async function getAccessibleGarage(slug: string, userId: string) {
  return prisma.garage.findFirst({
    where: {
      slug,
      OR: [
        { personalOwnerId: userId },
        { members: { some: { userId } } },
      ],
    },
  });
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const garage = await getAccessibleGarage(slug, user.id);
  if (!garage) return NextResponse.json({ error: 'Garage not found' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const itemId = String(body?.itemId ?? '').trim();
  if (!itemId) return NextResponse.json({ error: 'Item required' }, { status: 400 });

  const item = await prisma.diecastItem.findFirst({ where: { id: itemId, userId: user.id } });
  if (!item) return NextResponse.json({ error: 'Item not found or not owned' }, { status: 404 });

  const link = await prisma.garageItem.upsert({
    where: { garageId_itemId: { garageId: garage.id, itemId } },
    create: { garageId: garage.id, itemId, addedByUserId: user.id },
    update: {},
  });

  await prisma.activityEvent.create({
    data: {
      actorUserId: user.id,
      type: 'SHARED_CAR',
      itemId,
      garageId: garage.id,
      note: 'Shared a car to a garage',
    },
  });

  return NextResponse.json({ link });
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const garage = await getAccessibleGarage(slug, user.id);
  if (!garage) return NextResponse.json({ error: 'Garage not found' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const itemId = String(body?.itemId ?? '').trim();
  if (!itemId) return NextResponse.json({ error: 'Item required' }, { status: 400 });

  await prisma.garageItem.deleteMany({ where: { garageId: garage.id, itemId } });
  return NextResponse.json({ ok: true });
}
