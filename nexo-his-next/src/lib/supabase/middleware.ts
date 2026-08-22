import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set(['/login', '/recuperar-senha', '/auth/callback']);
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(values) {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    }
  }});
  const { data: { user } } = await supabase.auth.getUser();
  const isPublic = PUBLIC_PATHS.has(request.nextUrl.pathname);
  if (!isPublic && !user) {
    const next = request.nextUrl.clone();
    next.pathname = '/login';
    next.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(next);
  }
  if (user && request.nextUrl.pathname === '/login') {
    const next = request.nextUrl.clone(); next.pathname = '/dashboard';
    return NextResponse.redirect(next);
  }
  return response;
}
