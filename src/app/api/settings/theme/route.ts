import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { getUserThemeSettings, upsertUserThemeSettings } from '@/lib/preferences';

const themeSchema = z.object({
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImageUrl: z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const theme = getUserThemeSettings(user);
  return NextResponse.json({ theme });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = themeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid theme settings' }, { status: 400 });
  }

  const { theme } = await upsertUserThemeSettings(supabase, parsed.data);
  return NextResponse.json({ theme });
}
