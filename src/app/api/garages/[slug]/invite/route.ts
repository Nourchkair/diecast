import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

type Params = Promise<{ slug: string }>;

export async function POST(_request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const garage = await prisma.garage.findFirst({ where: { slug, members: { some: { userId: user.id } } } });
  if (!garage) return NextResponse.json({ error: 'Garage not found' }, { status: 404 });

  const token = randomUUID().replace(/-/g, '').slice(0, 16);
  const invite = await prisma.garageInvite.create({
    data: {
      garageId: garage.id,
      token,
      createdByUserId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  return NextResponse.json({ invite });
}
