import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_STORAGE_KEY } from "./i18n/config";

// Cookie options for long-lived sessions (1 year)
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function middleware(request: NextRequest) {
  // First visit: pick the locale from the browser's language here so the page
  // renders in the right language immediately. Otherwise LocaleProvider detects
  // it on the client and has to reload the whole page.
  const detectedLocale = request.cookies.has(LOCALE_STORAGE_KEY)
    ? null
    : detectLocale(request);
  if (detectedLocale) {
    request.cookies.set(LOCALE_STORAGE_KEY, detectedLocale);
  }

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

  if (detectedLocale) {
    supabaseResponse.cookies.set(LOCALE_STORAGE_KEY, detectedLocale, {
      path: "/",
      maxAge: 31536000,
    });
  }

  return supabaseResponse;
}

// Same rule as LocaleProvider: Finnish if the browser's primary language is
// Finnish, English otherwise.
function detectLocale(request: NextRequest): "fi" | "en" | null {
  const header = request.headers.get("accept-language");
  if (!header) return null;
  return header.trim().toLowerCase().startsWith("fi") ? "fi" : "en";
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
     * - public transit data APIs, which never read the auth session
     */
    "/((?!api/stops|api/geocode|api/reverse-geocode|api/trip-pattern|api/vehicle-position|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
