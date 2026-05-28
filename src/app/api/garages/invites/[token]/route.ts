import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

type Params = Promise<{ token: string }>;

export async function POST(_request: Request, { params }: { params: Params }) {
  const { token } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invite = await prisma.garageInvite.findUnique({ where: { token }, include: { garage: true } });
  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: 'Invite already used' }, { status: 409 });
  if (invite.expiresAt.getTime() < Date.now()) return NextResponse.json({ error: 'Invite expired' }, { status: 410 });

  const member = await prisma.garageMember.upsert({
    where: { garageId_userId: { garageId: invite.garageId, userId: user.id } },
    create: { garageId: invite.garageId, userId: user.id },
    update: {},
  });

  const updatedInvite = await prisma.garageInvite.update({
    where: { token },
    data: {
      usedAt: new Date(),
      usedByUserId: user.id,
    },
  });

  await prisma.activityEvent.create({
    data: {
      actorUserId: user.id,
      type: 'JOINED_GARAGE',
      garageId: invite.garageId,
      note: 'Joined a shared garage',
    },
  });

  return NextResponse.json({ invite: updatedInvite, member });
}
