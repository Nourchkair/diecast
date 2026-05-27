import { NextResponse } from 'next/server';
import { createItemFromPayload, listItems } from '@/lib/items';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export async function GET(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const items = await listItems(Object.fromEntries(searchParams.entries()), user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.brand || !body.make || !body.model) {
    return NextResponse.json({ error: 'Brand, make, and model are required' }, { status: 400 });
  }
  const item = await createItemFromPayload({
    ...body,
    displayName: body.displayName || '',
    brand: String(body.brand),
    make: String(body.make),
    model: String(body.model),
    tagNames: Array.isArray(body.tagNames) ? body.tagNames : String(body.tagNames ?? '').split(',').map((tag: string) => tag.trim()).filter(Boolean),
    imagePaths: Array.isArray(body.imagePaths) ? body.imagePaths : [],
  }, user.id);
  return NextResponse.json({ item });
}
