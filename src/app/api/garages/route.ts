import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { listUserGarages, normalizeUsername } from '@/lib/social';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'garage';
}

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const garages = await listUserGarages(user.id);
  return NextResponse.json({ garages });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? '').trim();
  const description = String(body?.description ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Garage name required' }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const slugBase = slugify(name);
  const slug = `${slugBase}-${user.id.slice(0, 6).toLowerCase()}`;

  const garage = await prisma.garage.create({
    data: {
      name,
      slug,
      description: description || null,
      type: 'SHARED',
      createdByUserId: user.id,
      members: {
        create: { userId: user.id },
      },
    },
    include: {
      createdBy: true,
      members: { include: { user: true } },
    },
  });

  await prisma.activityEvent.create({
    data: {
      actorUserId: user.id,
      type: 'CREATED_GARAGE',
      garageId: garage.id,
      note: `${profile?.displayName ?? profile?.username ?? 'Someone'} created a garage`,
    },
  });

  return NextResponse.json({ garage });
}
