import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.next();

  const cookiesToSet: CookieToSet[] = [];
  const responseHeaders: Record<string, string> = {};
  const supabase = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookies, headers) {
        cookiesToSet.push(...cookies);
        Object.assign(responseHeaders, headers);
      },
    },
  });

  let user = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    return NextResponse.next();
  }
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const redirectToLogin = !user && !isLoginPage;
  const redirectToCollection = Boolean(user && isLoginPage);

  const response = redirectToLogin
    ? NextResponse.redirect(new URL('/login', request.url))
    : redirectToCollection
      ? NextResponse.redirect(new URL('/collection', request.url))
      : NextResponse.next();

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  Object.entries(responseHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|auth|api).*)'],
};
