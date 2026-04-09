import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// user id → { role, expiresAt } 모듈 캐시 (60초 TTL)
const roleCache = new Map<string, { role: string; expiresAt: number }>();
const ROLE_TTL_MS = 60_000;

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

  // /admin 경로 role 체크 (TTL 캐시로 DB round-trip 최소화)
  if (user && pathname.startsWith('/admin')) {
    const now = Date.now();
    const cached = roleCache.get(user.id);
    let role: string | null = null;

    if (cached && cached.expiresAt > now) {
      role = cached.role;
    } else {
      const { data: profile } = await supabase
        .from('iso_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role ?? null;
      if (role) {
        roleCache.set(user.id, { role, expiresAt: now + ROLE_TTL_MS });
      }
    }

    if (role !== 'admin') {
      return makeRedirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}
