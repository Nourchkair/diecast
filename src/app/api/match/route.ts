import { NextResponse } from 'next/server';
import { findMatches } from '@/lib/match';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const matches = await findMatches(body, user.id);
  return NextResponse.json({ matches });
}
