import { NextResponse } from 'next/server';
import { createItemFromPayload, updateItemFromPayload } from '@/lib/items';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const createNew = Boolean(body.createNew ?? true);
  const payload = body.payload ?? body;

  if (createNew) {
    const item = await createItemFromPayload(payload, user.id);
    return NextResponse.json({ item });
  }

  if (!body.itemId) {
    return NextResponse.json({ error: 'itemId required when updating' }, { status: 400 });
  }

  const item = await updateItemFromPayload(body.itemId, payload, user.id);
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ item });
}
