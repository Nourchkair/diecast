import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { canonicalFriendPair, findProfileByLookup } from '@/lib/social';

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const identifier = String(body?.identifier ?? body?.username ?? '').trim();
  const userId = String(body?.userId ?? '').trim();

  const targetProfile = identifier ? await findProfileByLookup(identifier) : userId ? await prisma.userProfile.findUnique({ where: { userId } }) : null;
  if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (targetProfile.userId === user.id) return NextResponse.json({ error: 'You cannot friend yourself' }, { status: 400 });

  const pair = canonicalFriendPair(user.id, targetProfile.userId);
  const friendship = await prisma.friendship.findUnique({ where: { userAId_userBId: pair } }).catch(() => null);
  if (friendship) return NextResponse.json({ error: 'Already friends' }, { status: 409 });

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: targetProfile.userId },
        { senderId: targetProfile.userId, receiverId: user.id },
      ],
      status: 'PENDING',
    },
  });
  if (existing) return NextResponse.json({ error: 'Request already pending' }, { status: 409 });

  const requestRecord = await prisma.friendRequest.create({
    data: {
      senderId: user.id,
      receiverId: targetProfile.userId,
      status: 'PENDING',
    },
    include: { sender: true, receiver: true },
  });

  await prisma.activityEvent.create({
    data: {
      actorUserId: user.id,
      type: 'FRIEND_REQUEST_SENT',
      targetUserId: targetProfile.userId,
      note: 'Friend request sent',
    },
  });

  return NextResponse.json({ request: requestRecord });
}
