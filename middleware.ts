import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Cookie options for long-lived sessions (1 year)
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...COOKIE_OPTIONS,
            })
          );
        },
      },
    }
  );

  // Refresh session if expired. This must never block or crash the request:
  // a stale/corrupt auth cookie (e.g. after a password reset revokes the refresh
  // token) would otherwise make the refresh hang or throw on EVERY request for
  // that user, surfacing as a Vercel function timeout / Cloudflare 504. Incognito
  // works because it has no cookie. So we bound it with a timeout and, on any
  // failure, clear the auth cookies so the bad state self-heals (user is simply
  // logged out and can sign in again) instead of being permanently bricked.
  try {
    const TIMEOUT_MS = 3000;
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("getSession timeout")), TIMEOUT_MS)
      ),
    ]);

    if (result?.error) {
      clearAuthCookies(request, supabaseResponse);
    }
  } catch {
    // Timed out or threw — drop the bad session rather than 504 the user.
    clearAuthCookies(request, supabaseResponse);
  }

  return supabaseResponse;
}

// Remove Supabase auth cookies (including chunked `.0`, `.1` variants) so a
// corrupt session can't keep failing on every subsequent request.
function clearAuthCookies(request: NextRequest, response: NextResponse) {
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-") && name.includes("-auth-token")) {
      response.cookies.delete(name);
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
