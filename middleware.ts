import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Start with a passthrough response — we'll mutate cookies on it.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Forward updated cookies onto both the outgoing request and response
          // so the browser and any downstream server logic stay in sync.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: use getUser() not getSession() — getUser() validates the JWT
  // with the Supabase auth server and cannot be spoofed by a tampered cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthPage      = pathname === "/auth";
  const isProtectedPage = pathname.startsWith("/quests") || pathname.startsWith("/onboarding");
  const isRootPage      = pathname === "/";

  // Unauthenticated → send to /auth
  if (!user && (isProtectedPage || isRootPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Authenticated on auth page or root → send to /quests
  if (user && (isAuthPage || isRootPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/quests";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static assets.
  // API routes handle their own auth, so exclude them too.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
