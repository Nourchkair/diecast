import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

type Params = Promise<{ slug: string }>;

const renameSchema = z.object({
  name: z.string().trim().min(1).max(64),
});

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid garage name' }, { status: 400 });

  const garage = await prisma.garage.findFirst({
    where: {
      slug,
      type: 'PERSONAL',
      personalOwnerId: user.id,
    },
  });
  if (!garage) return NextResponse.json({ error: 'Garage not found' }, { status: 404 });

  const updated = await prisma.garage.update({
    where: { id: garage.id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ garage: updated });
}
