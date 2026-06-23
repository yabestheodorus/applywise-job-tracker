import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// `/` is the public marketing landing page; these are the other public paths.
const PUBLIC_PATHS = ['/login', '/signup', '/auth'];

const isPublicPath = (pathname: string) =>
  pathname === '/' ||
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Refreshes the Supabase session on every request (keeps the access token
 * fresh) and gates the app: unauthenticated users are sent to /login (except
 * on public pages like the landing page), and signed-in users are bounced from
 * the landing/login/signup pages straight to their board.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token with Supabase — don't trust
  // getSession() in middleware. Keep this call right after creating the client.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname === '/' || pathname === '/login' || pathname === '/signup')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/board';
    return NextResponse.redirect(url);
  }

  return response;
}
