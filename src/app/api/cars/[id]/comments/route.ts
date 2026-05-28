import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const comments = await prisma.carComment.findMany({
    where: { itemId: id },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const text = String(body?.body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });

  const comment = await prisma.carComment.create({
    data: { itemId: id, authorUserId: user.id, body: text },
    include: { author: true },
  });

  await prisma.activityEvent.create({
    data: {
      actorUserId: user.id,
      type: 'COMMENTED_CAR',
      itemId: id,
      note: text.slice(0, 140),
    },
  });

  return NextResponse.json({ comment });
}
