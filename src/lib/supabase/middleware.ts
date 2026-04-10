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
  const isAuthPage = pathname === '/';

  // /admin 경로는 자체 쿠키 인증 — Supabase Auth 우회
  if (pathname.startsWith('/admin')) {
    return supabaseResponse;
  }

  // redirect 시에도 세션 쓰기 보존: cookiesToSet이 이미 supabaseResponse에 반영되어 있으므로
  // cookies 배열 전체를 복사하되 options(Name/Value) 구조를 유지
  const makeRedirect = (to: URL) => {
    const redirect = NextResponse.redirect(to);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c);
    });
    return redirect;
  };

  if (!user && !isAuthPage) {
    return makeRedirect(new URL('/', request.url));
  }

  return supabaseResponse;
}
