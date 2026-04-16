import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 공개 페이지 — 로그인 없이 접근 가능
  const publicPaths = ['/', '/login', '/pricing', '/privacy', '/terms', '/quick-render', '/auth', '/api/auth'];
  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/api/ai-render') ||
    pathname.startsWith('/api/ai-analyze') ||
    pathname.startsWith('/api/share') ||
    pathname.startsWith('/api/renders');

  if (isPublic) {
    return supabaseResponse;
  }

  // 비로그인 → 홈으로 리다이렉트
  if (!user) {
    const redirect = NextResponse.redirect(new URL('/', request.url));
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c);
    });
    return redirect;
  }

  return supabaseResponse;
}
