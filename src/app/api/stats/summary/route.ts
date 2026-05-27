import { NextResponse } from 'next/server';
import { getBreakdowns, getSummary } from '@/lib/stats';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [summary, breakdowns] = await Promise.all([getSummary(user.id), getBreakdowns(user.id)]);
  return NextResponse.json({ summary, breakdowns });
}
