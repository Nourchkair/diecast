import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tags = await prisma.tag.findMany({ where: { userId: user.id }, orderBy: { name: 'asc' } });
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Tag name required' }, { status: 400 });
  const existing = await prisma.tag.findFirst({ where: { userId: user.id, name } });
  const tag = existing
    ? await prisma.tag.update({ where: { id: existing.id }, data: { color: body.color ?? null } })
    : await prisma.tag.create({ data: { userId: user.id, name, color: body.color ?? null } });
  return NextResponse.json({ tag });
}
