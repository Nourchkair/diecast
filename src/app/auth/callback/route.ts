import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { bootstrapCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await bootstrapCurrentUser(user);
  }

  return NextResponse.redirect(new URL('/collection', request.url));
}
