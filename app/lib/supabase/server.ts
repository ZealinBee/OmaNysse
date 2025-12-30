import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie options for long-lived sessions (1 year)
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...COOKIE_OPTIONS,
              })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
