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
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
  const item = await updateItemFromPayload(id, {
    id,
    displayName: has('displayName') ? body.displayName : existing.displayName,
    brand: has('brand') ? body.brand : existing.brand,
    make: has('make') ? body.make : existing.make,
    model: has('model') ? body.model : existing.model,
    year: has('year') ? body.year : existing.year,
    scale: has('scale') ? body.scale : existing.scale,
    series: has('series') ? body.series : existing.series,
    vehicleType: has('vehicleType') ? body.vehicleType : existing.vehicleType,
    color: has('color') ? body.color : existing.color,
    variant: has('variant') ? body.variant : existing.variant,
    productCode: has('productCode') ? body.productCode : existing.productCode,
    barcode: has('barcode') ? body.barcode : existing.barcode,
    condition: has('condition') ? body.condition : existing.condition,
    quantityOwned: has('quantityOwned') ? body.quantityOwned : existing.quantityOwned,
    isWishlist: has('isWishlist') ? Boolean(body.isWishlist) : existing.isWishlist,
    acquiredDate: has('acquiredDate') ? body.acquiredDate : existing.acquiredDate?.toISOString() ?? null,
    acquiredFrom: has('acquiredFrom') ? body.acquiredFrom : existing.acquiredFrom,
    storageLocation: has('storageLocation') ? body.storageLocation : existing.storageLocation,
    notes: has('notes') ? body.notes : existing.notes,
    tagNames: has('tagNames')
      ? Array.isArray(body.tagNames)
        ? body.tagNames
        : String(body.tagNames ?? '').split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : existing.tags.map((itemTag) => itemTag.tag.name),
    imagePaths: has('imagePaths') && Array.isArray(body.imagePaths) ? body.imagePaths : [],
    removedImageIds: has('removedImageIds') && Array.isArray(body.removedImageIds) ? body.removedImageIds : [],
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
