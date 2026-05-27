import { NextResponse } from 'next/server';
import { getItemById, updateItemFromPayload } from '@/lib/items';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = await getItemById(id, user.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await getItemById(id, user.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await request.json();
  const item = await updateItemFromPayload(id, {
    ...body,
    displayName: body.displayName || '',
    brand: String(body.brand),
    make: String(body.make),
    model: String(body.model),
    tagNames: Array.isArray(body.tagNames) ? body.tagNames : String(body.tagNames ?? '').split(',').map((tag: string) => tag.trim()).filter(Boolean),
  }, user.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = await getItemById(id, user.id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.diecastItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
