import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { canonicalFriendPair } from '@/lib/social';

type Params = Promise<{ id: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const nextStatus = String(body?.status ?? '').toUpperCase();
  if (!['ACCEPTED', 'REJECTED'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const friendRequest = await prisma.friendRequest.findUnique({ where: { id } });
  if (!friendRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  if (friendRequest.receiverId !== user.id && friendRequest.senderId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (friendRequest.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request already handled' }, { status: 409 });
  }

  const updated = await prisma.friendRequest.update({
    where: { id },
    data: { status: nextStatus as 'ACCEPTED' | 'REJECTED' },
    include: { sender: true, receiver: true },
  });

  if (nextStatus === 'ACCEPTED') {
    const pair = canonicalFriendPair(friendRequest.senderId, friendRequest.receiverId);
    await prisma.friendship.upsert({
      where: { userAId_userBId: pair },
      create: { ...pair },
      update: {},
    });

    await prisma.activityEvent.createMany({
      data: [
        {
          actorUserId: user.id,
          type: 'FRIEND_REQUEST_ACCEPTED',
          targetUserId: friendRequest.senderId === user.id ? friendRequest.receiverId : friendRequest.senderId,
          note: 'Friend request accepted',
        },
        {
          actorUserId: user.id,
          type: 'FRIEND_REQUEST_ACCEPTED',
          targetUserId: user.id,
          note: 'Friend request accepted',
        },
      ],
    });
  }

  return NextResponse.json({ request: updated });
}
